<script setup lang="ts">
import { Pencil } from '@lucide/vue'
import { computed, ref } from 'vue'

import ContentLanguageTabs, { type ContentLanguage } from '@/components/forms/ContentLanguageTabs.vue'
import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'
import type { BadgeTone } from '@/types'

const props = defineProps<{
  row: ModuleRow
  fences: ModuleRow[]
  vehicles: ModuleRow[]
}>()

const emit = defineEmits<{
  close: []
  edit: []
}>()

type PricingItem = { vehicleId?: string; baseFare?: string | number; extraSeat?: string | number }
type SpecialPeriod = { start?: string; end?: string; rate?: string | number }

const vehiclePricing = computed(() => Array.isArray(props.row.vehiclePricing)
  ? props.row.vehiclePricing as PricingItem[]
  : [])
const specialPeriods = computed(() => Array.isArray(props.row.specialPeriods)
  ? props.row.specialPeriods as SpecialPeriod[]
  : [])
const contentLanguage = ref<ContentLanguage>('zh')
const localizedName = computed(() => contentLanguage.value === 'en'
  ? String(props.row.nameEn ?? '待配置 English 路线名称')
  : String(props.row.name ?? '—'))

function fenceLabel(id: unknown) {
  const fence = props.fences.find((item) => item.id === id)
  return fence ? `${String(fence.name)} · ${fence.id} · ${String(fence.type)}` : String(id ?? '—')
}

function vehicleLabel(id: unknown) {
  const vehicle = props.vehicles.find((item) => item.id === id)
  return vehicle ? String(vehicle.name ?? vehicle.id) : String(id ?? '—')
}

function money(value: unknown) {
  const amount = Number(value)
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
    : '—'
}

function displayDate(value: unknown) {
  const text = String(value ?? '')
  return text ? text.replace('T', ' ') : '—'
}

function statusTone(value: unknown): BadgeTone {
  const label = String(value ?? '')
  if (/禁用|非热门/.test(label)) return label === '非热门' ? 'neutral' : 'danger'
  if (/启用/.test(label)) return 'success'
  if (/热门/.test(label)) return 'warning'
  return 'info'
}
</script>

<template>
  <ModalDialog :title="`路线详情 · ${row.id}`" eyebrow="ROUTE PRICING" size="wide" @close="emit('close')">
    <section class="route-detail-summary">
      <div>
        <small>ROUTE OVERVIEW</small>
        <h3>{{ localizedName }}</h3>
        <p>{{ row.id }} · {{ row.fences }}</p>
      </div>
      <div class="route-detail-summary__badges">
        <StatusBadge :label="String(row.business ?? '—')" tone="info" dot />
        <StatusBadge :label="String(row.popular ?? '—')" :tone="statusTone(row.popular)" dot />
        <StatusBadge :label="String(row.status ?? '—')" :tone="statusTone(row.status)" dot />
      </div>
    </section>

    <ContentLanguageTabs v-model="contentLanguage" compact />

    <section class="route-detail-section">
      <header>
        <div><strong>基础信息与定价</strong><small>与新增、编辑路线的字段顺序保持一致。</small></div>
      </header>
      <div class="route-detail-grid">
        <div class="route-detail-field route-detail-field--wide"><span>{{ contentLanguage === 'zh' ? '路线名称（中文）' : 'Route name (English)' }}</span><strong>{{ localizedName }}</strong></div>
        <div><span>业务</span><strong>{{ row.business }}</strong></div>
        <div><span>路线ID</span><strong class="mono">{{ row.id }}</strong></div>
        <div class="route-detail-field route-detail-field--wide"><span>起点围栏</span><strong>{{ fenceLabel(row.startFenceId) }}</strong></div>
        <div class="route-detail-field route-detail-field--wide"><span>终点围栏</span><strong>{{ fenceLabel(row.endFenceId) }}</strong></div>
        <div><span>距离</span><strong>{{ row.distance ?? '—' }}</strong></div>
        <div><span>预计时长</span><strong>{{ row.duration ?? '—' }}</strong></div>
        <div><span>常规抽佣</span><strong>{{ row.commissionRate ?? '—' }}</strong></div>
        <div><span>路线定金单价</span><strong>{{ money(row.deposit) }} / 人</strong></div>
      </div>
    </section>

    <section class="route-detail-section">
      <header>
        <div><strong>车型定价</strong><small>展示该路线按服务车型配置的基础单价与加座价。</small></div>
        <span>{{ vehiclePricing.length }} 项</span>
      </header>
      <div v-if="vehiclePricing.length" class="route-price-list">
        <article v-for="item in vehiclePricing" :key="String(item.vehicleId)">
          <div><small>VEHICLE TYPE</small><strong>{{ vehicleLabel(item.vehicleId) }}</strong><span class="mono">{{ item.vehicleId }}</span></div>
          <dl><div><dt>车型单价</dt><dd>{{ money(item.baseFare) }}</dd></div><div><dt>加座价</dt><dd>{{ money(item.extraSeat) }} / 座</dd></div></dl>
        </article>
      </div>
      <p v-else class="route-detail-empty">当前路线未配置车型定价。</p>
    </section>

    <section class="route-detail-section">
      <header>
        <div><strong>特殊时段抽佣</strong><small>按订单出发时间命中，时间按 Europe/London 解释。</small></div>
        <span>{{ specialPeriods.length }} 条</span>
      </header>
      <div v-if="specialPeriods.length" class="route-period-list">
        <article v-for="(period, index) in specialPeriods" :key="`${period.start}-${index}`">
          <span>{{ index + 1 }}</span>
          <div><small>开始时间</small><strong>{{ displayDate(period.start) }}</strong></div>
          <i></i>
          <div><small>结束时间</small><strong>{{ displayDate(period.end) }}</strong></div>
          <div class="route-period-list__rate"><small>抽佣比例</small><strong>{{ period.rate }}%</strong></div>
        </article>
      </div>
      <p v-else class="route-detail-empty">未配置特殊时段，订单使用路线常规抽佣。</p>
    </section>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button>
      <button class="btn btn--brand" type="button" :disabled="row.status === '启用'" :title="row.status === '启用' ? '请先在列表中禁用路线后再编辑' : '编辑路线'" @click="emit('edit')"><Pencil :size="14" />编辑路线</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.route-detail-summary { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; gap: 18px; border: 1px solid rgba(255,255,255,.08); border-radius: var(--radius-lg); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }
.route-detail-summary small { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; letter-spacing: .09em; }
.route-detail-summary h3 { margin: 4px 0 2px; font-family: var(--font-display); font-size: 17px; }
.route-detail-summary p { margin: 0; color: var(--ink-300); font-family: var(--font-mono); font-size: 9px; }
.route-detail-summary__badges { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 7px; }
.route-detail-section { padding-top: 17px; margin-top: 17px; border-top: 1px solid var(--border); }
.route-detail-section > header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; gap: 10px; }
.route-detail-section > header strong { display: block; color: var(--text-strong); font-size: 11px; }
.route-detail-section > header small { display: block; margin-top: 3px; color: var(--text-faint); font-size: 9px; }
.route-detail-section > header > span { padding: 4px 8px; border-radius: var(--radius-pill); background: var(--ink-50); color: var(--ink-600); font-family: var(--font-mono); font-size: 8px; font-weight: 700; }
.route-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.route-detail-grid > div { min-width: 0; padding: 11px 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.route-detail-field--wide { grid-column: span 2; }
.route-detail-grid span, .route-price-list small, .route-period-list small { display: block; color: var(--text-faint); font-size: 8px; }
.route-detail-grid strong { display: block; overflow-wrap: anywhere; margin-top: 4px; color: var(--text-subtle); font-size: 10px; }
.route-price-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.route-price-list article { display: flex; align-items: center; justify-content: space-between; padding: 13px; gap: 16px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.route-price-list article > div > strong { display: block; margin: 3px 0 1px; color: var(--text-strong); font-size: 11px; }
.route-price-list article > div > span { color: var(--text-faint); font-size: 8px; }
.route-price-list dl { display: flex; margin: 0; gap: 18px; }
.route-price-list dl > div { min-width: 88px; }
.route-price-list dt { color: var(--text-faint); font-size: 8px; }
.route-price-list dd { margin: 3px 0 0; color: var(--brand-dark); font-family: var(--font-mono); font-size: 10px; font-weight: 800; }
.route-period-list { display: grid; gap: 8px; }
.route-period-list article { display: grid; grid-template-columns: 24px minmax(150px, 1fr) 36px minmax(150px, 1fr) 100px; align-items: center; padding: 11px 12px; gap: 10px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.route-period-list article > span { display: inline-flex; width: 22px; height: 22px; align-items: center; justify-content: center; border-radius: 50%; background: var(--ink-700); color: #fff; font-family: var(--font-mono); font-size: 8px; }
.route-period-list article > i { height: 1px; background: var(--border); }
.route-period-list strong { display: block; margin-top: 3px; color: var(--text-subtle); font-size: 9px; }
.route-period-list__rate { text-align: right; }
.route-period-list__rate strong { color: var(--brand-dark); font-family: var(--font-mono); font-size: 11px; }
.route-detail-empty { padding: 14px; margin: 0; border: 1px dashed var(--border); border-radius: var(--radius-lg); background: var(--page); color: var(--text-faint); font-size: 9px; text-align: center; }
@media (max-width: 820px) { .route-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .route-price-list { grid-template-columns: 1fr; } .route-period-list article { grid-template-columns: 24px 1fr; } .route-period-list article > i { display: none; } .route-period-list__rate { text-align: left; } }
@media (max-width: 560px) { .route-detail-summary { align-items: flex-start; flex-direction: column; } .route-detail-summary__badges { justify-content: flex-start; } .route-detail-grid { grid-template-columns: 1fr; } .route-detail-field--wide { grid-column: span 1; } .route-price-list article { align-items: flex-start; flex-direction: column; } }
</style>
