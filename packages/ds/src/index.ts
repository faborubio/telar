// API pública de Telar (SAD §4.1, ADR-001).
// Lo que NO se exporta aquí, NO es parte del contrato. Exports nombrados para tree-shaking.
import './styles/index.css'

// ── Primitives ──
export { default as Box } from './primitives/Box.vue'
export { default as Stack } from './primitives/Stack.vue'
export { default as Text } from './primitives/Text.vue'
export { default as Icon } from './primitives/Icon.vue'

// ── Components ──
export { default as Button } from './components/Button/Button.vue'
export { default as Input } from './components/Input/Input.vue'
export { default as Modal } from './components/Modal/Modal.vue'
export { default as Checkbox } from './components/Checkbox/Checkbox.vue'
export { default as RadioGroup } from './components/RadioGroup/RadioGroup.vue'
export type { RadioOption } from './components/RadioGroup/RadioGroup.vue'
export { default as Select } from './components/Select/Select.vue'
export type { SelectOption } from './components/Select/Select.vue'
export { default as Tabs } from './components/Tabs/Tabs.vue'
export type { TabItem } from './components/Tabs/Tabs.vue'
export { default as ToastProvider } from './components/Toast/ToastProvider.vue'

// ── Composables ──
export { useTheme } from './composables/useTheme'
export type { Theme } from './composables/useTheme'
export { useToast } from './composables/useToast'
export type { ToastItem, ToastOptions, ToastVariant } from './composables/useToast'

// ── Tokens (generados; referencias var() tipadas) ──
export { tokens } from './tokens/generated/tokens'
export type { TokenName, TokenVar } from './tokens/generated/tokens'

export const version = '0.0.0'
