import type { Preview } from '@storybook/vue3'
// Carga los estilos del DS (tokens + reset + base) en el canvas de Storybook.
import '../src/styles/index.css'

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disable: true },
    a11y: { test: 'error' },
  },
  globalTypes: {
    theme: {
      description: 'Tema del Design System',
      defaultValue: 'light',
      toolbar: {
        title: 'Tema',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Claro' },
          { value: 'dark', title: 'Oscuro' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      // El theming es reasignar data-theme (ADR-003): el toolbar lo conmuta en vivo.
      document.documentElement.setAttribute('data-theme', context.globals.theme ?? 'light')
      return {
        components: { story },
        template:
          '<div style="background: var(--color-bg); color: var(--color-text); padding: 2rem; min-height: 100vh;"><story /></div>',
      }
    },
  ],
}

export default preview
