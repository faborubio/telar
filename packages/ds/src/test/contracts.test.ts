// Contrato del DS: convierte la Definition of Done (SAD §7) y la regla "sin valores
// mágicos" (SAD §7.1) de prosa a GATES que rompen el build. No dependen del honor.
import { describe, it, expect } from 'vitest'
import { readdirSync, statSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// vitest corre con cwd = packages/ds (root del paquete).
const root = process.cwd()
const componentsDir = resolve(root, 'src/components')
const primitivesDir = resolve(root, 'src/primitives')
const patternsDir = resolve(root, 'src/patterns')

const unitDirs = [
  ...readdirSync(componentsDir).map((n) => [n, `${componentsDir}/${n}`] as const),
  ...readdirSync(patternsDir).map((n) => [n, `${patternsDir}/${n}`] as const),
].filter(([, p]) => statSync(p).isDirectory())

function collectVue(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = `${dir}/${entry}`
    if (statSync(full).isDirectory()) out.push(...collectVue(full))
    else if (entry.endsWith('.vue')) out.push(full)
  }
  return out
}

const sfcFiles = [
  ...collectVue(componentsDir),
  ...collectVue(primitivesDir),
  ...collectVue(patternsDir),
]
const label = (file: string): string => file.split(/[/\\]src[/\\]/).at(-1) ?? file

describe('DoD ejecutable (SAD §7): cada componente/patrón entrega .vue + story + test', () => {
  it.each(unitDirs)('"%s" tiene SFC, story y test', (_name, dir) => {
    const files = readdirSync(dir)
    expect(files.some((f) => f.endsWith('.vue'))).toBe(true)
    expect(files.some((f) => f.endsWith('.stories.ts'))).toBe(true)
    expect(files.some((f) => f.endsWith('.test.ts'))).toBe(true)
  })
})

describe('Sin valores mágicos (SAD §7.1): los SFC usan tokens, no colores literales', () => {
  it.each(sfcFiles.map((f) => [label(f), f] as const))(
    '%s: solo color por tokens',
    (_name, file) => {
      const styles = (readFileSync(file, 'utf8').match(/<style[\s\S]*?<\/style>/g) ?? []).join('\n')
      expect(styles, 'no se permiten hex literales').not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(styles, 'no se permiten rgb()/rgba()').not.toMatch(/\brgba?\(/)
      expect(styles, 'no se permiten hsl()/hsla()').not.toMatch(/\bhsla?\(/)
    },
  )
})
