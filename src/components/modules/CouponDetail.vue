<script setup lang="ts">
import { LockKeyhole, Pencil, TicketCheck } from '@lucide/vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{ row: ModuleRow }>()

const emit = defineEmits<{
  close: []
  edit: []
}>()

function number(value: unknown) {
  return Number(value ?? 0).toLocaleString('en-GB')
}

function money(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
    : '—'
}

const issued = Number(props.row.issuedQuantity ?? 0)
const redeemed = Number(props.row.redeemedQuantity ?? 0)
const total = Number(props.row.totalQuantity ?? 0)
</script>

<template>
  <ModalDialog :title="`优惠券详情 · ${row.id}`" eyebrow="COUPON DETAIL" size="wide" @close="emit('close')">
    <section class="coupon-detail-head">
      <div class="coupon-detail-head__icon"><TicketCheck :size="21" /></div>
      <div><small>{{ row.couponType }} COUPON</small><h3>{{ row.name }}</h3><p>{{ row.content }} · 适用于{{ row.service }}服务</p></div>
      <StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '启用' ? 'success' : 'danger'" dot />
    </section>

    <section class="coupon-detail-section">
      <header><strong>优惠券规则</strong><small>字段与新增、编辑优惠券表单保持一致。</small></header>
      <div class="coupon-detail-grid">
        <div><span>券ID</span><strong class="mono">{{ row.id }}</strong></div>
        <div><span>券类型</span><strong>{{ row.couponType }}</strong></div>
        <div class="coupon-detail-grid__wide"><span>券名</span><strong>{{ row.name }}</strong></div>
        <template v-if="row.couponType === '满减'">
          <div><span>起用金额（满）</span><strong>{{ money(row.thresholdAmount) }}</strong></div>
          <div><span>抵扣金额</span><strong class="coupon-detail-accent">{{ money(row.discountAmount) }}</strong></div>
        </template>
        <template v-else>
          <div><span>折扣</span><strong>{{ row.discountRate }} 折</strong></div>
          <div><span>最高抵扣金额</span><strong class="coupon-detail-accent">{{ money(row.maxDiscountAmount) }}</strong></div>
        </template>
        <div><span>使用服务</span><strong>{{ row.service }}</strong></div>
        <div><span>状态</span><StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '启用' ? 'success' : 'danger'" dot /></div>
        <div><span>有效期开始</span><strong class="mono">{{ row.validFrom }}</strong></div>
        <div><span>有效期结束</span><strong class="mono">{{ row.validTo }}</strong></div>
      </div>
    </section>

    <section class="coupon-detail-section">
      <header><strong>发放与核销</strong><small>剩余可发数量按“发放总量 − 已发放数量”计算。</small></header>
      <div class="coupon-volume-grid">
        <article><span>发放总量</span><strong>{{ number(total) }}</strong></article>
        <article><span>已发放</span><strong>{{ number(issued) }}</strong></article>
        <article><span>剩余可发</span><strong>{{ number(Math.max(0, total - issued)) }}</strong></article>
        <article><span>已核销</span><strong>{{ number(redeemed) }}</strong></article>
      </div>
    </section>

    <section v-if="issued > 0" class="coupon-detail-lock"><LockKeyhole :size="16" /><div><strong>核心规则已锁定</strong><p>该券已有发放记录，仅可修改券名与有效期结束时间；不可删除，只能禁用。</p></div></section>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button>
      <button class="btn btn--brand" type="button" @click="emit('edit')"><Pencil :size="14" />编辑优惠券</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.coupon-detail-head { display: flex; align-items: center; padding: 17px 18px; gap: 12px; border-radius: var(--radius-lg); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }
.coupon-detail-head__icon { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border: 1px solid rgba(255,255,255,.14); border-radius: 13px; background: rgba(255,255,255,.07); color: var(--brand-light); }
.coupon-detail-head > div:nth-child(2) { min-width: 0; flex: 1; }
.coupon-detail-head small { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; letter-spacing: .09em; }
.coupon-detail-head h3 { margin: 3px 0 2px; font-family: var(--font-display); font-size: 17px; }
.coupon-detail-head p { margin: 0; color: var(--ink-300); font-size: 9px; }
.coupon-detail-section { padding-top: 17px; margin-top: 17px; border-top: 1px solid var(--border); }
.coupon-detail-section > header { margin-bottom: 10px; }
.coupon-detail-section > header strong { display: block; color: var(--text-strong); font-size: 11px; }
.coupon-detail-section > header small { display: block; margin-top: 3px; color: var(--text-faint); font-size: 9px; }
.coupon-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.coupon-detail-grid > div, .coupon-volume-grid article { min-width: 0; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.coupon-detail-grid__wide { grid-column: span 2; }
.coupon-detail-grid span, .coupon-volume-grid span { display: block; color: var(--text-faint); font-size: 8px; }
.coupon-detail-grid strong, .coupon-volume-grid strong { display: block; margin-top: 5px; color: var(--text-subtle); font-size: 11px; }
.coupon-detail-grid .badge { margin-top: 6px; }
.coupon-detail-accent { color: var(--brand-dark) !important; }
.coupon-volume-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.coupon-volume-grid strong { font-family: var(--font-display); font-size: 18px; }
.coupon-volume-grid article:nth-child(3) strong { color: var(--brand-dark); }
.coupon-detail-lock { display: flex; align-items: flex-start; padding: 12px 14px; margin-top: 14px; gap: 9px; border-radius: var(--radius-md); background: #fff7ed; color: #c2410c; }
.coupon-detail-lock svg { flex: none; margin-top: 1px; }
.coupon-detail-lock strong { display: block; font-size: 10px; }
.coupon-detail-lock p { margin: 3px 0 0; font-size: 9px; }
@media (max-width: 680px) { .coupon-detail-grid, .coupon-volume-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 440px) { .coupon-detail-head { align-items: flex-start; flex-wrap: wrap; } .coupon-detail-grid, .coupon-volume-grid { grid-template-columns: 1fr; } .coupon-detail-grid__wide { grid-column: span 1; } }
</style>
