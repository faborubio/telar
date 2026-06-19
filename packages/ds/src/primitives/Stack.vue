<script setup lang="ts">
// Stack — layout flex con gap tokenizado. Evita reinventar flex en cada pantalla (SAD §4.2).
import { computed } from 'vue'

type SpaceToken = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16'
type Direction = 'row' | 'column'
type Align = 'start' | 'center' | 'end' | 'stretch'
type Justify = 'start' | 'center' | 'end' | 'between'

const props = withDefaults(
  defineProps<{
    as?: string
    direction?: Direction
    gap?: SpaceToken
    align?: Align
    justify?: Justify
    wrap?: boolean
  }>(),
  { as: 'div', direction: 'column', gap: '4', align: 'stretch', justify: 'start', wrap: false },
)

const alignMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
} as const

const justifyMap = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
} as const

const style = computed<Record<string, string>>(() => ({
  display: 'flex',
  flexDirection: props.direction,
  gap: `var(--space-${props.gap})`,
  alignItems: alignMap[props.align],
  justifyContent: justifyMap[props.justify],
  flexWrap: props.wrap ? 'wrap' : 'nowrap',
}))
</script>

<template>
  <component :is="as" :style="style">
    <slot />
  </component>
</template>
