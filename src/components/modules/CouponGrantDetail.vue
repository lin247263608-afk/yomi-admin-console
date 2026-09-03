<script setup lang="ts">
import { ReceiptText } from '@lucide/vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <ModalDialog :title="`发放记录详情 · ${row.code}`" eyebrow="COUPON GRANT RECORD" size="wide" @close="emit('close')">
    <section class="grant-detail-head">
      <span><ReceiptText :size="20" /></span>
      <div><small>{{ row.couponId }}</small><h3>{{ row.couponName }}</h3><p>{{ row.content }} · {{ row.service }}</p></div>
      <StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '已核销' ? 'success' : row.status === '已过期' ? 'danger' : 'warning'" dot />
    </section>
    <div class="grant-detail-grid">
      <div><span>券ID</span><strong class="mono">{{ row.couponId }}</strong></div>
      <div><span>券码</span><strong class="mono">{{ row.code }}</strong></div>
      <div><span>券类型</span><strong>{{ row.couponType }}</strong></div>
      <div><span>使用服务</span><strong>{{ row.service }}</strong></div>
      <div class="grant-detail-grid__wide"><span>券名</span><strong>{{ row.couponName }}</strong></div>
      <div class="grant-detail-grid__wide"><span>优惠内容</span><strong>{{ row.content }}</strong></div>
      <div class="grant-detail-grid__wide"><span>有效期范围</span><strong class="mono">{{ row.validity }}</strong></div>
      <div><span>获取方式</span><strong>{{ row.source }}</strong></div>
      <div><span>状态</span><StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '已核销' ? 'success' : row.status === '已过期' ? 'danger' : 'warning'" dot /></div>
      <div class="grant-detail-grid__wide"><span>持有用户</span><strong>{{ row.holder }}</strong><small>{{ row.phone }}</small></div>
      <div><span>发放时间</span><strong class="mono">{{ row.grantedAt }}</strong></div>
      <div><span>核销订单号</span><strong class="mono">{{ row.orderId }}</strong></div>
    </div>
    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button></template>
  </ModalDialog>
</template>

<style scoped>
.grant-detail-head { display: flex; align-items: center; padding: 17px 18px; gap: 12px; border-radius: var(--radius-lg); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }
.grant-detail-head > span { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border: 1px solid rgba(255,255,255,.14); border-radius: 13px; background: rgba(255,255,255,.07); color: var(--brand-light); }
.grant-detail-head > div { min-width: 0; flex: 1; }
.grant-detail-head small { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; }
.grant-detail-head h3 { margin: 3px 0 2px; font-family: var(--font-display); font-size: 17px; }
.grant-detail-head p { margin: 0; color: var(--ink-300); font-size: 9px; }
.grant-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding-top: 17px; margin-top: 17px; gap: 10px; border-top: 1px solid var(--border); }
.grant-detail-grid > div { min-width: 0; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.grant-detail-grid__wide { grid-column: span 2; }
.grant-detail-grid span { display: block; color: var(--text-faint); font-size: 8px; }
.grant-detail-grid strong { display: block; overflow-wrap: anywhere; margin-top: 5px; color: var(--text-subtle); font-size: 10px; }
.grant-detail-grid small { display: block; margin-top: 3px; color: var(--text-faint); font-size: 8px; }
.grant-detail-grid .badge { margin-top: 6px; }
@media (max-width: 680px) { .grant-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 440px) { .grant-detail-grid { grid-template-columns: 1fr; } .grant-detail-grid__wide { grid-column: span 1; } }
</style>
