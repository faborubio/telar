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

| Área                | Tecnología                                                                |
| ------------------- | ------------------------------------------------------------------------- |
| Framework           | Vue 3 (Composition API, `<script setup>`) + TypeScript estricto           |
| Monorepo            | pnpm workspaces + Turborepo                                               |
| Build               | Vite (ds en _library mode_, app SPA)                                      |
| Tokens              | Style Dictionary (3 niveles: primitive → semantic → component)            |
| Comportamiento a11y | Reka UI (headless)                                                        |
| Lógica headless     | TanStack Table · vee-validate + Zod                                       |
| Estado (app)        | Pinia                                                                     |
| Datos (dev/test)    | MSW                                                                       |
| Testing             | Vitest + Testing Library · vitest-axe / cypress-axe · Cypress · Storybook |
| Versionado          | SemVer + Changesets                                                       |

## Requisitos

- **Node** ≥ 22.13 (lo exige pnpm 11.8; probado en v24.15).
- **pnpm** (se activa con `corepack enable`).

## Arranque rápido

```bash
corepack enable          # habilita pnpm
pnpm install             # instala el workspace
pnpm tokens              # genera CSS vars + tipos TS desde los tokens
pnpm dev                 # levanta la app Tejido
```

## Scripts (raíz)

| Comando          | Qué hace                                         |
| ---------------- | ------------------------------------------------ |
| `pnpm dev`       | Levanta la app en modo desarrollo.               |
| `pnpm build`     | Build de todos los paquetes.                     |
| `pnpm tokens`    | Regenera los tokens (Style Dictionary).          |
| `pnpm typecheck` | Type-check estricto (`vue-tsc`).                 |
| `pnpm lint`      | ESLint (incl. regla de dependencia `ds ✗→ app`). |
| `pnpm test`      | Tests unit + componente + contrato (Vitest).     |
| `pnpm size`      | Presupuestos de bundle (`size-limit`).           |
| `pnpm changeset` | Registra un cambio para versionar el DS.         |

Storybook del DS: `pnpm -C packages/ds storybook` (dev, :6006) · `pnpm -C packages/ds build-storybook`.

## Estructura

```
telar/
├─ packages/
│  ├─ ds/      # Telar — Design System (publicable)
│  └─ app/     # Tejido — app de referencia
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

## Estado

🚧 **Fase 0 — Cimientos** en construcción. Ver roadmap en [SAD.md §12](SAD.md) y avance en [AUDIT.md](AUDIT.md).

## Autor

**Fabián Rubio** — Full Stack / Frontend.

## Licencia

Proyecto de portafolio. Uso y licencia por definir.
