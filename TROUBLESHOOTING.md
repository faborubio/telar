# TROUBLESHOOTING.md — Bitácora de errores conocidos

> Cada vez que se resuelve un error no trivial, se registra aquí para **no volver a depurarlo de cero**.
> **Antes de depurar cualquier problema, busca primero en este archivo.**

### Formato de cada entrada

```
## [YYYY-MM-DD] Título corto del síntoma
- Contexto: dónde/cuándo aparece (comando, paquete, fase).
- Síntoma: mensaje o comportamiento observable (cita el error).
- Causa raíz: por qué pasa de verdad.
- Solución: qué se hizo (con el cambio concreto).
- Prevención: cómo evitar que vuelva (regla de lint, config, convención).
```

---

## Entradas

## [2026-06-18] pnpm ignora los build scripts (esbuild no instala su binario)

- Contexto: `pnpm install` en Fase 0.
- Síntoma: `[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild, style-dictionary, vue-demi, @bundled-es-modules/glob`. Exit 1.
- Causa raíz: pnpm v10+ bloquea por defecto la ejecución de `postinstall`/build scripts de dependencias (medida de supply-chain). esbuild necesita su `postinstall` para bajar el binario nativo; sin él, Vite no compila.
- Solución: declarar `onlyBuiltDependencies` en `pnpm-workspace.yaml` con la lista de paquetes permitidos y reinstalar.
- Prevención: la lista ya está en `pnpm-workspace.yaml`. Al añadir una dep nueva con build script, pnpm volverá a avisar; agregarla conscientemente a esa lista.

## [2026-06-18] vue-tsc: "Cannot find type definition file for 'node'"

- Contexto: `pnpm typecheck` (vue-tsc) en packages/ds y app.
- Síntoma: `error TS2688: Cannot find type definition file for 'node'`.
- Causa raíz: el tsconfig tenía `types: ["node"]` pero `@types/node` no estaba instalado, y además el `src` de los paquetes **no usa APIs de Node** (el DOM viene de `lib`).
- Solución: `types: []` en los tsconfig de paquete (lo que necesitan se referencia explícito, p. ej. `vite/client` en `env.d.ts`); `@types/node` se agregó solo en la raíz para los archivos de configuración.
- Prevención: no poner `types: ["node"]` salvo que el código realmente importe `node:*`. Mantener los `types` mínimos.

## [2026-06-18] ESLint vs Prettier + triple-slash reference prohibido

- Contexto: `pnpm lint`.
- Síntoma: (a) decenas de warnings `vue/max-attributes-per-line`, `vue/singleline-html-element-content-newline`; (b) error `@typescript-eslint/triple-slash-reference` en `vite.config.ts`.
- Causa raíz: (a) reglas de **formato** de eslint-plugin-vue compiten con Prettier; (b) el `/// <reference types="vitest/config" />` es redundante cuando ya se importa `defineConfig` de `vitest/config`.
- Solución: añadir `eslint-config-prettier` al **final** del flat config (apaga reglas de formato) y eliminar el triple-slash.
- Prevención: Prettier es dueño del formato; ESLint, de la corrección. Para tipos de Vitest, importar de `vitest/config`, no usar triple-slash.

## [2026-06-18] Tests de Modal (Reka Dialog) no encuentran el contenido con getByRole

- Contexto: `pnpm test` en packages/ds, `Modal.test.ts`.
- Síntoma: `Unable to find an accessible element with the role "dialog"` aunque `open=true`; el body muestra divs vacíos.
- Causa raíz: Reka monta el contenido del `DialogContent` con **Presence** (un tick después del render). Las queries **síncronas** (`getByRole`) corren antes de que exista. Los tests con `await` (Escape, axe) sí pasaban.
- Solución: usar las queries **asíncronas** de Testing Library (`findByRole`), que esperan a que aparezca el nodo.
- Prevención: para componentes interactivos montados con Presence/portales (Modal, Tooltip, Dropdown…), consultar el contenido con `findBy*`, no `getBy*`.

## [2026-06-18] Reka avisa "Missing Description or aria-describedby" en DialogContent

- Contexto: render de `Modal` sin prop `description`.
- Síntoma (stderr, dev-only): `Warning: Missing 'Description' or 'aria-describedby="undefined"' for DialogContent.`
- Causa raíz: Reka pide que el diálogo sea descrito o que se opte por no hacerlo con el sentinel `aria-describedby="undefined"`.
- Decisión: **se deja el aviso**. Un diálogo con `title` pero sin descripción es válido en ARIA. El sentinel `aria-describedby="undefined"` provocaría una violación **real** de axe (`aria-describedby` apuntando a un id inexistente), que es peor que un warning de dev. Cuando hay `description`, Reka asocia el id correctamente y el aviso no aparece.
- Prevención: pasar `description` cuando exista contenido descriptivo; el aviso sin descripción es esperado y benigno.

## [2026-06-19] Reka CheckboxRoot usa `modelValue`, no `checked`

- Contexto: `Checkbox` sobre Reka; los tests de marcado fallaban (no emitía, aria-checked siempre false).
- Síntoma: `:checked`/`@update:checked` no controlaban el estado; `aria-checked` quedaba en `false`.
- Causa raíz: en Reka UI 2.x, `CheckboxRoot` expone el modelo como **`modelValue`** (v-model) + `update:modelValue`, no `checked` (eso era Radix Vue antiguo).
- Solución: `:model-value="modelValue"` + `@update:model-value`.
- Prevención: ante cualquier componente Reka, verificar el nombre real del prop de modelo en su `.d.ts` (`grep "interface XRootProps"`) antes de cablearlo. No asumir la API de Radix.

## [2026-06-19] Select de Reka no muestra el label de un valor preseleccionado hasta abrir

- Contexto: test "refleja el valor seleccionado" del `Select`.
- Síntoma: con `modelValue` inicial, el trigger mostraba el placeholder, no el label del valor.
- Causa raíz: `SelectValue` resuelve el texto desde los `SelectItem`, que viven en el portal y **no se montan hasta abrir**. Es comportamiento conocido de Radix/Reka, no un bug.
- Solución: el test abre el select y verifica la opción con `getByRole('option', { name, selected: true })`. (En la app real, si se requiere mostrar el label sin abrir, hay que pasar el texto a `SelectValue` o renderizarlo manualmente.)
- Prevención: no asumir que `SelectValue` conoce el label de un valor que el usuario nunca abrió.

## [2026-06-19] ESLint flat config no respeta .gitignore → linteaba storybook-static

- Contexto: `pnpm lint` tras `build-storybook`; ~19.600 errores en archivos con líneas 10000+.
- Síntoma: miles de `no-unused-expressions`/`no-unused-vars` en archivos que no son fuente.
- Causa raíz: ESLint flat config **solo ignora lo declarado en `ignores`**, no lee `.gitignore`. La salida compilada `storybook-static/` (JS bundleado) entraba al lint.
- Solución: añadir `**/storybook-static/**` (y ya estaban `**/dist/**`, etc.) al bloque `ignores` de `eslint.config.js`.
- Prevención: cualquier carpeta de build/artefactos nueva debe agregarse a `ignores` de ESLint, además de a `.gitignore`.

## [2026-06-19] `import.meta.url` no es file:// dentro de vitest (jsdom)

- Contexto: `contracts.test.ts` que escanea el filesystem con `fileURLToPath(new URL('../components', import.meta.url))`.
- Síntoma: `TypeError: The URL must be of scheme file` al colectar el test (0 tests).
- Causa raíz: bajo vitest + jsdom, `import.meta.url` no siempre resuelve a un `file://` utilizable por `fileURLToPath`.
- Solución: derivar rutas desde `process.cwd()` (vitest corre con cwd = root del paquete): `resolve(process.cwd(), 'src/components')`.
- Prevención: en tests que tocan el FS, anclar en `process.cwd()` en lugar de `import.meta.url`.

## [2026-06-19] CI rojo: pnpm 11.8 requiere Node ≥ 22.13 (node:sqlite)

- Contexto: primer run de GitHub Actions; el CI usaba `node-version: 20`.
- Síntoma: `Error [ERR_UNKNOWN_BUILTIN_MODULE]: No such built-in module: node:sqlite` y `This version of pnpm requires at least Node.js v22.13` en el paso Setup Node (al ejecutar `pnpm store path` para el caché). Todos los jobs fallaban antes de instalar.
- Causa raíz: `packageManager: pnpm@11.8.0` (fijado por corepack) usa `node:sqlite`, que existe desde Node 22.5+; pnpm 11.8 exige Node ≥ 22.13. En local no se vio porque la máquina tiene Node 24.
- Solución: `node-version: 22` en los workflows; `engines.node` a `>=22.13`; README actualizado.
- Prevención: alinear la versión de Node del CI con la que exige el `packageManager`. Si se quiere soportar Node 20, fijar una pnpm más antigua (9/10).

## [2026-06-19] SFC genérico (`generic="T"`) rompe el tipado de Storybook

- Contexto: `DataTable.stories.ts` para `DataTable<TData>`.
- Síntoma: `Type '<TData>(...)' has no properties in common with type 'Omit<ConcreteComponent...>'` y `Property 'args' is missing` en `satisfies Meta<typeof DataTable>`.
- Causa raíz: Storybook (CSF) no tipa bien componentes Vue genéricos; `Meta<typeof Comp>` espera un `ConcreteComponent`.
- Solución: omitir `component` del `meta` (tipar `const meta: Meta = {...}`) y renderizar la story vía `render`. Los datos siguen tipados con `ColumnDef<User>` en el módulo.
- Prevención: para patrones genéricos, no enganchar `component` al meta; documentar props con `parameters.docs.description`.

## [2026-06-19] La app no resolvía `@tanstack/vue-table` (phantom dependency)

- Contexto: `UsersPage.vue` importaba `ColumnDef` desde `@tanstack/vue-table`, que es dep del DS, no de la app.
- Síntoma: error de resolución de módulo en typecheck/build de la app.
- Causa raíz: pnpm aísla dependencias; un paquete no puede importar deps transitivas de otro (no hay phantom deps).
- Solución: declarar `@tanstack/vue-table` como dependencia **directa** de la app.
- Prevención: si la app importa de una librería headless usada por el DS, esa librería debe estar en las deps de la app también.

## [2026-06-19] GitHub Pages redirige a un dominio muerto / 301 cacheado

- Contexto: tras desplegar el Storybook, `https://faborubio.github.io/telar/` redirigía a `http://fabianrubio.me/telar/`, que no carga.
- Síntoma: pantalla en blanco / no carga. `nslookup fabianrubio.me` → **NXDOMAIN**.
- Causa raíz: la cuenta tenía `fabianrubio.me` como dominio propio en el repo de sitio de usuario `faborubio.github.io`; GitHub redirige **todas** las project pages a ese apex, que no resuelve.
- Solución: quitar el custom domain del sitio de usuario: `echo '{"cname":null}' | gh api -X PUT repos/faborubio/faborubio.github.io/pages --input -`. (No había archivo `CNAME` en el repo.) Tras propagar, `faborubio.github.io/telar/` sirve directo con 200.
- **Secuela (caché):** un 301 es _permanente_ y los navegadores lo cachean agresivamente. Si tras el fix el navegador sigue redirigiendo: **incógnito** o limpiar caché (DevTools → recargar forzado). `curl -I` (sin caché) confirma el estado real del servidor.
- Prevención: no fijar un custom domain en Pages sin DNS válido; recordar que `curl`/incógnito evitan la caché de 301 al diagnosticar.

## [2026-06-19] Cypress no arranca: `bad option: --smoke-test` / `--ping`

- Contexto: `pnpm -C packages/app e2e` (Fase 3, primer run local de Cypress en Windows).
- Síntoma: `Cypress failed to start … Cypress.exe: bad option: --smoke-test` y `bad option: --ping=480`. El binario de Cypress (Electron) rechaza sus propios flags.
- Causa raíz: la variable de entorno **`ELECTRON_RUN_AS_NODE=1`** estaba seteada en el shell (la inyecta el IDE/harness). Con esa variable, el binario de Cypress arranca como **Node plano** en vez de como Electron, y no entiende `--smoke-test`/`--ping`.
- Solución: limpiar la variable antes de correr Cypress. En PowerShell, en el **mismo** comando (el estado no persiste entre invocaciones): `Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue; pnpm -C packages/app e2e`.
- Prevención: es un gotcha **solo local** (en GitHub Actions la variable no existe, el job de CI corre limpio). Si Cypress falla con "bad option", revisar `ELECTRON_RUN_AS_NODE` antes que nada.

## [2026-06-19] ENOENT `packages/ds/tokens/packages` — cwd contaminado entre herramientas

- Contexto: `pnpm -C packages/app exec vite` / `e2e` fallaba con `ENOENT: lstat 'C:\…\packages\ds\tokens\packages'`; además un `pnpm build` previo solo construyó el DS, no la app.
- Síntoma: pnpm intenta expandir el glob de workspace (`packages/*`) bajo `packages/ds/tokens`, que no existe.
- Causa raíz: un `cd packages/ds/tokens` ejecutado en una shell **cambió el working directory**, que aquí se **comparte entre las herramientas de shell** (Bash y PowerShell). Con el cwd en `packages/ds/tokens`, `pnpm -C packages/app …` resolvía rutas y el workspace desde el lugar equivocado.
- Solución: restaurar el cwd a la raíz (`Set-Location 'C:\…\telar'`) y re-ejecutar.
- Prevención: **no usar `cd`** para "entrar" a subcarpetas (el tooling lo advierte). Para inspeccionar archivos, usar rutas absolutas o las herramientas de búsqueda/lectura; para correr un paquete, `pnpm -C <paquete> …` desde la raíz.

## [2026-06-19] Violaciones de contraste que jsdom no ve pero axe en navegador real sí

- Contexto: E2E de a11y (cypress-axe en Electron/Chromium) en la Fase 3; los tests unitarios con vitest-axe (jsdom) estaban en verde.
- Síntoma: `color-contrast` (`serious`) en el botón primario y en los enlaces de la app, **solo** en el E2E y **solo** en tema oscuro.
- Causa raíz: **jsdom no computa estilos ni contraste**, así que la regla `color-contrast` de axe queda inerte en los tests unitarios. Un navegador real sí la evalúa. El tema oscuro se activa por `prefers-color-scheme: dark` (Electron headless lo reporta).
- Solución: corregidos los tokens (ver changeset `a11y-dark-contrast`): `action` dark → `blue.600/700/800` (botón con texto blanco) y nuevos `color.link`/`link-hover` para texto de enlace (claro sobre oscuro).
- Prevención: el contraste **solo se verifica de verdad en un navegador real** (E2E con cypress-axe). No asumir AA por el verde de vitest-axe. El gate de contraste vive en el E2E, no en los unit tests.

## [2026-06-20] Emuladores de Firebase: "Java version before 21" / firebase ignora JAVA_HOME

- Contexto: `firebase emulators:start` (Fase 4, backend con Emulator Suite) en Windows.
- Síntoma: `Error: firebase-tools no longer supports Java version before 21. Please install a JDK at version 21 or above`. Persistía aun con `JAVA_HOME=C:\src\jdk21`.
- Causa raíz: (a) firebase-tools 15.x exige **Java 21+** para los emuladores (Firestore/Auth); había JDK 8 (en PATH) y 17 (en `JAVA_HOME`). (b) firebase **resuelve `java` desde el PATH**, no desde `JAVA_HOME`, así que setear solo `JAVA_HOME` no basta.
- Solución: instalar un **Temurin 21 portable** (sin admin) en `C:\src\jdk21` (convención local de JDKs) y **anteponerlo al PATH** del proceso: `$env:JAVA_HOME='C:\src\jdk21'; $env:PATH='C:\src\jdk21\bin;'+$env:PATH; firebase emulators:start …`. Con eso `java -version` reporta 21 y los emuladores arrancan.
- Prevención: en local, exportar `C:\src\jdk21\bin` al PATH antes de `pnpm emulators`. En CI (Slice 2+) el runner ya trae un JRE moderno. Descarga del JDK: `https://api.adoptium.net/v3/binary/latest/21/ga/windows/x64/jdk/hotspot/normal/eclipse`.

## [2026-06-20] Mapeo de path Functions: Hosting conserva `/api`, el proxy de dev no

- Contexto: la misma Function `api` (Express) debe responder igual tras el rewrite de Hosting (`/api/** → api`) y tras el proxy de Vite en dev (modo firebase).
- Síntoma potencial: rutas que no matchean (`/users` vs `/api/users`) según el entorno.
- Causa raíz: con el **rewrite de Hosting** la función recibe el path COMPLETO (`/api/users`); el **emulador de Functions** invocado directo (o vía proxy con rewrite) consume el nombre de la función y entrega `/users`.
- Solución: middleware en Express que **normaliza** quitando el prefijo `/api` opcional (`req.url.replace(/^\/api(?=\/|$)/, '')`), y rutas declaradas sin prefijo. El proxy de Vite (`vite.config.ts`, modo firebase) apunta a `…/us-central1/api` con `rewrite: p => p.replace(/^\/api/, '')`. Verificado: `/api/users` da 401/200 igual por proxy y directo.
- Prevención: no asumir el path que recibe la función; normalizar y probar ambos caminos con `curl`.

---

## Notas del entorno (gotchas Windows / pnpm / Node)

> Particularidades del entorno que han causado o podrían causar fricción. Se amplía conforme aparezcan.

- **Shell:** PowerShell 7+ es la shell primaria. Evitar sintaxis bash (`export VAR=x`, `2>/dev/null`) en scripts de PS; usar `$env:VAR` y `2>$null`.
- **pnpm:** se activa con `corepack enable`. Si `pnpm` no se encuentra, ejecutar `corepack prepare pnpm@latest --activate`.
- **Rutas:** Windows. Usar rutas con `/` en configs de Node/Vite; evitar separadores `\` hardcodeados.
