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

✅ **Cerrada (2026-06-19).** Entregada por slices: Slice 1 fijó el patrón de "alta de componente"; Slice 2 lo produjo en serie. Núcleo completo: Button, Input, Modal, Checkbox, RadioGroup, Select, Tabs, Toast (+ primitives de Fase 0) y composables useTheme/useToast.

### Slice 1 — Patrón de alta de componente (Button · Input · Modal)

**Estado:** ✅ auditado · **Fecha:** 2026-06-18.

**Objetivo del slice:** fijar y validar el patrón end-to-end con tres arquetipos distintos: **Button** (acción estática), **Input** (campo de formulario con a11y de label/error), **Modal** (interactivo sobre Reka UI — valida ADR-008). Con el patrón aprobado, el resto de componentes se produce en serie.

**El patrón de alta de componente queda así** (cada componente):

1. `components/<Name>/<Name>.vue` — SFC tipado, props/emits/slots con JSDoc, **solo tokens** (sin hex/px), CSS `scoped` en `@layer ds`.
2. `<Name>.stories.ts` — CSF3 con `tags: ['autodocs']`: default + todas las variantes/estados.
3. `<Name>.test.ts` — render + cada variante + interacción de teclado + **check de axe**.
4. Export nombrado en `src/index.ts` (API pública).
5. Documentación = autodocs de Storybook (props/eventos/slots desde los tipos + JSDoc).

**Entregado:**

- **Button**: variantes primary/secondary/danger, tamaños sm/md/lg, estados loading (aria-busy) / disabled / block. 6 tests incl. axe.
- **Input**: label asociado vía `useId`, `aria-describedby`/`aria-invalid`, estados description/error/required/disabled. 5 tests incl. axe.
- **Modal**: sobre Reka `Dialog` (focus trap, escape, scroll lock, ARIA heredados); Telar solo aporta tokens/CSS. v-model:open, slots body/footer. 5 tests incl. axe → **ADR-008 validado en vivo**.
- **Storybook 8** (Vue3+Vite) con `addon-a11y` (axe en el canvas) y toolbar de **tema light/dark** (ADR-003); stories de los 3 componentes.
- **Cobertura activada** (umbral que rompe el build): `@vitest/coverage-v8`, thresholds líneas/funcs/stmts 80 / branches 70.
- Tokens nuevos: `color-overlay` (semantic), `shadow-*` (primitive), `elevation-raised/modal` (semantic).

**Verificaciones:**

| Check             | Resultado                                                            |
| ----------------- | -------------------------------------------------------------------- |
| `pnpm typecheck`  | ✅ 4/4                                                               |
| `pnpm lint`       | ✅ 3/3, 0/0                                                          |
| `pnpm test`       | ✅ DS 27/27 · cobertura **99.4% líneas / 75.9% branches** (> umbral) |
| `pnpm build`      | ✅ ds + app                                                          |
| `build-storybook` | ✅ compila las 3 stories                                             |

**Hallazgos y correcciones:**

1. **Modal + Reka Presence:** el contenido del diálogo monta un tick después; `getByRole` síncrono fallaba. Corregido usando `findByRole` (async). Registrado en TROUBLESHOOTING.
2. **Aviso de Reka "Missing Description":** se mantiene a propósito (un diálogo titulado sin descripción es ARIA-válido; el sentinel generaría una violación de axe peor). Registrado.

**Deuda aceptada:**

- Faltan **Select, Checkbox/Radio, Toast, Tabs** (slice 2) — se producen en serie con el patrón ya aprobado.
- **Visual regression** (Chromatic/test-runner) aún no conectado; Storybook ya es la base. Llega en Fase 3.
- Cobertura de branches al 75.9%: por guardas defensivas `typeof window/localStorage` en `useTheme` (entorno-dependientes, difíciles de cubrir sin mocks de entorno). Aceptable sobre el umbral de 70.

**Veredicto:** ✅ **Patrón aprobado.** Listo para producir Select/Checkbox/Radio/Toast/Tabs siguiendo el mismo molde.

### Slice 2 — Producción en serie (Checkbox · RadioGroup · Select · Tabs · Toast)

**Estado:** ✅ auditado · **Fecha:** 2026-06-19.

**Entregado** (todos sobre Reka UI, mismo patrón del Slice 1):

- **Checkbox**: `CheckboxRoot/Indicator`, label asociado vía `<label for>` (el botón de Reka es labelable). 5 tests incl. axe.
- **RadioGroup**: `RadioGroupRoot/Item`, opciones por prop, `aria-label` de grupo, roving tabindex de Reka. 4 tests incl. axe.
- **Select**: `Select*` completo (trigger/value/portal/content/viewport/item), type-ahead y posicionamiento de Reka. 4 tests incl. axe (abre y selecciona).
- **Tabs**: `Tabs*`, contenido por slots nombrados = `value`, roles tablist/tab/tabpanel. 3 tests incl. axe.
- **Toast**: composable `useToast` (cola de UI, no estado de negocio — ADR-004) + `ToastProvider` sobre Reka Toast (live region, timers, foco). 3 tests incl. axe. Variantes info/success/danger.
- Stories CSF3 con autodocs para los 5; export en `index.ts` (+ tipos `RadioOption`, `SelectOption`, `TabItem`, `ToastItem/Options/Variant`).
- Polyfills de jsdom en el setup de tests (ResizeObserver, scrollIntoView, pointer capture) para que los componentes Reka monten en el entorno de test.

**Verificaciones:**

| Check             | Resultado                                                              |
| ----------------- | ---------------------------------------------------------------------- |
| `pnpm typecheck`  | ✅ 4/4 (incluye re-export de tipos desde SFCs)                         |
| `pnpm lint`       | ✅ 3/3, 0/0                                                            |
| `pnpm test`       | ✅ DS **46/46** · cobertura **99.7% líneas / 80% branches** (> umbral) |
| `pnpm build`      | ✅ ds + app                                                            |
| `build-storybook` | ✅ compila las 8 stories                                               |

**Hallazgos y correcciones:**

1. **Reka `CheckboxRoot` usa `modelValue`, no `checked`** (API distinta de Radix Vue antiguo). Corregido. Registrado en TROUBLESHOOTING → lección: verificar el prop de modelo en el `.d.ts` antes de cablear.
2. **`SelectValue` no muestra el label de un valor preseleccionado hasta abrir** (los items viven en el portal). El test se ajustó a abrir y verificar `option[selected]`. Registrado.
3. **ESLint flat no respeta `.gitignore`**: linteaba `storybook-static/` (~19.6k falsos errores). Añadido a `ignores`. Registrado.

**Deuda aceptada:**

- Toast: sin animación de salida (se quita de la cola al cerrar). Suficiente para el DS; pulido visual menor, no de a11y.
- Cobertura de branches en `useTheme` (50%): guardas de entorno (`typeof window`) difíciles de cubrir sin mocks; el total (80%) supera el umbral.
- Visual regression (Chromatic/test-runner) sigue pendiente para Fase 3; Storybook ya es la base.

**Veredicto:** ✅ **Aprobado.** Núcleo del DS completo (10 componentes/primitives + 2 composables). **Fase 1 cerrada.** Listo para Fase 2 (patrones DataTable/Form + pantallas de la app).

## Fase 2 — Patrones + app

✅ **Cerrada (2026-06-19)**, en 2 slices. Patrones del DS (PageHeader, DataTable, FormField) + app Tejido con flujos reales (listado, login con auth, detalle/edición), datos vía MSW, validación con Zod.

### Slice 1 — Patrón + pantalla + datos (PageHeader · DataTable · MSW · pantalla Usuarios)

**Estado:** ✅ auditado · **Fecha:** 2026-06-19.

**Objetivo:** validar el loop completo **patrón del DS → pantalla de la app → datos vía MSW** (service → store → page), de punta a punta. Dominio: usuarios/admin.

**Entregado (DS — capa de patrones):**

- **PageHeader**: título (h1), descripción y slot `actions`. 4 tests incl. axe.
- **DataTable**: SFC **genérico** (`DataTable<TData>`) sobre **TanStack Table** (ADR-010, headless): orden por columna (con `aria-sort`), filtro global, paginación cliente, y estados **loading / empty / error** (con `@retry`). Renderiza con Input/Button del DS. 8 tests incl. axe.
- Gates de DoD (ADR-013) **extendidos a `patterns/`**: el contract test y el guard de color ahora cubren patrones.

**Entregado (app — Tejido):**

- **MSW** (ADR-006): `mocks/` con data + handlers (`/api/users`), worker para dev (`browser.ts`) y server para test (`server.ts`); worker inicializado en `public/`. Arranque condicional en dev en `main.ts`.
- **Capa de datos (SAD §6):** `services/users.ts` (única que conoce la URL) → `stores/users.ts` (Pinia: users/loading/error + `load()`) → `pages/UsersPage.vue` (solo compone DS + consume store; no hace fetch directo). Ruta `/users` + link en la nav.
- **Test de integración real** service→store contra MSW (carga OK + manejo de error 500) → **ADR-006 validado en vivo**.

**Verificaciones:**

| Check            | Resultado                                                                 |
| ---------------- | ------------------------------------------------------------------------- |
| `pnpm typecheck` | ✅ 4/4 (incl. genérico DataTable + uso de @telar/ds en la app)            |
| `pnpm lint`      | ✅ 3/3, 0/0                                                               |
| `pnpm test`      | ✅ DS **82/82** · App **4/4** (2 de integración MSW) · cobertura > umbral |
| `pnpm build`     | ✅ ds + app                                                               |
| `pnpm size`      | ✅ App 49.6 kB · DS 6.5 kB (budgets 180/15)                               |

**Hallazgos y correcciones:**

1. **SFC genérico vs Storybook:** `Meta<typeof DataTable>` no tipa componentes genéricos. Se omitió `component` del meta y se renderiza vía `render` (datos siguen tipados con `ColumnDef<User>`). Registrar en TROUBLESHOOTING.
2. **Dependencia transitiva:** la app necesitaba `@tanstack/vue-table` como dep **directa** (pnpm no expone phantom deps) para tipar columnas. Añadida.

**Deuda aceptada:**

- DataTable: filtro y paginación **cliente** (suficiente para el volumen del panel; server-side se añadiría con TanStack `manual*` si el dataset crece — ADR-012).
- Falta el **Form** (vee-validate + Zod) y las pantallas de **login** y **detalle/edición** → Slice 2.
- El adaptador DTO→dominio del service es passthrough (el mock ya da forma de dominio); el punto de extensión está documentado en `services/users.ts`.

**Veredicto:** ✅ **Loop patrón+pantalla+datos validado.** Listo para Slice 2 (Form + login + detalle).

### Slice 2 — Formularios y flujos (FormField · login · detalle/edición)

**Estado:** ✅ auditado · **Fecha:** 2026-06-19. **Cierra la Fase 2.**

**Entregado (DS):**

- **FormField** (patrón): puente entre **vee-validate** (headless, ADR-010) y el `Input` del DS. El consumidor declara el esquema (Zod) en su `useForm`; el campo se conecta por `name`. **vee-validate es peer dependency** (una sola instancia, como Reka). 3 tests incl. axe + validación con contexto de formulario.

**Entregado (app — Tejido):**

- **Validación con Zod** (ADR-010): `schemas/auth.ts` y `schemas/user.ts`. Un schema = validación + tipos (`z.infer`). Conectados a vee-validate con `toTypedSchema`.
- **Login real**: `LoginPage` (form con FormField + Zod), `services/auth.ts` + `stores/auth.ts` (token + persistencia en localStorage), handler MSW `POST /api/login`. **Guard de ruta**: las rutas no públicas redirigen a `/login` con `redirect`.
- **Detalle/edición**: `UserDetailPage` (`/users/:id`): carga el usuario, formulario con FormField (texto) + `Select` (rol/estado vía `useField`), guarda con `PUT /api/users/:id` y dispara un **Toast** de éxito. Listado con columna de acciones → "Editar".
- **ToastProvider** integrado en `App.vue` (primer uso real del Toast en la app); logout + estado de sesión en la nav.
- Test de integración del **store de auth** contra MSW (login OK / credenciales inválidas / signOut).

**Verificaciones:**

| Check             | Resultado                                                  |
| ----------------- | ---------------------------------------------------------- |
| `pnpm typecheck`  | ✅ 4/4 (cadena forms + Zod + `toTypedSchema`)              |
| `pnpm lint`       | ✅ 3/3, 0/0                                                |
| `pnpm test`       | ✅ DS **87/87** · App **7/7** (auth+users integración MSW) |
| `pnpm build`      | ✅ ds + app                                                |
| `pnpm size`       | ✅ App 86.6 kB · DS 6.7 kB (budgets 180/15)                |
| `build-storybook` | ✅ compila las 11 stories (incl. FormField)                |

**Hallazgos y correcciones:**

1. **FormField (no genérico) + Storybook**: `name` requerido obligaba a `args`; se añadió `args` al meta (el `render` los ignora).
2. **vee-validate como singleton**: declarado **peer dependency** del DS para compartir el contexto `useForm`/`useField` entre app y DS (mismo razonamiento que Reka UI, ADR-008).

**Deuda aceptada:**

- Auth simulada (token fake en MSW, clave demo `telar123`); sin refresh ni expiración. Suficiente para demostrar el flujo; observabilidad/JWT real es Fase 3 / backend.
- El DS no tiene aún un `FormSelect` dedicado: en el detalle, el `Select` se enlaza a `useField` desde la página. Candidato a patrón si crece el uso.

**Veredicto de Fase 2:** ✅ **Aprobada.** Los 3 patrones (PageHeader, DataTable, FormField) existen y están ejercidos por pantallas reales (listado, login, detalle) con estados loading/empty/error, datos por MSW y validación por Zod. El DS demostró que resuelve flujos de producción. Listo para **Fase 3** (E2E, Lighthouse ya activo, visual regression, observabilidad, release).

## Fase 3 — Endurecimiento

⬜ Pendiente. E2E, Lighthouse CI, visual regression, observabilidad, docs, primer release del DS.
