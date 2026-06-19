# CLAUDE.md — Contexto maestro del proyecto Telar

> Este archivo es el **punto de entrada de contexto** para cualquier sesión (humana o de Claude).
> Si empiezas una sesión nueva, lee esto primero y sigue los enlaces. No asumas; consulta las fuentes.

---

## 0. Mapa de documentos (leer en este orden)

| Documento                                | Para qué sirve                                                                                                                           | Cuándo leerlo                                                          |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **[SAD.md](SAD.md)**                     | **Fuente de verdad arquitectónica**: contexto, drivers de calidad, ADR-001…015, capas, testing, performance, riesgos, roadmap por fases. | **Siempre primero.** Toda decisión técnica se justifica contra el SAD. |
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

| Comando                         | Qué hace                                                        |
| ------------------------------- | --------------------------------------------------------------- |
| `pnpm install`                  | Instala dependencias del workspace.                             |
| `pnpm tokens`                   | Genera CSS vars + tipos TS desde los tokens (Style Dictionary). |
| `pnpm dev`                      | Levanta la app (`packages/app`) en modo dev.                    |
| `pnpm build`                    | Build de todos los paquetes (ds en modo library, app SPA).      |
| `pnpm typecheck`                | `vue-tsc` estricto en todo el workspace.                        |
| `pnpm lint`                     | ESLint (incluye regla de dependencia `ds ✗→ app`).              |
| `pnpm test`                     | Vitest (unit + component + **contrato/DoD**) en ambos paquetes. |
| `pnpm size`                     | Presupuestos de bundle (`size-limit`); rompe si excede budget.  |
| `pnpm lighthouse`               | Lighthouse CI sobre la app construida (corre en CI).            |
| `pnpm changeset`                | Registra un cambio para versionar el DS (Changesets).           |
| `pnpm -C packages/ds storybook` | Storybook del DS en dev (:6006).                                |
| `pnpm -C packages/app dev`      | Forma explícita de correr un paquete concreto.                  |

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
- **Fase 2 — Patrones + app:** 🚧 en curso, por slices.
  - **Slice 1 ✅ (2026-06-19):** PageHeader + DataTable (genérico, sobre TanStack Table: orden/filtro/paginación + estados loading/empty/error) en `src/patterns/`. App: MSW (dominio usuarios), capa service→store(Pinia)→UsersPage, ruta `/users`. Test de integración con MSW (ADR-006 validado). Gates de DoD extendidos a `patterns/`. Ver AUDIT.md → Fase 2 / Slice 1.
  - **Slice 2 ⬜ siguiente:** Form (vee-validate + Zod) + pantallas login y detalle/edición.
  - **Notas:** los patrones del DS viven en `src/patterns/<Name>/` (mismo trío .vue+.stories+.test). MSW: `packages/app/src/mocks/` (handlers compartidos dev+test), worker en `public/`. La app declara `@tanstack/vue-table` como dep directa (no phantom).
- **Fase 3 — Endurecimiento:** ⬜ pendiente.

Detalle del roadmap: **SAD §12**. Resultado de cada fase: **[AUDIT.md](AUDIT.md)**.

---

## 7. Entorno de desarrollo conocido

- OS: Windows 11. Shell primaria: PowerShell 7+ (pwsh). Bash POSIX disponible.
- Node: v24.15.0 · pnpm: vía corepack · git: 2.51.
- Branch por defecto: `main` (trunk-based, SAD §10.2). Sin remoto configurado todavía.
