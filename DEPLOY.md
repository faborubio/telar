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

- Gates ya activos: DoD ejecutable (contract tests), cobertura con umbral, size-limit, Lighthouse, a11y (axe en unit + **axe en E2E y en el test-runner, ambos en navegador real**, addon-a11y), **E2E (Cypress)** de flujos críticos, **regresión visual (Storybook test-runner: story-as-test + axe + diff de pixel, ADR-016)**.
- Pendiente Fase 3: publish real del DS.

> **Correr el E2E en local:** `pnpm e2e` (headless) o `pnpm e2e:open` (interactivo). Gotcha Windows: si Cypress falla con `bad option: --smoke-test`, limpiar `ELECTRON_RUN_AS_NODE` (ver TROUBLESHOOTING).
> **Correr la regresión visual en local:** `pnpm -C packages/ds build-storybook` y luego `pnpm -C packages/ds test-storybook:ci` (smoke + axe). Requiere Chromium de Playwright: `pnpm -C packages/ds exec playwright install chromium`.

**Diff de pixel (baselines deterministas, ADR-016):** el job `visual` de CI corre en `ubuntu-24.04` con `VISUAL_SNAPSHOTS=1` y **diffea contra baselines commiteados** (`packages/ds/__image_snapshots__/`, comparación SSIM). Los baselines **se generan en CI**, no en local (el render de fuentes Windows≠Linux): se siembran/actualizan con el workflow manual **`visual-snapshots.yml`** (`gh workflow run "Visual snapshots (seed/update baselines)"`), que los comitea al repo desde ese mismo runner. Un cambio visual aprobado se "acepta" re-corriendo ese workflow. En local el snapshot está desactivado por env (solo smoke + axe).

---

## 4. Despliegue del Storybook (vitrina del DS) — **activo**

El Storybook del DS se publica automáticamente en **GitHub Pages** en cada push a `main`:

- URL: **https://faborubio.github.io/telar/**
- Pages configurado con source = **GitHub Actions** (`build_type=workflow`).
- **Gotcha conocido:** la cuenta tenía el dominio `fabianrubio.me` (NXDOMAIN) en el repo `faborubio.github.io`, que forzaba un redirect a un dominio muerto. Se quitó (cname → null). Si un navegador aún redirige, es un **301 cacheado** (limpiar caché / incógnito). Ver [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

---

## 4bis. Backend Firebase + dev local con emuladores (Fase 4 — ADR-017/018)

El backend real vive en `functions/` (Cloud Functions REST + Firestore + Firebase Auth). La app tiene **modo dual** (`BACKEND`, por env): `mock` (MSW, por defecto) o `firebase`.

**Requisito:** **JDK 21+** para los emuladores. En este equipo hay un Temurin 21 portable en `C:\src\jdk21`; firebase usa el `java` del PATH, así que anteponerlo:

```bash
# PowerShell, antes de levantar emuladores:
$env:JAVA_HOME='C:\src\jdk21'; $env:PATH='C:\src\jdk21\bin;'+$env:PATH
```

**Flujo dev contra el backend real (3 terminales o background):**

```bash
pnpm -C functions build          # compila las Functions (tsc → lib/)
pnpm emulators                   # Firestore + Auth + Functions (demo-telar, offline)
pnpm emulators:seed              # siembra 12 usuarios (Firestore + Auth); clave: telar123
pnpm -C packages/app dev:firebase  # app en modo firebase (Vite proxya /api → Function)
```

- En `mock` (por defecto) nada de esto hace falta: MSW intercepta `/api/**` en el navegador, y tests/E2E corren igual.
- El proyecto `demo-telar` es **offline** (prefijo `demo-`): los emuladores nunca tocan la nube ni cobran.
- **Deploy real** (Hosting + Functions a un proyecto Firebase) y su workflow de CI con service account = **Slice 2** (requiere el proyecto + credenciales del usuario).

---

## 5. Despliegue a Firebase (Hosting + Functions) — Fase 4 / Slice 2 — ✅ EN VIVO

**App desplegada:** **https://telar-tejido.web.app** · demo `ada@telar.dev` / `telar123`.

### Estado actual del despliegue (para retomar)

- **Proyecto Firebase:** `fabian-portafolio` (**compartido** con el portafolio del autor). Por eso el deploy está **acotado** para no pisar nada:
  - **Hosting:** sitio dedicado **`telar-tejido`** (`hosting.site` en `firebase.json`). El sitio del portafolio queda intacto.
  - **Functions:** solo **`functions:api`** (Express REST sobre Firestore, región `us-central1`). No toca otras functions.
  - **Firestore:** región `us-central1`; reglas **no** se despliegan (las Functions usan Admin SDK). Datos en la colección `users`.
  - **Auth:** Email/Password. Los 12 usuarios demo se sembraron en el Auth del proyecto (clave `telar123`).
- **Config web** (pública) en GitHub → _Variables_: `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_APP_ID` (ya configuradas).
- **Service account** (Admin SDK, para el seed): **fuera del repo**, en `C:\src\telar-sa.json`. `.gitignore` bloquea claves SA. **No** está como secret de GitHub aún (el deploy CI automático está pendiente).
- **JDK 21** (`C:\src\jdk21`) solo para emuladores locales, no para el deploy.

### Re-desplegar (manual, como se hizo)

El deploy usa el `firebase login` del usuario (no un SA con permisos de deploy). Con la sesión activa:

```bash
# 1) build de la app en modo firebase (config pública) + functions
#    Crear packages/app/.env.production (gitignored) con:
#    VITE_BACKEND=firebase
#    VITE_FIREBASE_API_KEY=...  VITE_FIREBASE_AUTH_DOMAIN=...  VITE_FIREBASE_PROJECT_ID=...  VITE_FIREBASE_APP_ID=...
pnpm tokens && pnpm build
# 2) deploy acotado (NUNCA quitar el scope: protege el portafolio)
firebase deploy --only "hosting:telar-tejido,functions:api" --project fabian-portafolio
```

### Re-sembrar producción (si hace falta)

```bash
pnpm -C functions build
SEED_TARGET=prod GOOGLE_APPLICATION_CREDENTIALS="C:/src/telar-sa.json" GCLOUD_PROJECT=fabian-portafolio node functions/lib/seed.js
```

(El seed es idempotente. Sin `SEED_TARGET=prod`/SA, apunta al emulador.)

### Deploy automático en CI (pendiente, opcional)

El workflow [`deploy.yml`](.github/workflows/deploy.yml) está listo (solo `workflow_dispatch`, **gateado** por `vars.FIREBASE_PROJECT_ID`). Para activarlo falta un **service account con permisos de deploy** (Hosting Admin + Cloud Functions Admin + Service Account User) en el secret `FIREBASE_SERVICE_ACCOUNT`. Hoy el deploy se hace **a mano** (arriba), que ya funciona.

### Notas de despliegue de Functions con pnpm

- `functions/` no depende de paquetes del workspace (`workspace:*`); sus deps (`express`, `cors`, `firebase-admin`, `firebase-functions`) son npm puras, así que Firebase las instala en su build aislado sin chocar con pnpm. El `predeploy` de `firebase.json` corre `pnpm -C functions build` (tsc → `lib/`).
- **Fallback** si el deploy de Functions fallara por resolución de deps: bundlear con esbuild (`functions/src/index.ts` → un `lib/index.js` autocontenido, externalizando `firebase-admin`/`firebase-functions`). No hizo falta en el setup base.

> **Estado:** ✅ **desplegado y verificado en vivo** (https://telar-tejido.web.app). Deploy manual con `firebase login`; el deploy automático en CI queda pendiente (necesita un SA con permisos de deploy).

Checklist de release de la app:

- [x] Backend real en prod (Firebase): app `firebase`-mode + Functions + Firestore + Auth. **En vivo.**
- [~] Source maps para observabilidad: **ya se generan** en el build; falta **subirlos** a un proveedor real (Cloud Logging/Sentry — SAD §10.3) al conectar el transport (Slice 3).
- [x] Versión de DS y app embebidas en cada evento de telemetría. **Implementado** (Vite `define`).
- [x] Budgets de performance verificados (Lighthouse CI, size-limit — SAD §9). **Ya activos.**
- [ ] Deploy automático en CI (SA con permisos de deploy + secret `FIREBASE_SERVICE_ACCOUNT`).

---

## 6. Observabilidad (SAD §10.3) — **implementada (vendor-agnóstica)**

Módulo `packages/app/src/observability/`, cableado en `main.ts` con `initObservability()`:

- **Captura global de errores:** `error` + `unhandledrejection`. Source maps ya se generan en el build (`sourcemap: true` en `vite.config.ts`).
- **RUM de Web Vitals reales:** LCP/CLS/INP/FCP/TTFB vía `web-vitals`.
- **Trazabilidad:** versión de DS + app embebida en cada evento (Vite `define` leyendo los `package.json`), para correlacionar regresiones con releases.
- **Transport desacoplado** (`ObservabilityTransport`): consola por defecto; **conectar un DSN real** (Sentry/equivalente) es cambiar el transport, sin tocar a los emisores. Es config de despliegue, no de código — pendiente de activar al desplegar la app.
