<script setup lang="ts">
import { CalendarDays, Pencil, ShieldCheck } from '@lucide/vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: []; edit: [] }>()
</script>

<template>
  <ModalDialog :title="`活动详情 · ${row.id}`" eyebrow="CAMPAIGN DETAIL" size="wide" @close="emit('close')">
    <section class="campaign-detail-head">
      <span><CalendarDays :size="20" /></span>
      <div><small>{{ row.campaignType }}</small><h3>{{ row.name }}</h3><p>{{ row.validity }}</p></div>
      <StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '进行中' ? 'success' : row.status === '待开始' ? 'warning' : row.status === '下架' ? 'danger' : 'neutral'" dot />
    </section>

    <div class="campaign-detail-grid">
      <div><span>活动ID</span><strong class="mono">{{ row.id }}</strong></div>
      <div><span>状态</span><StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '进行中' ? 'success' : row.status === '待开始' ? 'warning' : row.status === '下架' ? 'danger' : 'neutral'" dot /></div>
      <div class="campaign-detail-grid__wide"><span>活动名</span><strong>{{ row.name }}</strong></div>
      <div class="campaign-detail-grid__wide"><span>活动类型</span><strong>{{ row.campaignType }}</strong></div>
      <div class="campaign-detail-grid__wide"><span>关联优惠券</span><strong>{{ row.coupon }}</strong><small class="mono">{{ row.couponId }}</small></div>
      <div><span>有效期开始</span><strong class="mono">{{ row.validFrom }}</strong></div>
      <div><span>有效期结束</span><strong class="mono">{{ row.validTo }}</strong></div>
      <div><span>触发人数</span><strong>{{ row.triggered }}</strong></div>
      <div><span>成功发券</span><strong>{{ row.granted }}</strong></div>
    </div>

    <section class="campaign-trigger-rule"><ShieldCheck :size="17" /><div><span>发放触发</span><strong>{{ row.triggerRule }}</strong><p>得券方：{{ row.recipient }}。同一设备标识重复触发时不再发放，且受关联券剩余数量约束。</p></div></section>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button>
      <button v-if="row.status === '下架'" class="btn btn--brand" type="button" @click="emit('edit')"><Pencil :size="14" />编辑活动</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.campaign-detail-head { display: flex; align-items: center; padding: 17px 18px; gap: 12px; border-radius: var(--radius-lg); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }
.campaign-detail-head > span { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border: 1px solid rgba(255,255,255,.14); border-radius: 13px; background: rgba(255,255,255,.07); color: var(--brand-light); }
.campaign-detail-head > div { min-width: 0; flex: 1; }
.campaign-detail-head small { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; }
.campaign-detail-head h3 { margin: 3px 0 2px; font-family: var(--font-display); font-size: 17px; }
.campaign-detail-head p { margin: 0; color: var(--ink-300); font-size: 9px; }
.campaign-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding-top: 17px; margin-top: 17px; gap: 10px; border-top: 1px solid var(--border); }
.campaign-detail-grid > div { min-width: 0; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.campaign-detail-grid__wide { grid-column: span 2; }
.campaign-detail-grid span { display: block; color: var(--text-faint); font-size: 8px; }
.campaign-detail-grid strong { display: block; overflow-wrap: anywhere; margin-top: 5px; color: var(--text-subtle); font-size: 10px; }
.campaign-detail-grid small { display: block; margin-top: 3px; color: var(--text-faint); font-size: 8px; }
.campaign-detail-grid .badge { margin-top: 6px; }
.campaign-trigger-rule { display: flex; align-items: flex-start; padding: 14px; margin-top: 14px; gap: 10px; border-radius: var(--radius-md); background: #eff6ff; color: #1d4ed8; }
.campaign-trigger-rule svg { flex: none; margin-top: 1px; }
.campaign-trigger-rule span { display: block; font-family: var(--font-mono); font-size: 8px; }
.campaign-trigger-rule strong { display: block; margin-top: 3px; font-size: 10px; }
.campaign-trigger-rule p { margin: 3px 0 0; font-size: 9px; line-height: 1.55; }
@media (max-width: 680px) { .campaign-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 440px) { .campaign-detail-grid { grid-template-columns: 1fr; } .campaign-detail-grid__wide { grid-column: span 1; } }
</style>
