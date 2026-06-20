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

🔶 **En curso**, en slices. Plan: Slice 1 — E2E (Cypress); Slice 2 — visual regression + observabilidad; Slice 3 — primer release del DS + cierre. (Lighthouse CI + size budgets ya activos desde Fase 1.)

### Slice 1 — E2E de flujos críticos (Cypress + cypress-axe)

**Estado:** ✅ auditado · **Fecha:** 2026-06-19.

**Objetivo:** ejercitar de punta a punta, en un navegador real y sobre MSW, los caminos que duelen en producción (SAD §7): login + guard, tabla con filtro/orden/paginación, edición con feedback, y error de red. Como subproducto, validar la afirmación de accesibilidad AA (SAD §8) con un motor de axe real.

**Entregado:**

- **Cypress 14** en `packages/app` corriendo contra el server de **dev de Vite** (donde MSW intercepta la red, ADR-006): los mismos mocks de dev/test sirven también en E2E, sin backend. `start-server-and-test` levanta el server y lanza Cypress (`pnpm e2e`).
- **4 specs, 12 tests, 100% verde**, seleccionando por **rol/label accesible**, no por CSS (SAD §7):
  - `auth.cy.ts` (4): guard redirige a `/login` con `redirect`; credenciales inválidas → alerta; login real → vuelve al destino → logout; **a11y del login**.
  - `users-table.cy.ts` (4): filtro + conteo; orden por nombre con `aria-sort` (asc/desc); paginación cliente (10/12, botones disabled en extremos); **a11y con datos**.
  - `user-edit.cy.ts` (3): carga del detalle precargado, guardar → **Toast** de éxito → redirect, y **persistencia** verificada reabriendo el detalle; validación Zod bloquea submit; **a11y del detalle**.
  - `network-error.cy.ts` (1): fuerza un **500** en `/api/users` vía el handle de MSW expuesto en `window` (cy.intercept no puede tocar lo que resuelve el Service Worker), verifica el estado de error con **Reintentar** y la recuperación.
- **cypress-axe** integrado: comando `cy.a11y()` (inyecta axe + 0 violaciones; falla el test ante cualquier violación) con volcado de id/impacto/target al terminal vía `cy.task`. Comandos custom `cy.login()` y `cy.findByLabel()` (resuelve `<label for>` → control).
- **Aislamiento:** `cypress/tsconfig.json` (tipos de Cypress fuera del typecheck de la app); bloque de ESLint para globals de Cypress/Mocha; artefactos de Cypress en `.gitignore`; worker generado de MSW (`public/mockServiceWorker.js`) ignorado por ESLint.
- **CI:** nuevo job `e2e` en `ci.yml` con la action oficial `cypress-io/github-action@v6` (gestiona Xvfb y la caché del binario) sobre el server de dev.
- **MSW expuesto en `window` solo en DEV** (`main.ts`) para que el E2E sobreescriba handlers en runtime.

**Hallazgos y correcciones (lo que el E2E destapó):**

1. **Contraste AA roto en tema oscuro (defecto real del DS y de la app).** axe en navegador real marcó `color-contrast` (`serious`) que jsdom nunca vio:
   - **Botón primario:** texto blanco sobre `action` (dark `blue.500`) = 3.68:1 (< 4.5). Corregido: `action` dark → `blue.600/700/800` (5.17:1). Seguro porque `action` solo es fondo de botón.
   - **Enlaces de la app:** RouterLinks sin color → azul por defecto del navegador, ilegible en oscuro. Corregido con tokens nuevos `color.link`/`link-hover` (claro sobre oscuro / oscuro sobre claro) + estilo base de `a` en la app. Ambos en el changeset `a11y-dark-contrast` (patch del DS).
2. **`ELECTRON_RUN_AS_NODE=1`** en el entorno local rompía el arranque de Cypress (`bad option: --smoke-test`). Se limpia antes de correr; no afecta a CI. Registrado en TROUBLESHOOTING.
3. **cwd compartido entre shells:** un `cd` previo dejó el working directory en `packages/ds/tokens` y rompió `pnpm -C packages/app …`. Registrado (no usar `cd`).
4. **Listado no refresca tras editar:** el detalle escribe vía service y no por el store, así que la `UsersPage` (que cachea) muestra datos viejos. El test verifica la persistencia reabriendo el detalle, no el refresco del listado. Documentado como deuda.

**Verificaciones:**

| Check            | Resultado                                                         |
| ---------------- | ----------------------------------------------------------------- |
| `pnpm typecheck` | ✅ 4/4                                                            |
| `pnpm lint`      | ✅ 3/3, 0/0 (incl. globals de Cypress)                            |
| `pnpm test`      | ✅ DS **87/87** · App **7/7** · cobertura 98.9% líneas / 83.3% br |
| `pnpm build`     | ✅ ds + app                                                       |
| `pnpm size`      | ✅ App 86.55 kB · DS 6.7 kB (budgets 180/15)                      |
| `pnpm e2e`       | ✅ **12/12** (4 specs), incl. 3 checks de axe en Chromium real    |

**Deuda aceptada:**

- **E2E corre sobre el server de dev** (MSW activo solo en DEV). Probar la SPA **buildeada** requeriría arrancar MSW también en preview/prod o un backend; fuera del alcance del slice.
- **Listado sin refresco tras editar** (cache de `UsersPage`): candidato a una acción `update` en el store de users; hoy documentado.
- **Contraste del botón `danger` y otras superficies no ejercidas** por estas pantallas: no verificadas por axe aún (no aparecen en los flujos). Se cubrirían ampliando stories/escenarios.
- **Visual regression** (la otra mitad de "consistencia visual", SAD §5) entra en el Slice 2.

**Veredicto:** ✅ **Aprobado.** Los flujos críticos están cubiertos E2E en verde y el E2E con axe real cumplió su función el día uno: destapó y se corrigieron defectos de contraste AA que los unit tests no podían ver. Listo para **Slice 2** (visual regression + observabilidad).

### Slice 2 — Regresión visual + observabilidad

**Estado:** ✅ auditado · **Fecha:** 2026-06-19.

**Objetivo:** cerrar las dos patas que faltaban del endurecimiento salvo el release: una red de **regresión visual** por componente y una capa de **observabilidad** (SAD §10.3).

**Entregado — Regresión visual (DS, ADR-016):**

- **`@storybook/test-runner`** ejecuta **cada story en Chromium real**: smoke test (una story que lanza al renderizar rompe el build, "story-as-test" §10.1) + **check de axe por story** (`axe-playwright` en `postVisit`, acotado a `#storybook-root`, respeta `parameters.a11y.disable`).
- Scripts `test-storybook` y `test-storybook:ci` (sirve `storybook-static` con `http-server` + `wait-on` + test-runner). Job `visual` en CI (instala Chromium con `--with-deps`, build-storybook, corre el runner).
- **Resultado:** **11 suites / 31 tests, 0 violaciones de accesibilidad** en todo el catálogo del DS (tema claro). El DS está limpio en navegador real.
- **Diff de pixel diferido** (ADR-016): los baselines de pixel dependen del SO (render de fuentes Windows≠Linux); hacerlo determinista exige Docker/Chromatic. Documentado como trade-off, no como olvido.

**Entregado — Observabilidad (app, SAD §10.3):**

- Módulo **vendor-agnóstico** `src/observability/`: captura global de **errores** (`error` + `unhandledrejection`) y **Core Web Vitals** reales (RUM: LCP/CLS/INP/FCP/TTFB vía `web-vitals`), con la **versión DS + app embebida** en cada evento (inyectada por Vite `define` leyendo los `package.json`).
- **Transport** desacoplado (interfaz `ObservabilityTransport`): consola por defecto, punto único donde se enchufa un DSN real (Sentry/equivalente) sin tocar a los emisores. Source maps ya se generan en el build de la app (`sourcemap: true`).
- `initObservability()` cableado en `main.ts` antes de montar. 4 tests (captura de error/rejection con release embebido, reporte de Web Vitals con rating, teardown sin fugas).

**Verificaciones:**

| Check               | Resultado                                                |
| ------------------- | -------------------------------------------------------- |
| `pnpm typecheck`    | ✅ 4/4                                                   |
| `pnpm lint`         | ✅ 3/3, 0/0                                              |
| `pnpm test`         | ✅ DS **87/87** · App **11/11** (+4 de observabilidad)   |
| `pnpm build`        | ✅ ds + app                                              |
| `pnpm size`         | ✅ App 88.58 kB (web-vitals +~2 kB) · DS 6.7 kB (180/15) |
| `test-storybook:ci` | ✅ **31/31** stories (smoke + axe) en Chromium           |

**Hallazgos y correcciones:**

1. **`@swc/core` con build script bloqueado por pnpm** (transitivo del test-runner/jest): aprobado en `pnpm-workspace.yaml` (mismo patrón que esbuild/cypress).
2. **Playwright requiere instalar Chromium aparte** (`playwright install chromium`); en CI con `--with-deps`. No es un build script de pnpm.
3. Import de tipo sin usar en `transport.ts` (TS6196) — corregido.

**Deuda aceptada:**

- **Diff de pixel** pendiente de un entorno de render determinista (ADR-016). _(Resuelto en la adenda de abajo.)_
- **Transport real** no conectado: el módulo está listo y probado, pero hoy emite por consola (conectar un DSN/endpoint es config de despliegue, no de código). El Slice 3 / despliegue de la app lo activaría.
- El test-runner corre las stories en **tema claro** (globals por defecto); el contraste en oscuro lo cubre el E2E de la app.

**Veredicto:** ✅ **Aprobado.** Regresión visual (story-as-test + axe, 31/31) y observabilidad (vendor-agnóstica, con versión embebida) en verde. Listo para **Slice 3** (primer release versionado del DS + cierre de Fase 3).

**Adenda (2026-06-20) — diff de pixel implementado:** se añadió la tercera capa del test-runner (`jest-image-snapshot`, SSIM, threshold 2%), resolviendo el determinismo **fijando el entorno de render**: el job `visual` corre en `ubuntu-24.04` con `VISUAL_SNAPSHOTS=1` y diffea contra baselines commiteados; los baselines se siembran/actualizan desde ese mismo runner con el workflow manual `visual-snapshots.yml` (los comitea al repo). En local (Windows) el snapshot se desactiva por env → solo smoke + axe (verificado: 31/31, sin crear `__image_snapshots__`). El diff de pixel deja de ser deuda (ADR-016 actualizado).

### Slice 3 — Primer release versionado del DS + cierre de Fase 3

**Estado:** ✅ auditado · **Fecha:** 2026-06-20.

**Objetivo:** cerrar la Fase 3 con el primer release versionado del DS (ADR-007) y dejar el pipeline de release preparado.

**Entregado:**

- **`@telar/ds` → `0.1.1`** (primer release versionado): `changeset version` consumió el changeset `a11y-dark-contrast` (patch) y antepuso la sección al `CHANGELOG.md` (que ya tenía la `0.1.0` de la Fase 1). El bump y la nota viven en el changelog, no en una afirmación suelta.
- **Workflow de release** (`.github/workflows/release.yml`): Changesets en cada push a `main`; con changesets pendientes abre/actualiza la PR **"Version Packages"**. Script `release` (`build del DS + changeset publish`).
- **Publish gateado a propósito** (DEPLOY.md §2): hoy la app consume el DS vía `workspace:*`; el registry privado se configura al **extraer** la librería. Habilitarlo = descomentar `publish: pnpm release` + secret `NPM_TOKEN`. `changeset publish` creará el **tag git** y la **GitHub Release**.

**Verificaciones:**

| Check                   | Resultado                                   |
| ----------------------- | ------------------------------------------- |
| `pnpm version-packages` | ✅ DS 0.1.0 → 0.1.1 · CHANGELOG actualizado |
| `pnpm typecheck`        | ✅ 4/4                                      |
| `pnpm lint`             | ✅ 3/3, 0/0                                 |
| `pnpm test`             | ✅ DS 87/87 · App 11/11                     |
| `pnpm build`            | ✅ ds + app                                 |

**Deuda aceptada:**

- **Publish real + tag/GitHub Release** no ejecutados: gateados hasta configurar registry (decisión consciente, no olvido). El workflow y el script están listos.
- El bump fue **patch** (a11y). Las features del DS de fases previas ya estaban en `0.1.0`.

**Veredicto:** ✅ **Aprobado.**

---

## Fase 3 — Veredicto de cierre

✅ **Fase 3 cerrada (2026-06-20).** Endurecimiento completo en 3 slices:

- **Slice 1** — E2E (Cypress + cypress-axe): 4 specs / 12 tests de flujos críticos, en navegador real sobre MSW. Destapó y corrigió contraste AA roto en tema oscuro.
- **Slice 2** — Regresión visual (Storybook test-runner: story-as-test + axe, 31/31, ADR-016) + observabilidad vendor-agnóstica (errores + Web Vitals + versión embebida, SAD §10.3).
- **Slice 3** — Primer release versionado del DS (`@telar/ds@0.1.1`) + workflow de release (publish gateado).

**Gates activos al cierre:** typecheck · lint (incl. regla `ds ✗→ app`) · unit/component (DS 87 + App 11) · cobertura con umbral · DoD ejecutable (contract tests) · size-limit · Lighthouse CI · **E2E (Cypress)** · **regresión visual (test-runner: smoke + axe + diff de pixel)** · a11y (axe en unit + E2E + test-runner). **Deuda restante** (no bloqueante): transport de observabilidad real (config de despliegue) y publish del DS (registry al extraer). El proyecto Telar cumple su tesis: un DS versionado y un app de referencia que lo estresa, endurecidos con gates reproducibles de punta a punta.

> **Nota (2026-06-20):** tras el cierre se completó el **diff de pixel** de la regresión visual (ya no es deuda; ver adenda en Slice 2 y ADR-016 actualizado).

## Fase 4 — Productivización en GCP/Firebase

🔶 **En curso**, en slices. Plan: Slice 1 — backend real con emuladores; Slice 2 — Hosting + deploy CI; Slice 3 — observabilidad real (Cloud Logging); Slice 4 (opcional) — publish del DS. Evoluciona §1.3 (ADR-017/018).

### Slice 1 — Backend real (Firestore + Cloud Functions + Firebase Auth) con emuladores

**Estado:** ✅ auditado · **Fecha:** 2026-06-20.

**Objetivo:** reemplazar MSW por un backend Firebase real (datos + auth), desarrollado 100% local contra el Emulator Suite, **sin romper** la suite de tests/E2E existente.

**Entregado (backend — `functions/`):**

- **API REST** en una Cloud Function (`api`, Express) sobre **Firestore**: `GET/PUT /users`, `GET /users/:id`. Mismo contrato REST que servía MSW (ADR-017).
- **Auth real (ADR-018):** cada endpoint exige el **ID token de Firebase Auth** (Bearer), verificado con el Admin SDK. El path se normaliza para servir igual tras el rewrite de Hosting o el proxy de dev.
- **Firestore rules**: el cliente no accede directo; todo pasa por Functions (Admin SDK). **Seed** idempotente (Firestore + usuarios de Auth con la clave demo).
- `firebase.json` (functions + hosting con rewrite `/api/** → api` + emuladores), `.firebaserc` (`demo-telar`, offline), `firestore.rules/indexes`.

**Entregado (app — modo dual `mock | firebase`, ADR-017):**

- Selector `BACKEND` por env (`src/config.ts`). **Mock** (MSW + auth fake) = tests/E2E/dev por defecto; **firebase** (Firestore/Functions + Firebase Auth) = `dev:firebase` (proxy Vite → emulador) y prod.
- `services/auth.ts` abstrae login/logout/getToken/restoreSession en ambos backends; `services/users.ts` adjunta el Bearer (MSW lo ignora, Functions lo verifica). `firebase.ts` (SDK cliente, emulador de Auth en dev). `main.ts`: MSW solo en mock + restauración de sesión antes de montar.
- La capa de services es la **única** que cambió: páginas, DS, stores (interfaz) y tests intactos.

**Verificaciones:**

| Check                        | Resultado                                                                   |
| ---------------------------- | --------------------------------------------------------------------------- |
| Emuladores (JDK 21)          | ✅ Firestore+Auth+Functions ready (la función `api` carga)                  |
| Backend en vivo (curl)       | ✅ `/users` sin token → **401**; con ID token → **200 + 12**; `/users/3` ok |
| Modo firebase vía proxy Vite | ✅ `/api/users` (proxy→Function) 401/200 correcto                           |
| `pnpm test` (modo mock)      | ✅ App **11/11** (auth+users+observabilidad) — suite intacta                |
| `pnpm typecheck`             | ✅ 5/5 (incluye `@telar/functions`)                                         |
| `pnpm lint`                  | ✅ 4/4, 0/0 (limpiados 3 `eslint-disable` latentes)                         |
| `pnpm build` · `pnpm size`   | ✅ App 88.7 kB (firebase es lazy, no infla el inicial) · DS 6.7 kB          |

**Hallazgos y correcciones:**

1. **Emuladores exigen Java 21+** (había JDK 8 y 17). Resuelto con un **Temurin 21 portable** en `C:\src\jdk21` (sin admin, siguiendo la convención local de JDKs). `firebase` usa el `java` del **PATH**, no `JAVA_HOME` → hay que anteponer `C:\src\jdk21\bin`. Registrado en TROUBLESHOOTING.
2. **Build scripts de pnpm** (`protobufjs`, `@firebase/util`) aprobados en `pnpm-workspace.yaml`.
3. **3 `eslint-disable no-console` latentes** (transport.ts, cypress.config.ts) que `reportUnusedDisableDirectives` marcaba como warning: eliminados (no hay regla `no-console`).
4. **turbo.json**: añadido `lib/**` a outputs de `build` (functions) para que turbo cachee y no avise.

**Deuda aceptada:**

- **Deploy real** (Hosting + Functions) y **bundling de Functions con pnpm** → Slice 2 (necesita el proyecto Firebase + service account del usuario).
- **E2E sigue en modo mock** (MSW): un E2E contra el backend Firebase real es candidato a Slice 2/3 (más setup: emuladores + seed en CI).
- **JDK 21 en PATH** es un paso manual para correr emuladores en local (documentado).
- **Reglas de Firestore** deniegan todo acceso directo del cliente (correcto hoy: todo pasa por Functions); si en el futuro el cliente leyera Firestore directo, habría que abrirlas con cuidado.

**Veredicto:** ✅ **Aprobado.** Backend real (Functions + Firestore + Firebase Auth) validado en vivo sobre el Emulator Suite, con la app consumiéndolo en modo `firebase` y la suite existente intacta en modo `mock`. El desacople de services (SAD §6) sostuvo el cambio sin tocar páginas ni DS. Listo para **Slice 2** (Hosting + deploy en GCP).
