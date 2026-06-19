<script setup lang="ts">
// Box — contenedor de layout sin opinión de marca (SAD §4.2, "Primitives").
// Todo valor pasa por tokens; no se aceptan medidas mágicas.
import { computed } from 'vue'

type SpaceToken = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16'
type RadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
type SurfaceToken = 'bg' | 'bg-subtle' | 'bg-muted' | 'surface' | 'surface-raised'

const props = withDefaults(
  defineProps<{
    /** Elemento HTML a renderizar (polimórfico). */
    as?: string
    padding?: SpaceToken
    radius?: RadiusToken
    background?: SurfaceToken
    bordered?: boolean
  }>(),
  { as: 'div', bordered: false },
)

const style = computed<Record<string, string>>(() => {
  const s: Record<string, string> = {}
  if (props.padding) s.padding = `var(--space-${props.padding})`
  if (props.radius) s.borderRadius = `var(--radius-${props.radius})`
  if (props.background) s.background = `var(--color-${props.background})`
  return s
})
</script>

<template>
  <component :is="as" class="telar-box" :class="{ 'telar-box--bordered': bordered }" :style="style">
    <slot />
  </component>
</template>

<style scoped>
@layer ds {
  .telar-box {
    box-sizing: border-box;
  }

  .telar-box--bordered {
    border: var(--border-width-thin) solid var(--color-border);
  }
}
</style>
