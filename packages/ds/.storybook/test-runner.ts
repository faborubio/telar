import type { TestRunnerConfig } from '@storybook/test-runner'
import { getStoryContext } from '@storybook/test-runner'
import { checkA11y, configureAxe, injectAxe } from 'axe-playwright'
import { toMatchImageSnapshot } from 'jest-image-snapshot'

// Story-as-test (SAD §10.1) + regresión visual de pixel (ADR-016). El test-runner monta
// CADA story en un navegador real (Chromium):
//   1. smoke   — una story que lanza al renderizar rompe el build;
//   2. axe     — accesibilidad por story (motor real, ve el contraste que jsdom no);
//   3. pixel   — diff de captura contra un baseline (solo cuando VISUAL_SNAPSHOTS=1).
//
// El diff de pixel es determinista porque baseline y verificación se generan en el MISMO
// entorno: CI Linux (ubuntu-24.04) con la versión de Chromium fijada por el lockfile. El
// render de fuentes Windows≠Linux haría flakear baselines hechos en local, por eso el
// snapshot se gatea por env: en local (Windows) se corre solo smoke + axe.
const VISUAL_SNAPSHOTS = process.env.VISUAL_SNAPSHOTS === '1'

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot })
  },

  async preVisit(page) {
    await injectAxe(page)
  },

  async postVisit(page, context) {
    const storyContext = await getStoryContext(page, context)

    // a11y por story (respeta `parameters.a11y.disable` como escape hatch documentado).
    if (!storyContext.parameters?.a11y?.disable) {
      await configureAxe(page, { rules: storyContext.parameters?.a11y?.config?.rules })
      await checkA11y(page, '#storybook-root', {
        detailedReport: true,
        detailedReportOptions: { html: true },
      })
    }

    if (!VISUAL_SNAPSHOTS) return

    // Estabilizar antes de capturar: red en reposo + fuentes cargadas (evita flakiness).
    await page.waitForLoadState('networkidle').catch(() => undefined)
    await page.evaluate(() => document.fonts?.ready).catch(() => undefined)

    const image = await page.locator('#storybook-root').screenshot({
      animations: 'disabled',
      caret: 'hide',
    })

    expect(image).toMatchImageSnapshot({
      customSnapshotsDir: `${process.cwd()}/__image_snapshots__`,
      // Id estable de la story (p. ej. "components-button--primary").
      customSnapshotIdentifier: context.id,
      // SSIM tolera micro-diferencias de antialiasing pero detecta cambios visuales reales.
      comparisonMethod: 'ssim',
      failureThreshold: 0.02,
      failureThresholdType: 'percent',
    })
  },
}

export default config
