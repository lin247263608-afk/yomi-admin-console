<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import { computed, reactive, ref } from 'vue'

import ModalDialog from '@/components/overlay/ModalDialog.vue'
import { businessConfig } from '@/data/businessConfig'
import type { ModuleRow } from '@/data/moduleCatalog.types'

interface SpecialPeriod {
  start: string
  end: string
  rate: string
}

interface VehiclePriceDraft {
  vehicleId: string
  baseFare: string
  extraSeat: string
}

const props = defineProps<{
  row: ModuleRow | null
  rows: ModuleRow[]
  fences: ModuleRow[]
  vehicles: ModuleRow[]
}>()

const emit = defineEmits<{
  close: []
  save: [row: ModuleRow, warnings: string[]]
}>()

const activeFences = computed(() => props.fences.filter((item) => item.status === '启用'))
const activeVehicles = computed(() => props.vehicles.filter((item) => item.status === '启用'))
const source: ModuleRow = props.row ? { ...props.row } : { id: '' }
const draft = reactive({
  id: String(source.id ?? ''),
  name: String(source.name ?? ''),
  business: String(source.business ?? '接机'),
  startFenceId: String(source.startFenceId ?? activeFences.value[0]?.id ?? ''),
  endFenceId: String(source.endFenceId ?? activeFences.value.find((item) => item.id !== activeFences.value[0]?.id)?.id ?? ''),
  distance: String(source.distance ?? '').replace(/[^\d.]/g, ''),
  duration: String(source.duration ?? '').replace(/[^\d.]/g, ''),
  commissionRate: String(source.commissionRate ?? '18').replace('%', ''),
  deposit: String(source.deposit ?? '0'),
})

const vehiclePricing = reactive<VehiclePriceDraft[]>(readVehiclePricing(source))
const specialPeriods = reactive<SpecialPeriod[]>(readSpecialPeriods(source))
const errorMessage = ref('')
const lowestFullGroupSeatPrice = computed(() => {
  const prices = vehiclePricing
    .map((item) => Number(item.baseFare))
    .filter((price) => Number.isFinite(price) && price > 0)
  if (!prices.length || businessConfig.autoGroupPassengers <= 0) return null
  return Math.min(...prices) / businessConfig.autoGroupPassengers
})
const depositWarning = computed(() => {
  const deposit = Number(draft.deposit)
  const lowestSeat = lowestFullGroupSeatPrice.value
  if (!Number.isFinite(deposit) || lowestSeat === null || deposit <= lowestSeat) return ''
  return `路线定金 £${deposit.toFixed(2)} 高于满团时最低单座价 £${lowestSeat.toFixed(2)}，可能频繁触发尾款退差额。此项仅警示，不阻止保存。`
})

function readVehiclePricing(row: ModuleRow): VehiclePriceDraft[] {
  if (Array.isArray(row.vehiclePricing)) {
    return row.vehiclePricing.map((item) => ({
      vehicleId: String(item.vehicleId ?? ''),
      baseFare: String(item.baseFare ?? ''),
      extraSeat: String(item.extraSeat ?? ''),
    }))
  }
  return [{ vehicleId: String(props.vehicles.find((item) => item.status === '启用')?.id ?? ''), baseFare: '78', extraSeat: '8' }]
}

function readSpecialPeriods(row: ModuleRow): SpecialPeriod[] {
  if (Array.isArray(row.specialPeriods)) {
    return row.specialPeriods.map((item) => ({
      start: String(item.start ?? ''),
      end: String(item.end ?? ''),
      rate: String(item.rate ?? ''),
    }))
  }
  if (String(row.specialCommission ?? '') === '1 条') {
    return [{ start: '2026-08-24T00:00', end: '2026-08-31T23:59', rate: '25' }]
  }
  return []
}

function addVehiclePricing() {
  const available = activeVehicles.value.find((item) => !vehiclePricing.some((entry) => entry.vehicleId === item.id))
  vehiclePricing.push({ vehicleId: String(available?.id ?? ''), baseFare: '', extraSeat: '' })
}

function addSpecialPeriod() {
  specialPeriods.push({ start: '', end: '', rate: '' })
}

function removeVehiclePricing(index: number) {
  if (vehiclePricing.length > 1) vehiclePricing.splice(index, 1)
}

function removeSpecialPeriod(index: number) {
  specialPeriods.splice(index, 1)
}

function overlaps(a: SpecialPeriod, b: SpecialPeriod) {
  const aStart = new Date(a.start).getTime()
  const aEnd = new Date(a.end).getTime()
  const bStart = new Date(b.start).getTime()
  const bEnd = new Date(b.end).getTime()
  return aStart < bEnd && bStart < aEnd
}

function save() {
  errorMessage.value = ''
  if (!draft.name.trim()) return void (errorMessage.value = '请填写路线名称。')
  if (!draft.startFenceId || !draft.endFenceId) return void (errorMessage.value = '起点和终点围栏均需选择。')
  if (draft.startFenceId === draft.endFenceId) return void (errorMessage.value = '起点围栏与终点围栏不可选择同一个围栏。')
  if (!activeFences.value.some((item) => item.id === draft.startFenceId) || !activeFences.value.some((item) => item.id === draft.endFenceId)) {
    return void (errorMessage.value = '路线围栏下拉仅允许选择启用状态的围栏，请先启用后再配置。')
  }
  if (props.row?.status === '启用') return void (errorMessage.value = '启用中的路线不可直接修改，请先禁用路线。')
  const duplicate = props.rows.find((item) => item.id !== draft.id && item.business === draft.business && item.startFenceId === draft.startFenceId && item.endFenceId === draft.endFenceId)
  if (duplicate) return void (errorMessage.value = '该路线组合已存在。')

  const commission = Number(draft.commissionRate)
  if (!Number.isFinite(commission) || commission < 0 || commission > 100) return void (errorMessage.value = '常规抽佣比例必须在 0–100% 之间。')
  const distance = Number(draft.distance)
  if (!Number.isFinite(distance) || distance <= 0) return void (errorMessage.value = '路线距离必须是大于 0 的数值。')
  const duration = Number(draft.duration)
  if (!Number.isFinite(duration) || duration <= 0) return void (errorMessage.value = '预计时长必须是大于 0 的分钟数。')
  const deposit = Number(draft.deposit)
  if (!Number.isFinite(deposit) || deposit < 0) return void (errorMessage.value = '路线定金必须是大于或等于 0 的金额。')
  if (!vehiclePricing.length || vehiclePricing.some((item) => !item.vehicleId || !activeVehicles.value.some((vehicle) => vehicle.id === item.vehicleId))) {
    return void (errorMessage.value = '至少配置一条启用车型定价。')
  }
  if (new Set(vehiclePricing.map((item) => item.vehicleId)).size !== vehiclePricing.length) {
    return void (errorMessage.value = '同一车型不可重复配置价格。')
  }
  if (vehiclePricing.some((item) => !Number.isFinite(Number(item.baseFare)) || Number(item.baseFare) <= 0 || !Number.isFinite(Number(item.extraSeat)) || Number(item.extraSeat) < 0 || Number(item.extraSeat) >= Number(item.baseFare))) {
    return void (errorMessage.value = '车型单价必须大于 0，且加座价必须小于车型单价。')
  }

  for (const period of specialPeriods) {
    const start = new Date(period.start).getTime()
    const end = new Date(period.end).getTime()
    const rate = Number(period.rate)
    if (!period.start || !period.end || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return void (errorMessage.value = '特殊时段结束时间必须晚于开始时间。')
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return void (errorMessage.value = '特殊时段抽佣比例必须在 0–100% 之间。')
  }
  for (let index = 0; index < specialPeriods.length; index += 1) {
    for (let other = index + 1; other < specialPeriods.length; other += 1) {
      if (overlaps(specialPeriods[index]!, specialPeriods[other]!)) return void (errorMessage.value = `特殊时段存在重叠：第 ${index + 1} 行与第 ${other + 1} 行。请调整时间范围后再保存。`)
    }
  }

  const startFence = activeFences.value.find((item) => item.id === draft.startFenceId)
  const endFence = activeFences.value.find((item) => item.id === draft.endFenceId)
  const nextRow: ModuleRow = {
    ...source,
    id: draft.id || `RT-${Date.now().toString().slice(-6)}`,
    name: draft.name.trim(),
    business: draft.business,
    startFenceId: draft.startFenceId,
    endFenceId: draft.endFenceId,
    fences: `${draft.startFenceId} → ${draft.endFenceId}`,
    distance: `${distance} km`,
    duration: `约 ${duration} 分钟`,
    commissionRate: `${commission}%`,
    deposit,
    vehiclePricing: vehiclePricing.map((item) => ({ vehicleId: item.vehicleId, baseFare: Number(item.baseFare), extraSeat: Number(item.extraSeat) })),
    vehiclePricingLabel: vehiclePricing.map((item) => {
      const vehicleName = activeVehicles.value.find((vehicle) => vehicle.id === item.vehicleId)?.name ?? item.vehicleId
      return `${vehicleName} £${item.baseFare} + £${item.extraSeat}/座`
    }).join('；'),
    specialPeriods: specialPeriods.map((item) => ({ start: item.start, end: item.end, rate: Number(item.rate) })),
    specialCommission: `${specialPeriods.length} 条`,
    specialCommissionNote: specialPeriods.length ? specialPeriods.map((item) => `${item.start.replace('T', ' ')}—${item.end.replace('T', ' ')} · ${item.rate}%`).join('；') : '未配置特殊时段，使用路线常规抽佣',
    popular: String(source.popular ?? '非热门'),
    status: String(source.status ?? '启用'),
  }
  // 这些字段仅用于提示，不替代后端的坐标/面积算法。
  if (startFence && endFence) nextRow.routeHint = `${startFence.name} → ${endFence.name}`
  emit('save', nextRow, depositWarning.value ? [depositWarning.value] : [])
}
</script>

<template>
  <ModalDialog :title="row ? `编辑接送机路线 · ${row.id}` : '新增接送机路线'" eyebrow="ROUTE PRICING" size="wide" @close="emit('close')">
    <div v-if="errorMessage" class="route-editor-message route-editor-message--error">{{ errorMessage }}</div>
    <div v-if="depositWarning" class="route-editor-message route-editor-message--warning">{{ depositWarning }}</div>
    <div class="route-editor-grid">
      <label class="route-editor-field--wide"><span>路线名称</span><input v-model="draft.name" class="field-control" type="text" placeholder="请输入对外展示的路线名称" /></label>
      <label class="route-editor-field--wide"><span>业务</span><select v-model="draft.business" class="field-control"><option>接机</option><option>送机</option></select></label>
      <label class="route-editor-field--wide"><span>起点围栏（仅启用）</span><select v-model="draft.startFenceId" class="field-control"><option v-for="item in activeFences" :key="item.id" :value="item.id">{{ item.name }} · {{ item.id }} · {{ item.type }}</option></select></label>
      <label class="route-editor-field--wide"><span>终点围栏（仅启用）</span><select v-model="draft.endFenceId" class="field-control"><option v-for="item in activeFences" :key="item.id" :value="item.id">{{ item.name }} · {{ item.id }} · {{ item.type }}</option></select></label>
      <label><span>距离（km）</span><input v-model="draft.distance" class="field-control" type="number" min="0.1" step="0.1" placeholder="如 29" /></label>
      <label><span>预计时长（分钟）</span><input v-model="draft.duration" class="field-control" type="number" min="1" step="1" placeholder="如 55" /></label>
      <label><span>常规抽佣（0–100%）</span><input v-model="draft.commissionRate" class="field-control" type="number" min="0" max="100" /></label>
      <label><span>路线定金（£）</span><input v-model="draft.deposit" class="field-control" type="number" min="0" step="0.01" /></label>
    </div>
    <p class="route-editor-hint">新增路线默认启用且不标记为热门；请在列表操作栏中调整启停与热门状态。
    </p>

    <section class="route-editor-section">
      <header><div><strong>车型定价</strong><small>仅可选择启用车型；加座价必须小于车型单价。</small></div><button class="btn btn--ghost" type="button" @click="addVehiclePricing"><Plus :size="13" />添加车型</button></header>
      <div v-for="(item, index) in vehiclePricing" :key="index" class="route-pricing-row">
        <select v-model="item.vehicleId" class="field-control"><option value="">选择车型</option><option v-for="vehicle in activeVehicles" :key="vehicle.id" :value="vehicle.id">{{ vehicle.name }}</option></select>
        <input v-model="item.baseFare" class="field-control" type="number" min="0" step="0.01" placeholder="单价 £" />
        <input v-model="item.extraSeat" class="field-control" type="number" min="0" step="0.01" placeholder="加座价 £" />
        <button class="icon-button" type="button" aria-label="删除车型定价" :disabled="vehiclePricing.length === 1" @click="removeVehiclePricing(index)"><Trash2 :size="14" /></button>
      </div>
      <p v-if="!activeVehicles.length" class="route-editor-empty">请先在车型管理中创建并启用车型。</p>
    </section>

    <section class="route-editor-section">
      <header><div><strong>特殊时段抽佣</strong><small>按订单出发时间命中；时间按 Europe/London 解释，同一路线时段不可重叠。</small></div><button class="btn btn--ghost" type="button" @click="addSpecialPeriod"><Plus :size="13" />添加特殊时段</button></header>
      <div v-for="(item, index) in specialPeriods" :key="index" class="route-pricing-row route-period-row">
        <input v-model="item.start" class="field-control" type="datetime-local" aria-label="开始日期时间" />
        <input v-model="item.end" class="field-control" type="datetime-local" aria-label="结束日期时间" />
        <input v-model="item.rate" class="field-control" type="number" min="0" max="100" placeholder="抽佣 %" />
        <button class="icon-button" type="button" aria-label="删除特殊时段" @click="removeSpecialPeriod(index)"><Trash2 :size="14" /></button>
      </div>
      <p v-if="!specialPeriods.length" class="route-editor-empty">未配置特殊时段，订单使用路线常规抽佣。</p>
    </section>

    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">取消</button><button class="btn btn--brand" type="button" @click="save">保存路线配置</button></template>
  </ModalDialog>
</template>

<style scoped>
.route-editor-message { padding: 10px 12px; margin-bottom: 12px; border-radius: var(--radius-md); font-size: 10px; line-height: 1.5; }
.route-editor-message--error { border: 1px solid var(--danger-border); background: var(--danger-bg); color: var(--danger); }
.route-editor-message--warning { border: 1px solid var(--warning-border); background: var(--warning-bg); color: var(--warning); }
.route-editor-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.route-editor-field--wide { grid-column: span 2; }
.route-editor-grid label, .route-pricing-row { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.route-editor-grid label > span, .route-editor-section header strong { color: var(--text-subtle); font-size: 10px; font-weight: 700; }
.route-editor-section { padding-top: 17px; margin-top: 17px; border-top: 1px solid var(--border); }
.route-editor-section header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; gap: 8px; }
.route-editor-section header small { display: block; margin-top: 3px; color: var(--text-faint); font-size: 9px; }
.route-editor-section header .btn { min-height: 28px; padding: 0 8px; font-size: 9px; }
.route-pricing-row { display: grid; grid-template-columns: minmax(130px, 1fr) minmax(90px, .65fr) minmax(90px, .65fr) 30px; align-items: center; margin-bottom: 8px; gap: 7px; }
.route-period-row { grid-template-columns: 1fr 1fr .55fr 30px; }
.route-pricing-row .icon-button { width: 28px; height: 28px; color: var(--text-faint); }
.route-pricing-row .icon-button:disabled { cursor: not-allowed; opacity: .4; }
.route-editor-empty { margin: 5px 0 0; color: var(--text-faint); font-size: 9px; }
.route-editor-hint { padding: 9px 11px; margin: 12px 0 0; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--info-bg); color: var(--text-muted); font-size: 9px; line-height: 1.55; }
@media (max-width: 900px) { .route-editor-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .route-editor-field--wide { grid-column: span 1; } }
@media (max-width: 620px) { .route-editor-grid { grid-template-columns: 1fr; } .route-pricing-row, .route-period-row { grid-template-columns: 1fr 1fr 1fr 30px; } }
</style>
