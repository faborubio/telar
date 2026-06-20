import type { TestRunnerConfig } from '@storybook/test-runner'
import { getStoryContext } from '@storybook/test-runner'
import { checkA11y, configureAxe, injectAxe } from 'axe-playwright'

// Story-as-test (SAD §10.1): el test-runner monta CADA story en un navegador real
// (Chromium). Por sí solo ya es smoke test —una story que lanza al renderizar rompe el
// build—; aquí añadimos el check de accesibilidad por story con axe (motor real, ve el
// contraste que jsdom no). Sustituye al diff de pixel (diferido por determinismo de render).
const config: TestRunnerConfig = {
  async preVisit(page) {
    await injectAxe(page)
  },
  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context)
    // Respeta `parameters.a11y.disable` de una story puntual (escape hatch documentado).
    if (storyContext.parameters?.a11y?.disable) return

    await configureAxe(page, {
      rules: storyContext.parameters?.a11y?.config?.rules,
    })
    // Acota el escaneo al contenido de la story (no al chrome de Storybook).
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: { html: true },
    })
  },
}

export default config
