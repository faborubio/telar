# AUDIT.md — Auditoría por fase

> Al cierre de **cada fase** del roadmap (SAD §12) se realiza una auditoría: se contrasta lo entregado contra el SAD y la Definición de Done, se registran hallazgos, deuda técnica y decisiones, y se pule lo necesario antes de avanzar.
>
> **Formato de cada auditoría:** Alcance esperado · Entregado · Verificaciones (typecheck/lint/test/build) · Hallazgos y correcciones · Deuda aceptada · Veredicto.

---

## Leyenda de veredictos

- ✅ **Aprobada** — cumple el alcance y la DoD de la fase; sin deuda bloqueante.
- ⚠️ **Aprobada con deuda** — funcional, con deuda registrada y planificada.
- ❌ **No aprobada** — falta alcance o falla una verificación; no se avanza.

---

## Fase 0 — Cimientos

**Estado:** ✅ cerrada · **Fecha de auditoría:** 2026-06-18.

### Alcance esperado (SAD §12)

- [x] Monorepo pnpm + Turborepo (caché de tareas afectadas).
- [x] Vite ×2 (ds en library mode, app SPA).
- [x] TypeScript estricto en todo el workspace.
- [x] Lint + format, incluida la **regla de dependencia `ds ✗→ app`** (`no-restricted-imports`).
- [x] Pipeline de tokens en 3 niveles (primitive → semantic → component) con Style Dictionary → CSS vars + tipos TS.
- [x] Theming dark/light vía `data-theme` + cascada con `@layer` y `:where()`.
- [~] Integración de Reka UI como capa de comportamiento (peer dependency). _Instalada y externalizada en el build; primer consumo real en Fase 1 (Modal/Tabs)._
- [~] Elección/cableado de TanStack Table y vee-validate + Zod. _Decididos y documentados (ADR-010); deps **diferidas a Fase 2** para no instalar dependencias sin uso (ver deuda)._
- [x] Primitives: Box, Stack, Text, Icon.
- [x] CI esqueleto (install → typecheck → lint → test → build).
- [x] Changesets configurado.

### Entregado

- **Monorepo** con `pnpm-workspace.yaml` + `turbo.json` (pipeline `tokens → typecheck/lint/test/build`, dependsOn por grafo, caché). Scripts en la raíz.
- **TS estricto** (`tsconfig.base.json`): `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnused*`, `verbatimModuleSyntax`, `isolatedModules`.
- **ESLint flat** (eslint 9) con vue + typescript-eslint + `eslint-config-prettier`, y la **regla de dependencia** `ds ✗→ app` (verificada: dispara error real, ver hallazgos).
- **Tokens 3 niveles** (`packages/ds/tokens/{primitive,semantic,component}`) generados por `build-tokens.mjs` (Style Dictionary v4) a `:root` (light), `[data-theme="dark"]` (solo semántico) y `tokens.ts` tipado. `outputReferences:true` → el theming en runtime cae en cascada sin re-hornear valores.
- **DS** (`@telar/ds`): primitives `Box/Stack/Text/Icon`, composable `useTheme`, API pública explícita en `index.ts`, build library (ESM + `.d.ts` + `telar.css`), `vue`/`reka-ui` como externals.
- **App** (`@telar/app`): SPA Vue Router + Pinia, anti-FOUC en `index.html`, capas `@layer reset, ds, app`, consume el DS y demuestra la regla de reuso.
- **CI** GitHub Actions + **Changesets** (con `@telar/app` ignorado).

### Verificaciones

| Check            | Resultado                                                                            |
| ---------------- | ------------------------------------------------------------------------------------ |
| `pnpm tokens`    | ✅ genera `tokens.css` + `tokens.dark.css` + `tokens.ts`                             |
| `pnpm typecheck` | ✅ 4/4 tareas (vue-tsc estricto)                                                     |
| `pnpm lint`      | ✅ 3/3, 0 errores 0 warnings                                                         |
| `pnpm test`      | ✅ DS 6/6 (incl. axe), App 2/2                                                       |
| `pnpm build`     | ✅ DS: index.js 9.4 kB / telar.css 6.6 kB · App: JS inicial **38.7 kB gzip** (< 180) |
| `format:check`   | ✅ Prettier limpio                                                                   |

### Hallazgos y correcciones

1. **Regla de dependencia verificada en vivo:** se creó un archivo temporal en `ds` importando `@telar/app`; ESLint lo rechazó con el mensaje del ADR-001. Eliminado tras confirmar. La regla **funciona**, no es decorativa.
2. **pnpm bloquea build scripts por defecto** (esbuild, style-dictionary, vue-demi): se aprobaron explícitamente vía `onlyBuiltDependencies`. Registrado en TROUBLESHOOTING.
3. **`@types/node` faltante** rompía el typecheck; además se ajustó `types: []` en los tsconfig de paquete (el `src` no usa APIs de Node; el DOM viene de `lib`). Registrado.
4. **Conflicto ESLint↔Prettier** (reglas de formato de vue) y **triple-slash reference** prohibido: se añadió `eslint-config-prettier` y se removió el `/// <reference>` (redundante con el import de `vitest/config`). Registrado.

### Deuda aceptada

- **TanStack Table / vee-validate + Zod no instalados aún.** Decisión consciente: son lógica de Fase 2 (DataTable/Form); instalarlos ahora sería peso muerto. La _decisión_ está fijada (ADR-010); la _dependencia_ entra cuando se construya el primer patrón.
- **Reka UI instalada pero no ejercida.** Está como peer dep y externalizada; su primer uso real (Modal/Tabs) valida la integración en Fase 1.
- **Sin cobertura medida todavía.** Los tests corren; el umbral de cobertura (carpeta `coverage/`) que rompe el build se activa en Fase 1 junto al DoD bloqueante.
- **Storybook / visual regression / E2E / Lighthouse:** fuera del alcance de Fase 0 por roadmap (Fases 1–3).

### Veredicto

✅ **Aprobada.** Los cimientos cumplen el alcance de Fase 0 y todas las verificaciones están en verde. La deuda es la planificada por el roadmap, no improvisada. Listo para Fase 1 (núcleo del DS).

---

## Fase 1 — Núcleo del DS

⬜ Pendiente. Button, Input, Select, Checkbox/Radio, Modal, Toast, Tabs (tests + a11y + stories).

## Fase 2 — Patrones + app

⬜ Pendiente. DataTable, Form, PageHeader; app: login, listado, detalle, error/empty/loading; MSW.

## Fase 3 — Endurecimiento

⬜ Pendiente. E2E, Lighthouse CI, visual regression, observabilidad, docs, primer release del DS.
