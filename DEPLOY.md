# DEPLOY.md — Build, publicación y despliegue

> Cómo se construye, versiona y publica el DS, y cómo se despliega. **Estado:** CI (`ci.yml`) y deploy de Storybook a GitHub Pages (`storybook.yml`) **activos y en verde**; size-limit + Lighthouse activos. Pendiente de Fase 3: visual regression, E2E y publish real del DS.

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
pnpm changeset version     # aplica los bumps y actualiza CHANGELOG
pnpm -C packages/ds build  # build de la librería
# pnpm -C packages/ds publish   # publica al registry (privado) — habilitado en Fase 3
```

- **Breaking change → major**, siempre con nota de migración (SAD §5, ADR-007).
- El registry de publicación (privado) se configura cuando se extraiga el DS. Hasta entonces, la app lo consume vía workspace (`workspace:*`).

---

## 3. CI/CD (SAD §10) — **estado real**

Repo: https://github.com/faborubio/telar · Branching: **trunk-based**, `main` siempre desplegable.

**Workflows activos** (`.github/workflows/`):

- **`ci.yml`** — en cada push/PR. Job `verify`: install → `tokens` → typecheck → lint → test → build → **`size`** (size-limit). Job `lighthouse`: build app → Lighthouse CI (a11y _error_, performance _warn_). **Requiere Node 22** (pnpm 11.8 usa `node:sqlite`).
- **`storybook.yml`** — en cada push a `main`: build-storybook → deploy a **GitHub Pages**. Genera tokens antes de construir (son artefacto gitignoreado).

**Pipeline completo objetivo** (SAD §10.1, lo que falta entra en Fase 3):

```
install → typecheck → lint → unit+component → build DS → build app
        → size budgets ✅ → Lighthouse CI ✅ → Storybook deploy ✅
        → [Fase 3] visual regression → E2E (Cypress) → publish del DS
```

- Gates ya activos: DoD ejecutable (contract tests), cobertura con umbral, size-limit, Lighthouse, a11y (axe en tests + addon-a11y).
- Pendiente Fase 3: visual regression (Chromatic/test-runner), E2E (Cypress), publish real del DS.

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
- [ ] Source maps subidos para observabilidad (Sentry o equivalente — SAD §10.3).
- [ ] Versión de DS y app embebidas en cada evento de telemetría.
- [x] Budgets de performance verificados (Lighthouse CI, size-limit — SAD §9). **Ya activos.**

---

## 6. Observabilidad (SAD §10.3)

- Captura global de errores con source maps.
- RUM de Web Vitals reales (LCP/CLS/INP).
- Trazabilidad: versión de DS + app en cada evento, para correlacionar regresiones con releases.

_(Configuración concreta se documenta al implementarse en Fase 3.)_
