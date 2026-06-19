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

---

## Notas del entorno (gotchas Windows / pnpm / Node)

> Particularidades del entorno que han causado o podrían causar fricción. Se amplía conforme aparezcan.

- **Shell:** PowerShell 7+ es la shell primaria. Evitar sintaxis bash (`export VAR=x`, `2>/dev/null`) en scripts de PS; usar `$env:VAR` y `2>$null`.
- **pnpm:** se activa con `corepack enable`. Si `pnpm` no se encuentra, ejecutar `corepack prepare pnpm@latest --activate`.
- **Rutas:** Windows. Usar rutas con `/` en configs de Node/Vite; evitar separadores `\` hardcodeados.
