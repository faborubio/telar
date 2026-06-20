# CLAUDE.md — Contexto maestro del proyecto Telar

> Este archivo es el **punto de entrada de contexto** para cualquier sesión (humana o de Claude).
> Si empiezas una sesión nueva, lee esto primero y sigue los enlaces. No asumas; consulta las fuentes.

---

## 0. Mapa de documentos (leer en este orden)

| Documento                                | Para qué sirve                                                                                                                           | Cuándo leerlo                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **[SAD.md](SAD.md)**                     | **Fuente de verdad arquitectónica**: contexto, drivers de calidad, ADR-001…018, capas, testing, performance, riesgos, roadmap por fases. | **Siempre primero.** Toda decisión técnica se justifica contra el SAD. |
| [README.md](README.md)                   | Qué es el proyecto, cómo levantarlo, scripts, estructura.                                                                                | Para correr/entender el proyecto.                                      |
| [AUDIT.md](AUDIT.md)                     | Auditoría al cierre de **cada fase**: qué se entregó, hallazgos, deuda, decisiones.                                                      | Al terminar/iniciar una fase.                                          |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Bitácora de errores ya resueltos para **no repetirlos**.                                                                                 | Ante cualquier error: buscar aquí antes de depurar de cero.            |
| [DEPLOY.md](DEPLOY.md)                   | Build, publicación del DS (Changesets) y despliegue de la app.                                                                           | Al publicar o desplegar.                                               |

> **Regla de oro de contexto:** cuando termines un trabajo relevante, **actualiza el .md que corresponda** (AUDIT al cerrar fase, TROUBLESHOOTING ante un error nuevo, README/DEPLOY si cambia el uso). El contexto que no se escribe, se pierde entre sesiones.

---

## 1. Qué es Telar (resumen de 30 segundos)

Monorepo con **dos artefactos acoplados a propósito**:

- **Telar** (`packages/ds`) — Design System en Vue 3 + TypeScript: tokens, primitives, componentes y patrones. Librería publicable y versionada.
- **Tejido** (`packages/app`) — App de referencia (panel admin/analytics) construida **enteramente** sobre el DS. Es el banco de pruebas que obliga al DS a ser correcto.

Metáfora rectora: los **tokens son los hilos**, los componentes son la **tela**.

**Regla de dependencia inviolable:** `app → ds` permitido; `ds → app` **prohibido** (validado por lint `no-restricted-imports`). Un DS que conoce a su consumidor está muerto.

---

## 2. Stack y decisiones fijadas (no re-litigar sin un ADR nuevo)

- **Gestor de paquetes:** pnpm (workspaces) + **Turborepo** (caché de tareas afectadas).
- **Framework:** Vue 3, Composition API, `<script setup lang="ts">` (ADR-001). TypeScript **estricto**.
- **Estado (solo en la app):** Pinia (ADR-004). El DS es _stateless_ de negocio.
- **Estilos:** CSS `scoped` + tokens, sin framework de utilidades (ADR-005). Cascada con `@layer reset, ds, app` y base con `:where()` (ADR-011).
- **Tokens:** 3 niveles `primitive → semantic → component`, generados con **Style Dictionary** → CSS vars + tipos TS (ADR-009). Theming dark/light = reasignar el nivel semántico vía `data-theme` (ADR-003).
- **Comportamiento accesible (headless):** **Reka UI** como peer dependency, encapsulada tras la API pública (ADR-008).
- **Lógica headless:** TanStack Table (tablas) + vee-validate & Zod (forms) (ADR-010). Virtualización con TanStack Virtual solo donde el volumen lo exige (ADR-012).
- **Datos:** MSW intercepta a nivel de red en dev/test (ADR-006).
- **Testing:** Vitest + Testing Library (unit/component), vitest-axe / cypress-axe (a11y), Cypress (E2E), Storybook + visual regression.
- **Versionado:** SemVer + Changesets (ADR-007).

> Estas decisiones están razonadas en el SAD §5. **No cambiar sin agregar un ADR** con contexto y trade-offs.

---

## 3. Estructura del repo

```
telar/
├─ packages/
│  ├─ ds/      # Telar — librería (tokens, primitives, components, composables, directives)
│  └─ app/     # Tejido — SPA de referencia (pages, features, stores, services, router)
├─ functions/          # Backend serverless (Cloud Functions REST + Firestore + Auth) — Fase 4
├─ firebase.json · .firebaserc · firestore.rules/indexes   # config Firebase (emuladores+hosting)
├─ .github/workflows/   # CI/CD
├─ .changeset/          # Changesets (versionado del DS)
├─ turbo.json           # pipeline de tareas
├─ pnpm-workspace.yaml
└─ *.md                 # esta documentación de contexto
```

Detalle de capas del DS y flujo de datos: **SAD §4 y §6**.

---

## 4. Comandos (raíz del monorepo)

> Todos vía pnpm + Turborepo. Turbo solo rebuildea/testea lo afectado.

| Comando                                 | Qué hace                                                                |
| --------------------------------------- | ----------------------------------------------------------------------- |
| `pnpm install`                          | Instala dependencias del workspace.                                     |
| `pnpm tokens`                           | Genera CSS vars + tipos TS desde los tokens (Style Dictionary).         |
| `pnpm dev`                              | Levanta la app (`packages/app`) en modo dev.                            |
| `pnpm build`                            | Build de todos los paquetes (ds en modo library, app SPA).              |
| `pnpm typecheck`                        | `vue-tsc` estricto en todo el workspace.                                |
| `pnpm lint`                             | ESLint (incluye regla de dependencia `ds ✗→ app`).                      |
| `pnpm test`                             | Vitest (unit + component + **contrato/DoD**) en ambos paquetes.         |
| `pnpm size`                             | Presupuestos de bundle (`size-limit`); rompe si excede budget.          |
| `pnpm lighthouse`                       | Lighthouse CI sobre la app construida (corre en CI).                    |
| `pnpm e2e`                              | E2E (Cypress) de flujos críticos sobre el server de dev + MSW.          |
| `pnpm -C packages/ds test-storybook:ci` | Regresión visual: test-runner (smoke + axe por story).                  |
| `pnpm emulators`                        | Emulator Suite (Firestore+Auth+Functions). **Requiere JDK 21 en PATH.** |
| `pnpm emulators:seed`                   | Siembra el emulador (Firestore + usuarios de Auth, clave `telar123`).   |
| `pnpm -C packages/app dev:firebase`     | App en modo backend real (Firebase), contra los emuladores.             |
| `pnpm changeset`                        | Registra un cambio para versionar el DS (Changesets).                   |
| `pnpm -C packages/ds storybook`         | Storybook del DS en dev (:6006).                                        |
| `pnpm -C packages/app dev`              | Forma explícita de correr un paquete concreto.                          |

(La tabla se mantiene al día conforme se agregan scripts; ver README para el detalle.)

---

## 5. Convenciones de trabajo (cómo se construye aquí)

1. **El test se escribe con el código, no después** (SAD §7). Un componente no está "hecho" sin su DoD completo (SAD §7, "Definición de Done"). El DoD es **ejecutable** (ADR-013): `src/test/contracts.test.ts` rompe el build si un componente no tiene `.vue`/`.stories.ts`/`.test.ts` o si un SFC usa colores literales; la cobertura tiene umbral; `size-limit` y Lighthouse CI verifican performance.
2. **Sin valores mágicos:** nada de hex/px sueltos en componentes; solo tokens semánticos/de componente.
3. **Accesibilidad no es opcional:** 0 violaciones críticas de axe; navegable por teclado. El comportamiento complejo viene de Reka UI, no se reinventa.
4. **API pública explícita:** lo que no está en `packages/ds/src/index.ts` no es parte del contrato. Exports nombrados, `sideEffects` declarado (el CSS cuenta).
5. **Cada fase cierra con auditoría** en [AUDIT.md](AUDIT.md) y un commit coherente.
6. **Ante un error:** primero busca en [TROUBLESHOOTING.md](TROUBLESHOOTING.md); si es nuevo, regístralo al resolverlo.

---

## 6. Estado actual del proyecto

> Mantener esta sección como el "dónde estamos". Actualizar al cerrar cada fase.

- **Fase 0 — Cimientos:** ✅ **cerrada y auditada** (2026-06-18). Monorepo pnpm+Turborepo, TS estricto, ESLint con regla `ds ✗→ app` (verificada en vivo), pipeline de tokens 3 niveles + theming dark/light, primitives Box/Stack/Text/Icon, `useTheme`, app SPA consumiendo el DS, CI + Changesets. Verificaciones en verde (typecheck/lint/test/build, JS app 38.7 kB gzip). Detalle y deuda aceptada en [AUDIT.md](AUDIT.md).
- **Fase 1 — Núcleo del DS:** ✅ **cerrada (2026-06-19)**, en 2 slices.
  - **Slice 1:** Button, Input, Modal + Storybook 8 (addon-a11y + toolbar de tema) + cobertura con umbral. Patrón de alta de componente fijado.
  - **Slice 2:** Checkbox, RadioGroup, Select, Tabs, Toast (useToast). Todos sobre Reka UI.
  - **Componentes del DS:** Button, Input, Modal, Checkbox, RadioGroup, Select, Tabs, ToastProvider · primitives Box/Stack/Text/Icon · composables useTheme/useToast. Tests 46/46, cobertura 99.7% líneas/80% branches. Ver AUDIT.md → Fase 1.
  - **Comandos:** `pnpm -C packages/ds storybook` (dev, :6006), `pnpm -C packages/ds build-storybook`. Patrón de componente: `packages/ds/src/components/<Name>/` con `.vue` + `.stories.ts` + `.test.ts`, export en `index.ts`. Los componentes interactivos se montan sobre Reka UI (verificar el prop de modelo en su `.d.ts`); en tests usar `findBy*` (Presence/portales).
- **Fase 2 — Patrones + app:** ✅ **cerrada (2026-06-19)**, en 2 slices.
  - **Slice 1:** PageHeader + DataTable (genérico, sobre TanStack Table) en `src/patterns/`. App: MSW (usuarios), capa service→store(Pinia)→UsersPage, ruta `/users`. ADR-006 validado.
  - **Slice 2:** FormField (bridge vee-validate↔Input, vee-validate como **peer dep**). App: login con auth + guard de ruta, detalle/edición (`/users/:id`) con Zod (`toTypedSchema`) + Toast de éxito. ToastProvider en App.vue.
  - **Patrones del DS:** PageHeader, DataTable, FormField (en `src/patterns/<Name>/`, mismo trío .vue+.stories+.test; gates de DoD los cubren).
  - **App:** flujos reales (listado, login, detalle) con estados loading/empty/error, MSW en `src/mocks/` (handlers compartidos dev+test, worker en `public/`), Zod en `src/schemas/`, stores `users`/`auth`/`ui`. Deps directas: `@tanstack/vue-table`, `vee-validate`, `zod`, `@vee-validate/zod`. Credenciales demo: cualquier email del seed + `telar123`.
- **Fase 3 — Endurecimiento:** ✅ **cerrada (2026-06-20)**, en 3 slices. (Lighthouse CI + size budgets ya activos desde Fase 1).
  - **Slice 1 — E2E (Cypress):** ✅ **cerrado (2026-06-19).** Cypress 14 + cypress-axe sobre el server de dev con MSW. **4 specs / 12 tests en verde** (login+guard, tabla filtro/orden/paginación, detalle/edición+Toast+persistencia, error de red con override de MSW vía `window`). Comandos `pnpm e2e` / `pnpm e2e:open`; job `e2e` en CI (action oficial de Cypress). Selección por rol/label accesible (SAD §7). **El axe en navegador real destapó contraste AA roto en tema oscuro** (jsdom no lo ve): botón primario y enlaces; corregido en tokens (`action` dark `blue.600/700/800` + nuevos `color.link`/`link-hover`), changeset `a11y-dark-contrast`. Gotcha local: limpiar `ELECTRON_RUN_AS_NODE` antes de Cypress (ver TROUBLESHOOTING). Detalle en AUDIT.md → Fase 3 / Slice 1.
  - **Slice 2 — Visual regression + observabilidad:** ✅ **cerrado (2026-06-19; pixel-diff añadido 2026-06-20).** **Regresión visual** (ADR-016): `@storybook/test-runner` corre cada story en Chromium con 3 capas — smoke "story-as-test" + axe por story + **diff de pixel** (`jest-image-snapshot`, SSIM) → **31/31, 0 violaciones**; `pnpm -C packages/ds test-storybook:ci`, job `visual` en CI. **Pixel determinista** fijando el entorno: job en `ubuntu-24.04` con `VISUAL_SNAPSHOTS=1` diffea contra baselines commiteados; los baselines se siembran desde CI con el workflow manual `visual-snapshots.yml` (no en local Windows; el snapshot se gatea por env). **Observabilidad** (SAD §10.3): módulo vendor-agnóstico `app/src/observability/` (errores + Web Vitals + versión DS/app embebida vía Vite `define`), transport desacoplado (consola hoy, DSN real al desplegar), `initObservability()` en `main.ts`. Deps: DS `@storybook/test-runner`/`axe-playwright`; app `web-vitals`. Detalle en AUDIT.md → Fase 3 / Slice 2.
  - **Slice 3 — Primer release del DS:** ✅ **cerrado (2026-06-20).** **`@telar/ds@0.1.1`** (`changeset version` consumió el changeset de a11y → patch + CHANGELOG). Workflow `release.yml` (Changesets en push a `main`: PR "Version Packages"); **publish gateado** (DS vía `workspace:*`; habilitar = descomentar `publish: pnpm release` + `NPM_TOKEN`, que crea tag + GitHub Release). Detalle en AUDIT.md → Fase 3 / Slice 3.
- **Fase 4 — Productivización en GCP/Firebase:** 🔶 **en curso**, en slices. Plan: Slice 1 — backend real (emuladores); Slice 2 — Hosting + deploy CI; Slice 3 — observabilidad real (Cloud Logging); Slice 4 (opcional) — publish del DS. Evoluciona §1.3 (ADR-017/018).
  - **Slice 1 — Backend real con emuladores:** ✅ **cerrado (2026-06-20).** **Cloud Functions** (Express, función `api`) exponiendo API REST sobre **Firestore**, con **Firebase Auth** real (cada endpoint verifica el ID token). La app pasa a **modo dual `mock | firebase`** (selector `BACKEND` por env, costura en la capa de services SAD §6): `mock` (MSW + auth fake) = tests/E2E/dev por defecto; `firebase` (`pnpm -C packages/app dev:firebase`) = Functions+Firestore+Auth reales vía emuladores. **Validado en vivo** (curl: 401 sin token, 200+12 con token; proxy de Vite ok) con la suite existente **intacta** (app 11/11 en mock). Backend en `functions/` (paquete pnpm), config Firebase en la raíz. **Requiere JDK 21+** para los emuladores (ver §7 y TROUBLESHOOTING). Detalle en AUDIT.md → Fase 4 / Slice 1.
  - **Slice 2 — Hosting + deploy:** ✅ **desplegado y verificado en vivo (2026-06-20).** App en **https://telar-tejido.web.app** (proyecto compartido `fabian-portafolio`, sitio `telar-tejido` para no pisar el portafolio; `functions:api`). Backend real verificado en prod (login Firebase Auth RS256 → `/api/users` 200 + 12 usuarios desde Firestore; sin token → 401). Deploy hecho a mano con el `firebase login` del usuario (`firebase deploy --only hosting:telar-tejido,functions:api`); seed de prod vía SA (`SEED_TARGET=prod`). Credenciales demo: `ada@telar.dev`/`telar123`. Workflow `deploy.yml` (solo `workflow_dispatch`) listo para CI cuando haya un SA con permisos de deploy + secret. **Seguridad:** la SA vive fuera del repo (`C:\src\telar-sa.json`); `.gitignore` bloquea claves SA. Detalle en AUDIT.md → Fase 4 / Slice 2.

Detalle del roadmap: **SAD §12**. Resultado de cada fase: **[AUDIT.md](AUDIT.md)**.

---

## 7. Entorno de desarrollo conocido

- OS: Windows 11. Shell primaria: PowerShell 7+ (pwsh). Bash POSIX disponible.
- **Node ≥ 22.13** (lo exige pnpm 11.8; probado en v24.15) · pnpm: vía corepack (11.8.0) · git: 2.51.
- **Emuladores de Firebase (Fase 4): requieren JDK 21+.** Hay un Temurin 21 portable en `C:\src\jdk21`; firebase usa el `java` del **PATH**, así que anteponer `C:\src\jdk21\bin` antes de `pnpm emulators` (ver TROUBLESHOOTING). `firebase-tools` está instalado global.
- Branch por defecto: `main` (trunk-based, SAD §10.2).
- **Remoto:** `origin` = https://github.com/faborubio/telar (push por HTTPS con token de `gh`; el remote estaba en SSH pero no hay clave cargada aquí → se usa HTTPS).
- Commits multi-línea: el sandbox bloquea here-strings de PowerShell; usar `git commit -F <archivo>` (escribir el mensaje a un archivo temporal y borrarlo).

## 8. Enlaces vivos

- **Repo:** https://github.com/faborubio/telar (público).
- **Storybook desplegado:** https://faborubio.github.io/telar/ (deploy automático a GitHub Pages en cada push a `main`, vía `.github/workflows/storybook.yml`).
- **CI:** `.github/workflows/ci.yml` (verify + Lighthouse + **E2E Cypress** + **regresión visual**). Verde. Requiere Node 22 en CI. Release del DS vía `.github/workflows/release.yml` (Changesets; publish gateado).
- Nota Pages: el dominio de cuenta `fabianrubio.me` (NXDOMAIN) se quitó del repo `faborubio.github.io`; si un navegador aún redirige ahí, es un **301 cacheado** (limpiar caché / incógnito), no un fallo del deploy.
