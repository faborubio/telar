# @telar/ds

## 0.1.1

### Patch Changes

- a11y: corrige el contraste de color en tema oscuro para cumplir WCAG 2.1 AA (SAD §8).

  Detectado por el E2E de accesibilidad (cypress-axe en Chromium real) introducido en la
  Fase 3: jsdom no computa contraste, así que estas violaciones `serious` no se veían en los
  tests unitarios.

  - **Botón primario (dark):** `color.action`/`action-hover`/`action-active` pasan de
    `blue.500/400/300` a `blue.600/700/800`. El texto blanco sobre el azul resting subía de
    3.68:1 a 5.17:1 (≥ 4.5). `action` solo se usa como fondo de botón (con texto blanco), por
    lo que oscurecerlo no afecta enlaces ni anillos de foco.
  - **Color de enlace:** nuevos tokens semánticos `color.link` y `color.link-hover`
    (light `blue.700`/`blue.800`, dark `blue.400`/`blue.300`), pensados para texto sobre
    fondo —contraste opuesto al del botón—. Resuelve los enlaces ilegibles en oscuro.

## 0.1.0

### Minor Changes

- Núcleo del Design System (Fase 1). Componentes sobre Reka UI: Button, Input, Modal, Checkbox, RadioGroup, Select, Tabs y Toast (con `useToast`). Primitives Box/Stack/Text/Icon y composable `useTheme`. Tokens en tres niveles con theming dark/light. Cada componente con tests + accesibilidad (axe) + story en Storybook.
