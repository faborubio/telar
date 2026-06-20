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

## 5. Despliegue a Firebase (Hosting + Functions) — Fase 4 / Slice 2

La app va a **Firebase Hosting** (con rewrite `/api/** → Functions`) y el backend a **Cloud Functions** + **Firestore** + **Firebase Auth**. El workflow [`deploy.yml`](.github/workflows/deploy.yml) lo automatiza, **gateado** por la variable de repo `FIREBASE_PROJECT_ID` (mientras no exista, es un no-op: el push a main no falla).

### Pasos del usuario (una vez) — lo que requiere tu cuenta GCP/Firebase

1. **Crear el proyecto** (Blaze ya activo): consola de Firebase → _Add project_ (o `firebase projects:create telar-prod`). Anota el **Project ID**.
2. **Habilitar servicios** en la consola: **Authentication** → proveedor _Email/Password_; **Firestore Database** → crear en modo producción.
3. **App web + config:** _Project settings → General → Your apps → Web app_. Copia el objeto `firebaseConfig` (`apiKey`, `authDomain`, `projectId`, `appId`). **No es secreto** (viaja al cliente).
4. **Service account para CI:** _Project settings → Service accounts → Generate new private key_ (JSON). Da permisos de deploy (rol _Firebase Admin_ / _Cloud Functions Admin_ + _Firebase Hosting Admin_ si afinas).
5. **Configurar GitHub** (_Settings → Secrets and variables → Actions_):
   - **Variables:** `FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_APP_ID`.
   - **Secret:** `FIREBASE_SERVICE_ACCOUNT` = contenido del JSON del paso 4.
6. **Seed de producción** (datos + usuarios reales): apuntar el seed al proyecto real (sin emulador) —
   `GCLOUD_PROJECT=<project-id> GOOGLE_APPLICATION_CREDENTIALS=<sa.json> node functions/lib/seed.js` con las env del emulador **desactivadas**. (Crea 12 usuarios de Auth con la clave demo; cámbiala si el demo es público.)

Con eso, cada push a `main` (o `workflow_dispatch`) **despliega**. También se puede desplegar a mano: `firebase login` y `firebase deploy --only hosting,functions --project <id>`.

### Notas de despliegue de Functions con pnpm

- `functions/` no depende de paquetes del workspace (`workspace:*`); sus deps (`express`, `cors`, `firebase-admin`, `firebase-functions`) son npm puras, así que Firebase las instala en su build aislado sin chocar con pnpm. El `predeploy` de `firebase.json` corre `pnpm -C functions build` (tsc → `lib/`).
- **Fallback** si el deploy de Functions fallara por resolución de deps: bundlear con esbuild (`functions/src/index.ts` → un `lib/index.js` autocontenido, externalizando `firebase-admin`/`firebase-functions`). No hizo falta en el setup base.

> **Estado:** infraestructura **lista y commiteada**; el deploy real se activa al completar los pasos 1–5 (requieren la cuenta del usuario). El job está gateado hasta entonces.

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
