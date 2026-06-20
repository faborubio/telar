<div align="center">

# 🧵 Telar

**Design System en Vue 3 + TypeScript** y **Tejido**, su app de referencia.

_Los tokens son los hilos; los componentes, la tela._

</div>

---

## Qué es esto

**Telar** es un monorepo con dos artefactos acoplados a propósito:

- **Telar** (`packages/ds`) — librería de Design System: tokens, primitives, componentes y patrones accesibles, versionada y publicable.
- **Tejido** (`packages/app`) — una SPA de administración/analytics construida **enteramente** sobre el DS. No es una demo de juguete: es la prueba de que el DS resuelve flujos reales (auth, tablas con datos, formularios complejos, modales, estados de carga/error, dark mode, navegación accesible).

La arquitectura completa, con sus decisiones (ADRs) y trade-offs, vive en **[SAD.md](SAD.md)**. El contexto operativo para retomar el trabajo, en **[CLAUDE.md](CLAUDE.md)**.

## Por qué existe

Un Design System sin un consumidor real es un catálogo de Storybook que nadie estresó. La app obliga al DS a ser correcto. Las prioridades de calidad, en orden: **mantenibilidad/reuso → accesibilidad → testabilidad → performance → consistencia visual → DX** (SAD §2).

## Stack

| Área                | Tecnología                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Framework           | Vue 3 (Composition API, `<script setup>`) + TypeScript estricto                                            |
| Monorepo            | pnpm workspaces + Turborepo                                                                                |
| Build               | Vite (ds en _library mode_, app SPA)                                                                       |
| Tokens              | Style Dictionary (3 niveles: primitive → semantic → component)                                             |
| Comportamiento a11y | Reka UI (headless)                                                                                         |
| Lógica headless     | TanStack Table · vee-validate + Zod                                                                        |
| Estado (app)        | Pinia                                                                                                      |
| Datos (dev/test)    | MSW (modo `mock`) · **Firebase** —Cloud Functions + Firestore + Auth— (modo `firebase`)                    |
| Backend (Fase 4)    | Serverless en Firebase, desarrollado local con el Emulator Suite                                           |
| Testing             | Vitest + Testing Library · vitest-axe / cypress-axe · Cypress (E2E) · Storybook test-runner (visual + axe) |
| Observabilidad      | Módulo vendor-agnóstico (errores + Web Vitals + versión embebida)                                          |
| Versionado          | SemVer + Changesets (`@telar/ds@0.1.1`)                                                                    |

## Requisitos

- **Node** ≥ 22.13 (lo exige pnpm 11.8; probado en v24.15).
- **pnpm** (se activa con `corepack enable`).
- **JDK 21+** — solo para el backend real con los emuladores de Firebase (Fase 4). El modo por defecto (`mock`, con MSW) no lo necesita.

## Arranque rápido

```bash
corepack enable          # habilita pnpm
pnpm install             # instala el workspace
pnpm tokens              # genera CSS vars + tipos TS desde los tokens
pnpm dev                 # levanta la app Tejido (modo mock: datos por MSW)
```

La app tiene **dos modos de datos** (la capa de services es la costura, SAD §6):

- **`mock`** (por defecto): MSW intercepta `/api/**`. Es lo que usan tests y E2E.
- **`firebase`**: backend real (Cloud Functions + Firestore + Firebase Auth) contra el Emulator Suite — ver [DEPLOY.md §4bis](DEPLOY.md).

## Scripts (raíz)

| Comando          | Qué hace                                                 |
| ---------------- | -------------------------------------------------------- |
| `pnpm dev`       | Levanta la app en modo desarrollo.                       |
| `pnpm build`     | Build de todos los paquetes.                             |
| `pnpm tokens`    | Regenera los tokens (Style Dictionary).                  |
| `pnpm typecheck` | Type-check estricto (`vue-tsc`).                         |
| `pnpm lint`      | ESLint (incl. regla de dependencia `ds ✗→ app`).         |
| `pnpm test`      | Tests unit + componente + contrato (Vitest).             |
| `pnpm size`      | Presupuestos de bundle (`size-limit`).                   |
| `pnpm e2e`       | E2E (Cypress + cypress-axe) sobre la app + MSW.          |
| `pnpm emulators` | Emulator Suite de Firebase. **Requiere JDK 21 en PATH.** |
| `pnpm changeset` | Registra un cambio para versionar el DS.                 |

- Storybook del DS: `pnpm -C packages/ds storybook` (dev, :6006) · `pnpm -C packages/ds build-storybook`.
- Regresión visual: `pnpm -C packages/ds test-storybook:ci` (smoke + axe + diff de pixel).
- App contra el backend real: `pnpm -C packages/app dev:firebase` (con `pnpm emulators` + `pnpm emulators:seed`).

## Estructura

```
telar/
├─ packages/
│  ├─ ds/      # Telar — Design System (publicable)
│  └─ app/     # Tejido — app de referencia
├─ functions/          # Backend serverless (Cloud Functions REST + Firestore + Auth) — Fase 4
├─ firebase.json · .firebaserc · firestore.rules   # config Firebase (emuladores + hosting)
├─ .github/workflows/   # CI
├─ .changeset/          # versionado del DS
└─ *.md                 # SAD, CLAUDE, AUDIT, DEPLOY, TROUBLESHOOTING
```

## Documentación

- **[SAD.md](SAD.md)** — arquitectura y decisiones (fuente de verdad).
- **[CLAUDE.md](CLAUDE.md)** — contexto maestro para retomar el trabajo.
- **[AUDIT.md](AUDIT.md)** — auditoría por fase.
- **[DEPLOY.md](DEPLOY.md)** — build, publicación y despliegue.
- **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** — errores conocidos y su solución.

## Enlaces

- **Repositorio:** https://github.com/faborubio/telar
- **Storybook (vitrina del DS):** https://faborubio.github.io/telar/

## Estado

**Fases 0–3 cerradas y auditadas.**

- **DS:** primitives, 8 componentes y 3 patrones (PageHeader, DataTable, FormField), versionado **`@telar/ds@0.1.1`**.
- **App Tejido:** flujos reales (listado con tabla, login con auth, detalle/edición), validación con Zod.
- **Endurecimiento (Fase 3):** E2E (Cypress + cypress-axe), regresión visual (Storybook test-runner: smoke + axe + diff de pixel determinista), observabilidad (errores + Web Vitals + versión embebida). El axe en navegador real destapó y corrigió contraste AA roto en tema oscuro.
- **CI/CD en verde:** typecheck, lint, tests, build, size budgets, Lighthouse, E2E y regresión visual.

**En curso — Fase 4 (productivización en GCP/Firebase):** Slice 1 cerrado — **backend real** (Cloud Functions REST + Firestore + Firebase Auth) con la app en **modo dual `mock | firebase`**, desarrollado local con el Emulator Suite. Siguiente: Slice 2 (Hosting + deploy). Ver roadmap en [SAD.md §12](SAD.md) y detalle por fase en [AUDIT.md](AUDIT.md).

## Autor

**Fabián Rubio** — Full Stack / Frontend.

## Licencia

Proyecto de portafolio. Uso y licencia por definir.
