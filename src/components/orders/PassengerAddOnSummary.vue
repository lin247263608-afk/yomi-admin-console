<script setup lang="ts">
import { computed } from 'vue'

import type { ValueAddedServiceSelection } from '@/types'
import { formatCurrency } from '@/utils/format'

const props = defineProps<{
  services: ValueAddedServiceSelection[]
}>()

const subtotalPence = computed(() =>
  props.services.reduce((sum, service) => sum + service.pricePence, 0),
)
</script>

<template>
  <div class="add-on-summary">
    <div class="add-on-summary__heading">
      <span>增值服务</span>
      <strong v-if="services.length">小计 {{ formatCurrency(subtotalPence) }}</strong>
      <strong v-else>无</strong>
    </div>
    <ul v-if="services.length">
      <li v-for="service in services" :key="service.id">
        <span>{{ service.name }}</span>
        <strong>{{ formatCurrency(service.pricePence) }}</strong>
      </li>
    </ul>
    <p v-else>该乘客下单时未选择增值服务。</p>
  </div>
</template>

<style scoped>
.add-on-summary {
  padding: 10px 11px;
  margin-top: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--page);
}

.add-on-summary__heading,
.add-on-summary li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.add-on-summary__heading > span {
  color: var(--text-subtle);
  font-size: 10px;
  font-weight: 700;
}

.add-on-summary__heading > strong {
  color: var(--brand);
  font-family: var(--font-mono);
  font-size: 9px;
}

.add-on-summary ul {
  padding: 7px 0 0;
  margin: 7px 0 0;
  border-top: 1px solid var(--border);
  list-style: none;
}

.add-on-summary li + li { margin-top: 6px; }
.add-on-summary li span { color: var(--text-muted); font-size: 10px; }
.add-on-summary li strong { color: var(--text-subtle); font-family: var(--font-mono); font-size: 9px; }
.add-on-summary p { margin: 7px 0 0; color: var(--text-faint); font-size: 9px; }
</style>
