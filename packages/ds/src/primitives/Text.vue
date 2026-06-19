<script setup lang="ts">
// Text — tipografía tokenizada. El color pasa por tokens semánticos (theming-aware).
import { computed } from 'vue'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
type Weight = 'regular' | 'medium' | 'semibold' | 'bold'
type Tone = 'text' | 'text-muted' | 'text-subtle' | 'action' | 'danger' | 'success' | 'warning'
type Align = 'start' | 'center' | 'end'

const props = withDefaults(
  defineProps<{
    as?: string
    size?: Size
    weight?: Weight
    tone?: Tone
    align?: Align
  }>(),
  { as: 'span', size: 'md', weight: 'regular', tone: 'text' },
)

const style = computed<Record<string, string>>(() => {
  const s: Record<string, string> = {
    fontSize: `var(--font-size-${props.size})`,
    fontWeight: `var(--font-weight-${props.weight})`,
    color: `var(--color-${props.tone})`,
  }
  if (props.align) s.textAlign = props.align
  return s
})
</script>

<template>
  <component :is="as" :style="style">
    <slot />
  </component>
</template>
