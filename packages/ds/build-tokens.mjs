// Pipeline de tokens (SAD §4.2, ADR-009 / ADR-003).
//
// Tres niveles: primitive -> semantic -> component.
// Genera, desde una única fuente:
//   1. tokens.css       -> :root  (tema light = base) con outputReferences:true,
//                          de modo que component->semantic->primitive quede como var(...) encadenadas.
//   2. tokens.dark.css  -> [data-theme="dark"] solo reasigna el nivel SEMÁNTICO (ADR-003);
//                          como los componentes referencian semánticos vía var(), heredan el tema.
//   3. tokens.ts        -> tipos + objeto `tokens` con referencias var() (autocompletado en TS).
//
// Por qué outputReferences: un rebrand/tema toca el semántico y NADA más; sin esto,
// los valores quedarían "horneados" y el theming en runtime se rompería.
import StyleDictionary from 'style-dictionary'

const BUILD_PATH = 'src/tokens/generated/'

const toCamel = (kebab) => kebab.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())

// Formato TS propio: expone cada token como referencia CSS var() tipada.
StyleDictionary.registerFormat({
  name: 'typescript/telar-tokens',
  format: ({ dictionary }) => {
    const entries = dictionary.allTokens
      .map((t) => `  ${JSON.stringify(toCamel(t.name))}: 'var(--${t.name})',`)
      .sort()
      .join('\n')
    return (
      `// AUTO-GENERADO por build-tokens.mjs — NO editar a mano.\n` +
      `// Fuente de verdad: packages/ds/tokens/**. Regenerar con \`pnpm tokens\`.\n\n` +
      `export const tokens = {\n${entries}\n} as const\n\n` +
      `export type TokenName = keyof typeof tokens\n` +
      `export type TokenVar = (typeof tokens)[TokenName]\n`
    )
  },
})

const PRIMITIVES = 'tokens/primitive/**/*.json'

// ── Build base (:root): primitivos + semántico light + componentes + tipos TS. ──
const base = new StyleDictionary({
  source: [PRIMITIVES, 'tokens/semantic/color.light.json', 'tokens/semantic/scale.json', 'tokens/component/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: BUILD_PATH,
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: { selector: ':root', outputReferences: true },
        },
      ],
    },
    ts: {
      transformGroup: 'css',
      buildPath: BUILD_PATH,
      files: [{ destination: 'tokens.ts', format: 'typescript/telar-tokens' }],
    },
  },
})

// ── Build dark ([data-theme="dark"]): SOLO reasignación del nivel semántico. ──
const dark = new StyleDictionary({
  source: [PRIMITIVES, 'tokens/semantic/color.dark.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: BUILD_PATH,
      files: [
        {
          destination: 'tokens.dark.css',
          format: 'css/variables',
          // Solo emitimos los tokens definidos en el archivo dark; los primitivos
          // ya viven en :root. La referencia var(--color-...) se resuelve igual.
          filter: (token) => token.filePath.includes('color.dark'),
          options: { selector: '[data-theme="dark"]', outputReferences: true },
        },
      ],
    },
  },
})

await base.buildAllPlatforms()
await dark.buildAllPlatforms()

console.log('✓ Tokens generados en', BUILD_PATH)
