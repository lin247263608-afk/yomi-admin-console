<script setup lang="ts">
import { ListOrdered, Pencil, ShieldAlert } from '@lucide/vue'
import { computed, ref } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ContentLanguageTabs, { type ContentLanguage } from '@/components/forms/ContentLanguageTabs.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: []; edit: [] }>()
const contentLanguage = ref<ContentLanguage>('zh')
const localized = computed(() => contentLanguage.value === 'en'
  ? { name: String(props.row.nameEn ?? '待配置 English 服务名称'), description: String(props.row.descriptionEn ?? '待配置 English 服务描述') }
  : { name: String(props.row.name ?? '—'), description: String(props.row.description ?? '—') })

function money(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
    : '—'
}
</script>

<template>
  <ModalDialog :title="`增值服务详情 · ${row.id}`" eyebrow="SERVICE DETAIL" size="wide" @close="emit('close')">
    <section class="service-detail-head">
      <span><ListOrdered :size="20" /></span>
      <div><small>{{ row.serviceMode ?? '线下服务' }}</small><h3>{{ localized.name }}</h3><p>{{ localized.description }}</p></div>
      <StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '启用' ? 'success' : 'danger'" dot />
    </section>
    <ContentLanguageTabs v-model="contentLanguage" compact />

    <div class="service-detail-grid">
      <div><span>服务ID</span><strong class="mono">{{ row.id }}</strong></div>
      <div><span>费用</span><strong class="service-price">{{ money(row.fee) }}</strong></div>
      <div><span>排序</span><strong class="mono">{{ row.sort ?? '—' }}</strong></div>
      <div><span>状态</span><StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '启用' ? 'success' : 'danger'" dot /></div>
      <div class="service-detail-grid__wide"><span>{{ contentLanguage === 'zh' ? '服务名称（中文）' : 'Service name (English)' }}</span><strong>{{ localized.name }}</strong></div>
      <div class="service-detail-grid__wide"><span>服务类型</span><strong>{{ row.serviceMode ?? '线下服务' }}</strong></div>
      <div class="service-detail-grid__full"><span>{{ contentLanguage === 'zh' ? '服务描述（中文）' : 'Service description (English)' }}</span><strong>{{ localized.description }}</strong></div>
    </div>

    <section v-if="row.businessLinked" class="service-business-link"><ShieldAlert :size="17" /><div><strong>业务关联服务，不允许删除</strong><p>可继续编辑或禁用；历史订单中的服务名称、费用与分账明细保留不变。</p></div></section>
    <section v-else class="service-business-link service-business-link--offline"><ShieldAlert :size="17" /><div><strong>线下服务，可自由维护</strong><p>可新增、编辑、启用、禁用或删除；费用修改只影响新订单。</p></div></section>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button>
      <button class="btn btn--brand" type="button" @click="emit('edit')"><Pencil :size="14" />编辑服务</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.service-detail-head { display: flex; align-items: center; padding: 17px 18px; gap: 12px; border-radius: var(--radius-lg); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }
.service-detail-head > span { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border: 1px solid rgba(255,255,255,.14); border-radius: 13px; background: rgba(255,255,255,.07); color: var(--brand-light); }
.service-detail-head > div { min-width: 0; flex: 1; }
.service-detail-head small { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; }
.service-detail-head h3 { margin: 3px 0 2px; font-family: var(--font-display); font-size: 17px; }
.service-detail-head p { margin: 0; color: var(--ink-300); font-size: 9px; }
.service-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding-top: 17px; margin-top: 17px; gap: 10px; border-top: 1px solid var(--border); }
.service-detail-grid > div { min-width: 0; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.service-detail-grid__wide { grid-column: span 2; }
.service-detail-grid__full { grid-column: 1 / -1; }
.service-detail-grid span { display: block; color: var(--text-faint); font-size: 8px; }
.service-detail-grid strong { display: block; overflow-wrap: anywhere; margin-top: 5px; color: var(--text-subtle); font-size: 10px; line-height: 1.55; }
.service-detail-grid .badge { margin-top: 6px; }
.service-price { color: var(--brand-dark) !important; font-family: var(--font-mono); font-size: 14px !important; }
.service-business-link { display: flex; align-items: flex-start; padding: 14px; margin-top: 14px; gap: 10px; border-radius: var(--radius-md); background: #fff7ed; color: #c2410c; }
.service-business-link--offline { background: #eff6ff; color: #1d4ed8; }
.service-business-link svg { flex: none; margin-top: 1px; }
.service-business-link strong { display: block; font-size: 10px; }
.service-business-link p { margin: 3px 0 0; font-size: 9px; line-height: 1.55; }
@media (max-width: 680px) { .service-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 440px) { .service-detail-grid { grid-template-columns: 1fr; } .service-detail-grid__wide, .service-detail-grid__full { grid-column: auto; } }
</style>
