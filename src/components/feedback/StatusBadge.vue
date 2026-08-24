<script setup lang="ts">
import type { BadgeTone } from '@/types'

withDefaults(
  defineProps<{
    label: string
    tone?: BadgeTone
    dot?: boolean
  }>(),
  { tone: 'neutral', dot: false },
)
</script>

<template>
  <span class="badge" :class="`badge--${tone}`">
    <span v-if="dot" class="status-dot" aria-hidden="true"></span>
    {{ label }}
  </span>
</template>

<style scoped>
.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
}
</style>
