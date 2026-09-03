<script setup lang="ts">
import { Pencil } from '@lucide/vue'
import { computed, ref } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ContentLanguageTabs, { type ContentLanguage } from '@/components/forms/ContentLanguageTabs.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{ row: ModuleRow }>()

const emit = defineEmits<{
  close: []
  edit: []
}>()
const contentLanguage = ref<ContentLanguage>('zh')
const localized = computed(() => {
  const suffix = contentLanguage.value === 'en' ? 'En' : ''
  return {
    name: String(props.row[`name${suffix}`] ?? (contentLanguage.value === 'en' ? '待配置 English 路线名称' : '—')),
    intro: String(props.row[`intro${suffix}`] ?? (contentLanguage.value === 'en' ? '待配置 English 路线介绍' : '—')),
    description: String(props.row[`description${suffix}`] ?? (contentLanguage.value === 'en' ? '待配置 English 路线描述' : '—')),
  }
})

function money(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
    : '—'
}
</script>

<template>
  <ModalDialog :title="`包车路线详情 · ${row.id}`" eyebrow="CHARTER ROUTE" size="wide" @close="emit('close')">
    <section class="charter-detail-head">
      <div><small>ROUTE OVERVIEW</small><h3>{{ localized.name }}</h3><p>{{ localized.intro }}</p></div>
      <StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '启用' ? 'success' : 'danger'" dot />
    </section>
    <ContentLanguageTabs v-model="contentLanguage" compact />

    <section class="charter-detail-section">
      <header><div><strong>路线信息</strong><small>字段与新增、编辑包车路线保持一致。</small></div></header>
      <div class="charter-detail-grid">
        <div><span>路线ID</span><strong class="mono">{{ row.id }}</strong></div>
        <div><span>排序</span><strong class="mono">{{ row.sort ?? '—' }}</strong></div>
        <div class="charter-detail-grid__wide"><span>{{ contentLanguage === 'zh' ? '路线名称（中文）' : 'Route name (English)' }}</span><strong>{{ localized.name }}</strong></div>
        <div class="charter-detail-grid__wide"><span>{{ contentLanguage === 'zh' ? '路线介绍（中文）' : 'Route introduction (English)' }}</span><strong>{{ localized.intro }}</strong></div>
        <div class="charter-detail-grid__full"><span>{{ contentLanguage === 'zh' ? '路线描述（中文）' : 'Route description (English)' }}</span><strong>{{ localized.description }}</strong></div>
        <div><span>参考金额</span><strong class="charter-detail-price">{{ money(row.referenceAmount) }}</strong><small>仅供乘客参考，实际价格以咨询为准</small></div>
        <div><span>联系电话</span><strong>{{ row.phone }}</strong></div>
        <div><span>状态</span><StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '启用' ? 'success' : 'danger'" dot /></div>
      </div>
    </section>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button>
      <button class="btn btn--brand" type="button" @click="emit('edit')"><Pencil :size="14" />编辑包车路线</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.charter-detail-head { display: flex; align-items: center; justify-content: space-between; padding: 17px 18px; gap: 18px; border-radius: var(--radius-lg); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }
.charter-detail-head small { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; letter-spacing: .09em; }
.charter-detail-head h3 { margin: 4px 0 2px; font-family: var(--font-display); font-size: 17px; }
.charter-detail-head p { margin: 0; color: var(--ink-300); font-size: 9px; }
.charter-detail-section { padding-top: 17px; margin-top: 17px; border-top: 1px solid var(--border); }
.charter-detail-section > header { margin-bottom: 10px; }
.charter-detail-section > header strong { display: block; color: var(--text-strong); font-size: 11px; }
.charter-detail-section > header small { display: block; margin-top: 3px; color: var(--text-faint); font-size: 9px; }
.charter-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.charter-detail-grid > div { min-width: 0; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.charter-detail-grid__wide { grid-column: span 2; }
.charter-detail-grid__full { grid-column: 1 / -1; }
.charter-detail-grid span { display: block; color: var(--text-faint); font-size: 8px; }
.charter-detail-grid strong { display: block; overflow-wrap: anywhere; margin-top: 4px; color: var(--text-subtle); font-size: 10px; line-height: 1.55; }
.charter-detail-grid > div > small { display: block; margin-top: 4px; color: var(--text-faint); font-size: 8px; }
.charter-detail-grid .badge { margin-top: 6px; }
.charter-detail-price { color: var(--brand-dark) !important; font-family: var(--font-mono); font-size: 14px !important; }
@media (max-width: 760px) { .charter-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 520px) { .charter-detail-head { align-items: flex-start; flex-direction: column; } .charter-detail-grid { grid-template-columns: 1fr; } .charter-detail-grid__wide, .charter-detail-grid__full { grid-column: span 1; } }
</style>
