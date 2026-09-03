<script setup lang="ts">
import { computed } from 'vue'
import { CircleDollarSign, ReceiptText, UserRound } from '@lucide/vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'
import type { BadgeTone } from '@/types'

type SettlementDetail = {
  orderId: string
  totalAmount: number
  tripFee: number
  depositAmount: number
  addOnFee: number
  couponAmount: number
  commission: number
  driverAmount: number
  settledAt: string
  status: string
}

const props = defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: [] }>()

const moneyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
})

const details = computed<SettlementDetail[]>(() => {
  const source = Array.isArray(props.row.settlementDetails)
    ? props.row.settlementDetails as Array<Record<string, string | number>>
    : []

  return source
    .map((item) => ({
      orderId: String(item.orderId ?? ''),
      totalAmount: Number(item.totalAmount ?? 0),
      tripFee: Number(item.tripFee ?? 0),
      depositAmount: Number(item.depositAmount ?? 0),
      addOnFee: Number(item.addOnFee ?? 0),
      couponAmount: Number(item.couponAmount ?? 0),
      commission: Number(item.commission ?? 0),
      driverAmount: Number(item.driverAmount ?? 0),
      settledAt: String(item.settledAt ?? ''),
      status: String(item.status ?? '结算中'),
    }))
    .sort((a, b) => b.settledAt.localeCompare(a.settledAt))
})

const detailTotals = computed(() => details.value.reduce((totals, item) => ({
  orderAmount: totals.orderAmount + item.totalAmount,
  commission: totals.commission + item.commission,
  driverAmount: totals.driverAmount + item.driverAmount,
}), { orderAmount: 0, commission: 0, driverAmount: 0 }))

function formatMoney(value: number) {
  return moneyFormatter.format(value)
}

function statusTone(status: string): BadgeTone {
  if (status === '已结算') return 'success'
  if (status === '失败') return 'danger'
  return 'warning'
}
</script>

<template>
  <ModalDialog :title="`结算明细 · ${row.driver}`" eyebrow="DRIVER SETTLEMENT DETAILS" size="wide" @close="emit('close')">
    <section class="settlement-driver-head">
      <span class="settlement-driver-head__icon"><UserRound :size="21" /></span>
      <div class="settlement-driver-head__identity">
        <small>{{ row.id }}</small>
        <h3>{{ row.driver }}</h3>
        <p>{{ row.phone }} · 按结算时间倒序</p>
      </div>
      <StatusBadge :label="String(row.settlementState ?? '正常')" :tone="String(row.settlementState ?? '').includes('失败') ? 'danger' : 'success'" dot />
    </section>

    <section class="settlement-summary" aria-label="当前列表汇总">
      <article>
        <span><ReceiptText :size="15" /></span>
        <div><small>当前明细</small><strong>{{ details.length }} 笔</strong></div>
      </article>
      <article>
        <span><CircleDollarSign :size="15" /></span>
        <div><small>订单金额</small><strong>{{ formatMoney(detailTotals.orderAmount) }}</strong></div>
      </article>
      <article>
        <span><CircleDollarSign :size="15" /></span>
        <div><small>平台抽佣</small><strong>{{ formatMoney(detailTotals.commission) }}</strong></div>
      </article>
      <article class="settlement-summary__income">
        <span><CircleDollarSign :size="15" /></span>
        <div><small>司机应得</small><strong>{{ formatMoney(detailTotals.driverAmount) }}</strong></div>
      </article>
    </section>

    <p class="settlement-rule-note">结算口径：行程费为乘客优惠后实付；优惠券由平台承担且不冲减分账基数；乘客定金与增值服务费计入分账基数。</p>

    <section class="settlement-list">
      <header>
        <div><span>SETTLEMENT LIST</span><h3>订单结算记录</h3></div>
        <small>最新结算优先 · 共 {{ details.length }} 笔</small>
      </header>
      <div class="settlement-table-wrap">
        <table>
          <thead><tr><th>订单 ID</th><th>订单金额构成</th><th>平台抽佣</th><th>司机应得</th><th>结算时间</th><th>状态</th></tr></thead>
          <tbody>
            <tr v-for="detail in details" :key="detail.orderId">
              <td><strong class="mono">{{ detail.orderId }}</strong></td>
              <td>
                <div class="settlement-amount">
                  <strong>{{ formatMoney(detail.totalAmount) }}</strong>
                  <div>
                    <span>行程费 <b>{{ formatMoney(detail.tripFee) }}</b></span>
                    <span>乘客定金 <b>{{ formatMoney(detail.depositAmount) }}</b></span>
                    <span>增值服务费 <b>{{ formatMoney(detail.addOnFee) }}</b></span>
                    <span>优惠券 <b>-{{ formatMoney(detail.couponAmount) }}</b></span>
                  </div>
                </div>
              </td>
              <td><strong>{{ formatMoney(detail.commission) }}</strong></td>
              <td><strong class="settlement-income">{{ formatMoney(detail.driverAmount) }}</strong></td>
              <td><time class="mono">{{ detail.settledAt }}</time></td>
              <td><StatusBadge :label="detail.status" :tone="statusTone(detail.status)" dot /></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="details.length === 0" class="settlement-empty">暂无结算明细</div>
    </section>

    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button></template>
  </ModalDialog>
</template>

<style scoped>
.settlement-driver-head { display: flex; align-items: center; padding: 16px 18px; gap: 12px; border-radius: var(--radius-lg); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }
.settlement-driver-head__icon { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border: 1px solid rgba(255,255,255,.14); border-radius: 13px; background: rgba(255,255,255,.07); color: var(--brand-light); }
.settlement-driver-head__identity { min-width: 0; flex: 1; }
.settlement-driver-head__identity small { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; letter-spacing: .08em; }
.settlement-driver-head__identity h3 { margin: 3px 0 2px; font-family: var(--font-display); font-size: 17px; }
.settlement-driver-head__identity p { margin: 0; color: var(--ink-300); font-size: 9px; }
.settlement-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 14px; gap: 9px; }
.settlement-summary article { display: flex; align-items: center; min-width: 0; padding: 12px 13px; gap: 9px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.settlement-summary article > span { display: grid; width: 30px; height: 30px; flex: none; place-items: center; border-radius: 9px; background: var(--ink-100); color: var(--ink-600); }
.settlement-summary article div { min-width: 0; }
.settlement-summary small { display: block; color: var(--text-faint); font-size: 8px; }
.settlement-summary strong { display: block; margin-top: 3px; color: var(--text-strong); font-family: var(--font-display); font-size: 13px; }
.settlement-summary__income > span { background: var(--success-bg) !important; color: var(--success) !important; }
.settlement-summary__income strong { color: var(--success); }
.settlement-rule-note { margin: 10px 2px 0; color: var(--text-faint); font-size: 8px; line-height: 1.7; }
.settlement-list { margin-top: 16px; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.settlement-list > header { display: flex; align-items: flex-end; justify-content: space-between; padding: 13px 15px; gap: 12px; border-bottom: 1px solid var(--border); background: var(--page); }
.settlement-list > header span { color: var(--brand); font-family: var(--font-mono); font-size: 7px; font-weight: 800; letter-spacing: .11em; }
.settlement-list > header h3 { margin: 3px 0 0; color: var(--text-strong); font-size: 12px; }
.settlement-list > header small { color: var(--text-faint); font-size: 8px; }
.settlement-table-wrap { overflow-x: auto; }
.settlement-table-wrap table { width: 100%; min-width: 950px; border-collapse: collapse; }
.settlement-table-wrap th { padding: 9px 11px; background: var(--ink-50); color: var(--text-faint); font-size: 8px; font-weight: 800; text-align: left; white-space: nowrap; }
.settlement-table-wrap td { padding: 11px; border-top: 1px solid var(--border); color: var(--text-subtle); font-size: 9px; vertical-align: middle; }
.settlement-table-wrap tbody tr:first-child td { border-top: 0; }
.settlement-table-wrap tbody tr:hover { background: var(--brand-soft); }
.settlement-table-wrap time { color: var(--text-muted); white-space: nowrap; }
.settlement-amount { min-width: 300px; }
.settlement-amount > strong { color: var(--brand); font-family: var(--font-display); font-size: 11px; }
.settlement-amount > div { display: grid; grid-template-columns: repeat(4, max-content); margin-top: 6px; gap: 5px; }
.settlement-amount span { padding: 4px 6px; border-radius: 6px; background: var(--page); color: var(--text-faint); font-size: 7px; white-space: nowrap; }
.settlement-amount b { margin-left: 3px; color: var(--text-subtle); font-weight: 750; }
.settlement-income { color: var(--success); }
.settlement-empty { padding: 34px; color: var(--text-faint); font-size: 10px; text-align: center; }
@media (max-width: 760px) { .settlement-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } .settlement-list > header { align-items: flex-start; flex-direction: column; } }
@media (max-width: 460px) { .settlement-summary { grid-template-columns: 1fr; } }
</style>
