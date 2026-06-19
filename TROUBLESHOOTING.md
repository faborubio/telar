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

---

## Notas del entorno (gotchas Windows / pnpm / Node)

> Particularidades del entorno que han causado o podrían causar fricción. Se amplía conforme aparezcan.

- **Shell:** PowerShell 7+ es la shell primaria. Evitar sintaxis bash (`export VAR=x`, `2>/dev/null`) en scripts de PS; usar `$env:VAR` y `2>$null`.
- **pnpm:** se activa con `corepack enable`. Si `pnpm` no se encuentra, ejecutar `corepack prepare pnpm@latest --activate`.
- **Rutas:** Windows. Usar rutas con `/` en configs de Node/Vite; evitar separadores `\` hardcodeados.
