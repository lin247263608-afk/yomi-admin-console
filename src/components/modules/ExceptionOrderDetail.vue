<script setup lang="ts">
import { AlertTriangle, Luggage, MapPin, UserRound } from '@lucide/vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: []; refund: []; cancelRefund: [] }>()
const money = (value: unknown) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(Number(value ?? 0))
</script>

<template>
  <ModalDialog :title="`异常订单 · ${row.id}`" eyebrow="EXCEPTION ORDER DETAIL" size="wide" @close="emit('close')">
    <section class="exception-head">
      <span><AlertTriangle :size="22" /></span>
      <div><small>{{ row.exceptionReason }} · {{ row.reportedAt }}</small><h3>{{ row.passenger }} 的订单已挂起</h3><p>{{ row.driver }} 上报 · 每行仅处理该名异常乘客</p></div>
      <StatusBadge :label="String(row.status)" :tone="row.status === '已处理' ? 'success' : 'warning'" dot />
    </section>

    <section class="exception-amounts">
      <article><span>订单金额</span><strong>{{ money(row.orderAmount) }}</strong></article>
      <article><span>乘客定金</span><strong>{{ money(row.depositAmount) }}</strong></article>
      <article><span>尾款</span><strong>{{ money(row.balanceAmount) }}</strong></article>
      <article><span>增值服务费</span><strong>{{ money(row.addOnFee) }}</strong></article>
      <article class="is-key"><span>可退款上限</span><strong>{{ money(row.pendingAmount) }}</strong></article>
    </section>

    <div class="exception-grid">
      <section>
        <header><MapPin :size="15" /><strong>订单与路线</strong></header>
        <dl><div><dt>路线</dt><dd>{{ row.route }}</dd></div><div><dt>路线 ID</dt><dd class="mono">{{ row.routeId }}</dd></div><div><dt>出发时间</dt><dd class="mono">{{ row.departureAt }}</dd></div><div><dt>业务 / 服务</dt><dd>{{ row.business }}</dd></div><div><dt>订单状态</dt><dd><StatusBadge :label="String(row.orderStatus)" tone="warning" dot /></dd></div><div><dt>增值服务</dt><dd>{{ row.addOns }} · {{ row.addOnAmount }}</dd></div></dl>
      </section>
      <section>
        <header><UserRound :size="15" /><strong>乘客与司机</strong></header>
        <dl><div><dt>异常乘客</dt><dd>{{ row.passenger }} · {{ row.passengerId }}</dd></div><div><dt>乘客手机号</dt><dd>{{ row.phone }}</dd></div><div><dt>乘客 / 行李</dt><dd><Luggage :size="12" />{{ row.party }}</dd></div><div><dt>上报司机</dt><dd>{{ row.driver }} · {{ row.driverId }}</dd></div><div><dt>司机手机号</dt><dd>{{ row.driverPhone }}</dd></div><div><dt>上报时间</dt><dd class="mono">{{ row.reportedAt }}</dd></div></dl>
      </section>
    </div>

    <section v-if="row.status === '已处理'" class="exception-result">
      <div><span>处理结果</span><strong>{{ row.resolution }}</strong></div><div><span>实际退款</span><strong>{{ money(row.refundAmount) }}</strong></div><div><span>退款原因</span><strong>{{ row.refundReason ?? '—' }}</strong></div><div><span>处理时间</span><strong class="mono">{{ row.handledAt }}</strong></div>
    </section>
    <p class="exception-rule">司机分账不受本次乘客退款影响；人工退款由平台承担，并作为平台支出单独记录。</p>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button>
      <button v-if="row.status !== '已处理'" class="btn btn--secondary" type="button" @click="emit('cancelRefund')">取消退款</button>
      <button v-if="row.status !== '已处理'" class="btn btn--brand" type="button" @click="emit('refund')">人工退款</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.exception-head { display: flex; align-items: center; padding: 16px 18px; gap: 12px; border-radius: var(--radius-lg); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }.exception-head > span { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border: 1px solid rgba(255,255,255,.14); border-radius: 13px; background: rgba(255,255,255,.07); color: var(--brand-light); }.exception-head > div { flex: 1; }.exception-head small { color: var(--brand-light); font-size: 8px; }.exception-head h3 { margin: 3px 0 2px; font-size: 16px; }.exception-head p { margin: 0; color: var(--ink-300); font-size: 9px; }
.exception-amounts { display: grid; grid-template-columns: repeat(5, 1fr); margin-top: 14px; gap: 8px; }.exception-amounts article { padding: 11px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }.exception-amounts span,.exception-amounts strong { display: block; }.exception-amounts span { color: var(--text-faint); font-size: 8px; }.exception-amounts strong { margin-top: 4px; color: var(--text-strong); font-size: 12px; }.exception-amounts .is-key { border-color: var(--warning-border); background: var(--warning-bg); }.exception-amounts .is-key strong { color: var(--warning); }
.exception-grid { display: grid; grid-template-columns: repeat(2, 1fr); margin-top: 13px; gap: 12px; }.exception-grid section { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-lg); }.exception-grid header { display: flex; align-items: center; padding: 11px 13px; gap: 6px; border-bottom: 1px solid var(--border); background: var(--page); color: var(--ink-600); font-size: 10px; }.exception-grid dl { display: grid; grid-template-columns: repeat(2, 1fr); padding: 11px; margin: 0; gap: 8px; }.exception-grid dl div { min-width: 0; padding: 9px; border-radius: var(--radius-md); background: var(--page); }.exception-grid dt { color: var(--text-faint); font-size: 8px; }.exception-grid dd { display: flex; align-items: center; min-height: 18px; margin: 4px 0 0; gap: 4px; overflow-wrap: anywhere; color: var(--text-subtle); font-size: 9px; font-weight: 750; }
.exception-result { display: grid; grid-template-columns: repeat(4, 1fr); padding: 11px; margin-top: 12px; gap: 8px; border: 1px solid var(--success-border); border-radius: var(--radius-lg); background: var(--success-bg); }.exception-result span,.exception-result strong { display: block; }.exception-result span { color: var(--text-faint); font-size: 8px; }.exception-result strong { margin-top: 4px; color: var(--text-subtle); font-size: 9px; }.exception-rule { margin: 10px 2px 0; color: var(--text-faint); font-size: 8px; line-height: 1.7; }
@media (max-width: 760px) { .exception-amounts { grid-template-columns: repeat(2, 1fr); }.exception-grid { grid-template-columns: 1fr; }.exception-result { grid-template-columns: repeat(2, 1fr); } }
</style>
