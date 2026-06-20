# DEPLOY.md — Build, publicación y despliegue

> Cómo se construye, versiona y publica el DS, y cómo se despliega. **Estado:** CI (`ci.yml`) y deploy de Storybook a GitHub Pages (`storybook.yml`) **activos y en verde**; size-limit + Lighthouse + **E2E (Cypress)** + **regresión visual (Storybook test-runner)** activos; **observabilidad** implementada en la app. Pendiente de Fase 3: publish real del DS.

---

## 1. Build local

```bash
pnpm install
pnpm tokens        # genera tokens antes de compilar (CSS vars + tipos TS)
pnpm build         # build de todo el workspace (Turborepo respeta el grafo)
```

- **DS (`packages/ds`)** compila en **library mode** (Vite): ESM + tipos, con `sideEffects` declarado para preservar tree-shaking (el CSS importado cuenta como side effect — SAD §9).
- **App (`packages/app`)** compila como **SPA** estática (HTML + JS + CSS) lista para servir desde cualquier hosting de estáticos/CDN.

El orden importa: `tokens` → `ds` → `app`. Turborepo lo encadena por el grafo de dependencias.

---

## 2. Versionado y publicación del DS (Changesets — ADR-007)

SemVer estricto. Cada PR que cambie el DS debe incluir un changeset.

```bash
pnpm changeset             # describe el cambio (patch/minor/major) + nota de migración si es breaking
pnpm version-packages      # = changeset version: aplica los bumps y actualiza CHANGELOG
pnpm release               # build del DS + changeset publish (crea tag + GitHub Release) — gateado
```

- **Estado:** el DS está en **`0.1.1`** (primer release versionado). El bump `0.1.0 → 0.1.1` (patch) lo generó el changeset de a11y de la Fase 3; ver `packages/ds/CHANGELOG.md`.
- **Automatización:** `.github/workflows/release.yml` corre Changesets en cada push a `main`: con changesets pendientes abre/actualiza la PR **"Version Packages"** (aplica bumps + CHANGELOG al mergear).
- **Publish gateado a propósito:** hoy la app consume el DS vía `workspace:*`; el registry privado se configura **al extraer** la librería. Para habilitar la publicación real: descomentar `publish: pnpm release` en el workflow y añadir el secret `NPM_TOKEN` (+ `.npmrc`). `changeset publish` crea el **tag git** y, con él, la **GitHub Release**.
- **Breaking change → major**, siempre con nota de migración (SAD §5, ADR-007).

---

## 3. CI/CD (SAD §10) — **estado real**

Repo: https://github.com/faborubio/telar · Branching: **trunk-based**, `main` siempre desplegable.

**Workflows activos** (`.github/workflows/`):

- **`ci.yml`** — en cada push/PR. Job `verify`: install → `tokens` → typecheck → lint → test → build → **`size`** (size-limit). Job `lighthouse`: build app → Lighthouse CI (a11y _error_, performance _warn_). Job `e2e`: install → tokens → build → **Cypress** (action oficial, Xvfb + caché del binario) sobre el server de dev con MSW. **Requiere Node 22** (pnpm 11.8 usa `node:sqlite`).
- **`storybook.yml`** — en cada push a `main`: build-storybook → deploy a **GitHub Pages**. Genera tokens antes de construir (son artefacto gitignoreado).

**Pipeline completo objetivo** (SAD §10.1, lo que falta entra en Fase 3):

```
install → typecheck → lint → unit+component → build DS → build app
        → size budgets ✅ → Lighthouse CI ✅ → E2E Cypress ✅
        → visual regression (test-runner) ✅ → Storybook deploy ✅
        → [Fase 3] publish del DS
```

- Gates ya activos: DoD ejecutable (contract tests), cobertura con umbral, size-limit, Lighthouse, a11y (axe en unit + **axe en E2E y en el test-runner, ambos en navegador real**, addon-a11y), **E2E (Cypress)** de flujos críticos, **regresión visual (Storybook test-runner: story-as-test + axe por story, ADR-016)**.
- Pendiente Fase 3: publish real del DS.

> **Correr el E2E en local:** `pnpm e2e` (headless) o `pnpm e2e:open` (interactivo). Gotcha Windows: si Cypress falla con `bad option: --smoke-test`, limpiar `ELECTRON_RUN_AS_NODE` (ver TROUBLESHOOTING).
> **Correr la regresión visual en local:** `pnpm -C packages/ds build-storybook` y luego `pnpm -C packages/ds test-storybook:ci`. Requiere Chromium de Playwright: `pnpm -C packages/ds exec playwright install chromium`.

---

## 4. Despliegue del Storybook (vitrina del DS) — **activo**

El Storybook del DS se publica automáticamente en **GitHub Pages** en cada push a `main`:

- URL: **https://faborubio.github.io/telar/**
- Pages configurado con source = **GitHub Actions** (`build_type=workflow`).
- **Gotcha conocido:** la cuenta tenía el dominio `fabianrubio.me` (NXDOMAIN) en el repo `faborubio.github.io`, que forzaba un redirect a un dominio muerto. Se quitó (cname → null). Si un navegador aún redirige, es un **301 cacheado** (limpiar caché / incógnito). Ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## 5. Despliegue de la app (Tejido)

> Pendiente de activar (Fase 3). La app es una SPA estática: cualquier hosting de estáticos con fallback SPA (todas las rutas → `index.html`) sirve. Podría añadirse un workflow análogo al de Storybook.

Checklist de release de la app (se completará):

- [ ] Variables de entorno (endpoints reales vs MSW; hoy MSW arranca solo en dev).
- [~] Source maps para observabilidad: **ya se generan** en el build; falta **subirlos** a un proveedor real (Sentry/equivalente — SAD §10.3) al conectar el transport.
- [x] Versión de DS y app embebidas en cada evento de telemetría. **Implementado** (Vite `define`).
- [x] Budgets de performance verificados (Lighthouse CI, size-limit — SAD §9). **Ya activos.**

---

## 6. Observabilidad (SAD §10.3) — **implementada (vendor-agnóstica)**

Módulo `packages/app/src/observability/`, cableado en `main.ts` con `initObservability()`:

- **Captura global de errores:** `error` + `unhandledrejection`. Source maps ya se generan en el build (`sourcemap: true` en `vite.config.ts`).
- **RUM de Web Vitals reales:** LCP/CLS/INP/FCP/TTFB vía `web-vitals`.
- **Trazabilidad:** versión de DS + app embebida en cada evento (Vite `define` leyendo los `package.json`), para correlacionar regresiones con releases.
- **Transport desacoplado** (`ObservabilityTransport`): consola por defecto; **conectar un DSN real** (Sentry/equivalente) es cambiar el transport, sin tocar a los emisores. Es config de despliegue, no de código — pendiente de activar al desplegar la app.
