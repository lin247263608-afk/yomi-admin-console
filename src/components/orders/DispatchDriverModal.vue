<script setup lang="ts">
import { Check, CheckCircle2, Clock3, Search, ShieldAlert, Star } from '@lucide/vue'
import { computed, onUnmounted, ref } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import { driverCandidates } from '@/data/mock'
import type { DriverCandidate, Order } from '@/types'
import { formatLondonTime } from '@/utils/format'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  close: []
  assigned: [driver: DriverCandidate]
}>()

const searchTerm = ref('')
const onlineFilter = ref<'全部' | '在线' | '离线' | '行程中'>('全部')
const complianceFilter = ref<'全部' | DriverCandidate['complianceStatus']>('全部')
const selectedDriverId = ref('')
const phase = ref<'select' | 'waiting' | 'success' | 'expired'>('select')
const countdown = ref(60)
let countdownTimer: number | undefined

function validationFor(driver: DriverCandidate) {
  const reasons: string[] = []
  const passengerCount = props.order.adults + props.order.children
  if (driver.passengerCapacity < passengerCount) {
    reasons.push(`载客容量不足（${driver.passengerCapacity}/${passengerCount}，含儿童占座）`)
  }
  if (driver.largeLuggageCapacity < props.order.largeLuggage) {
    reasons.push(`大行李容量不足（${driver.largeLuggageCapacity}/${props.order.largeLuggage}）`)
  }
  if (driver.smallLuggageCapacity < props.order.smallLuggage) {
    reasons.push(`小行李容量不足（${driver.smallLuggageCapacity}/${props.order.smallLuggage}）`)
  }
  if (driver.conflictingOrderIds.includes(props.order.id)) reasons.push('与已接订单时间冲突')
  if (driver.creatorOrderIds.includes(props.order.id)) reasons.push('不可向订单创建者本人派单')
  if (driver.acceptingStatus === '冻结接单') reasons.push('司机接单权限已冻结')

  return {
    eligible: reasons.length === 0,
    reasons,
    warning: driver.complianceStatus === '非合规'
      ? '证件存在过期项，仅作运营警示；当前未冻结接单'
      : '',
  }
}

const filteredDrivers = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return driverCandidates.filter((driver) => {
    const matchesTerm = !term || `${driver.id}${driver.name}${driver.englishName}${driver.phone}${driver.email}${driver.plate}${driver.vehicle}`.toLowerCase().includes(term)
    const matchesOnline = onlineFilter.value === '全部' || driver.onlineStatus === onlineFilter.value
    const matchesCompliance = complianceFilter.value === '全部' || driver.complianceStatus === complianceFilter.value
    return matchesTerm && matchesOnline && matchesCompliance
  }).map((driver) => ({ driver, validation: validationFor(driver) }))
})

const selectedDriver = computed(() => driverCandidates.find((driver) => driver.id === selectedDriverId.value))
const selectedValidation = computed(() => selectedDriver.value ? validationFor(selectedDriver.value) : null)
const countdownText = computed(() => `${String(Math.floor(countdown.value / 60)).padStart(2, '0')}:${String(countdown.value % 60).padStart(2, '0')}`)
const modalTitle = computed(() => {
  if (phase.value === 'success') return '司机已确认接单'
  if (phase.value === 'expired') return '指派邀请已失效'
  return '调度司机'
})

function clearCountdown() {
  if (countdownTimer) window.clearInterval(countdownTimer)
  countdownTimer = undefined
}

function sendInvitation() {
  if (!selectedDriver.value || !selectedValidation.value?.eligible) return
  phase.value = 'waiting'
  countdown.value = 60
  countdownTimer = window.setInterval(() => {
    if (countdown.value <= 1) {
      countdown.value = 0
      clearCountdown()
      phase.value = 'expired'
      return
    }
    countdown.value -= 1
  }, 1000)
}

function acceptInvitation() {
  if (!selectedDriver.value || phase.value !== 'waiting') return
  clearCountdown()
  phase.value = 'success'
  emit('assigned', selectedDriver.value)
}

function expireInvitation() {
  if (phase.value !== 'waiting') return
  clearCountdown()
  countdown.value = 0
  phase.value = 'expired'
}

function retryInvitation() {
  clearCountdown()
  selectedDriverId.value = ''
  phase.value = 'select'
}

function close() {
  clearCountdown()
  emit('close')
}

onUnmounted(() => {
  clearCountdown()
})
</script>

<template>
  <ModalDialog :title="modalTitle" eyebrow="DRIVER DISPATCH" @close="close">
    <template v-if="phase === 'select'">
      <div class="dispatch-order-summary">
        <div><span>订单</span><strong class="mono">{{ order.id }}</strong></div>
        <div><span>路线</span><strong>{{ order.routeName }}</strong></div>
        <div><span>出发时间</span><strong>{{ formatLondonTime(order.departureAt) }}</strong></div>
      </div>

      <div class="dispatch-filters">
        <label class="dispatch-search"><Search :size="14" /><input v-model="searchTerm" type="search" placeholder="司机、手机号、车牌或车型" /></label>
        <select v-model="onlineFilter" class="field-control" aria-label="司机在线状态">
          <option value="全部">全部在线状态</option>
          <option value="在线">在线</option>
          <option value="行程中">行程中</option>
          <option value="离线">离线</option>
        </select>
        <select v-model="complianceFilter" class="field-control" aria-label="司机合规状态">
          <option value="全部">全部合规状态</option>
          <option value="合规">合规</option>
          <option value="非合规">非合规</option>
        </select>
      </div>

      <div class="driver-list">
        <button
          v-for="entry in filteredDrivers"
          :key="entry.driver.id"
          class="driver-option"
          :class="{ 'is-selected': selectedDriverId === entry.driver.id, 'is-disabled': !entry.validation.eligible }"
          type="button"
          :disabled="!entry.validation.eligible"
          @click="selectedDriverId = entry.driver.id"
        >
          <span class="driver-avatar">{{ entry.driver.name.slice(0, 1) }}</span>
          <span class="driver-option__body">
            <span class="driver-option__name">{{ entry.driver.name }} <small>{{ entry.driver.englishName }}</small></span>
            <span class="driver-option__meta">{{ entry.driver.id }} · {{ entry.driver.email }}</span>
            <span class="driver-option__meta">{{ entry.driver.vehicle }} · {{ entry.driver.plate }}</span>
            <span v-if="entry.validation.reasons.length" class="driver-option__reason"><ShieldAlert :size="12" />{{ entry.validation.reasons.join('；') }}</span>
            <span v-else-if="entry.validation.warning" class="driver-option__warning"><ShieldAlert :size="12" />{{ entry.validation.warning }}</span>
          </span>
          <span class="driver-option__side">
            <StatusBadge :label="entry.driver.onlineStatus" :tone="entry.driver.onlineStatus === '在线' ? 'success' : entry.driver.onlineStatus === '行程中' ? 'warning' : 'neutral'" dot />
            <StatusBadge :label="entry.driver.complianceStatus" :tone="entry.driver.complianceStatus === '合规' ? 'success' : 'danger'" />
            <span class="driver-rating"><Star :size="12" fill="currentColor" />{{ entry.driver.rating }}</span>
          </span>
          <span class="driver-option__check"><Check :size="13" /></span>
        </button>
      </div>
    </template>

    <div v-else-if="phase === 'waiting'" class="dispatch-waiting">
      <span class="dispatch-waiting__clock"><Clock3 :size="28" /></span>
      <h3>等待 {{ selectedDriver?.name }} 确认</h3>
      <p>指派通知已发送。司机需在 60 秒内确认，超时后邀请自动失效。</p>
      <strong class="dispatch-countdown">{{ countdownText }}</strong>
      <div class="dispatch-progress"><span :style="{ width: `${(countdown / 60) * 100}%` }"></span></div>
      <small class="prototype-hint">原型控制可在底部模拟“司机确认”或“60 秒超时”。</small>
    </div>

    <div v-else-if="phase === 'success'" class="dispatch-success">
      <span class="dispatch-success__icon"><CheckCircle2 :size="30" /></span>
      <h3>{{ selectedDriver?.name }} 已接受指派</h3>
      <p>车辆 {{ selectedDriver?.plate }} 已绑定，订单价格完成首次锁定，乘客将收到司机信息与尾款通知。</p>
      <div class="dispatch-success__facts">
        <div><span>订单状态</span><StatusBadge label="待出行" tone="success" /></div>
        <div><span>价格状态</span><StatusBadge :label="order.priceStatus" :tone="order.priceStatus === '封板' ? 'neutral' : 'info'" /></div>
      </div>
    </div>

    <div v-else class="dispatch-expired">
      <span class="dispatch-expired__icon"><ShieldAlert :size="30" /></span>
      <h3>60 秒内未收到司机确认</h3>
      <p>{{ selectedDriver?.name }} 的本次邀请已自动失效，订单仍留在待派单池，可重新选择其他司机。</p>
    </div>

    <template #footer>
      <template v-if="phase === 'select'">
        <button class="btn btn--secondary" type="button" @click="close">取消</button>
        <button class="btn btn--brand" type="button" :disabled="!selectedValidation?.eligible" @click="sendInvitation">发送指派通知</button>
      </template>
      <template v-else-if="phase === 'waiting'">
        <button class="btn btn--secondary" type="button" @click="expireInvitation">模拟 60 秒超时</button>
        <button class="btn btn--brand" type="button" @click="acceptInvitation">模拟司机确认</button>
      </template>
      <template v-else-if="phase === 'expired'">
        <button class="btn btn--secondary" type="button" @click="close">关闭</button>
        <button class="btn btn--primary" type="button" @click="retryInvitation">重新选择司机</button>
      </template>
      <button v-else class="btn btn--primary" type="button" @click="close">完成</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.dispatch-order-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  padding: 12px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--page);
  gap: 10px;
}
.dispatch-order-summary > div { min-width: 0; }
.dispatch-order-summary > div > span { display: block; color: var(--text-faint); font-size: 9px; }
.dispatch-order-summary > div > strong { display: block; overflow: hidden; margin-top: 3px; color: var(--text-subtle); font-size: 11px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }

.dispatch-filters {
  display: flex;
  margin-bottom: 12px;
  gap: 8px;
}

.dispatch-search {
  display: flex;
  align-items: center;
  min-width: 0;
  height: 38px;
  flex: 1;
  padding: 0 10px;
  gap: 7px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--page);
  color: var(--text-faint);
}

.dispatch-search:focus-within { border-color: var(--ink-500); box-shadow: 0 0 0 3px rgba(45, 99, 152, 0.1); }
.dispatch-search input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; color: var(--text); font-size: 11px; }

.driver-list {
  display: flex;
  max-height: 380px;
  overflow-y: auto;
  flex-direction: column;
  gap: 8px;
}

.driver-option {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  padding: 11px 12px;
  gap: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text);
  text-align: left;
  transition: border-color var(--motion-fast), background var(--motion-fast), box-shadow var(--motion-fast);
}

.driver-option:hover:not(:disabled) { border-color: var(--ink-200); background: var(--ink-50); }
.driver-option.is-selected { border-color: var(--ink-500); background: var(--ink-50); box-shadow: 0 0 0 2px rgba(45, 99, 152, 0.1); }
.driver-option.is-disabled { opacity: 0.66; }

.driver-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 50%;
  background: var(--ink-100);
  color: var(--ink-700);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
}

.driver-option__body { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 2px; }
.driver-option__name { color: var(--text-strong); font-family: var(--font-display); font-size: 11px; font-weight: 700; }
.driver-option__name small { color: var(--text-faint); font-family: var(--font-body); font-size: 9px; font-weight: 400; }
.driver-option__meta { overflow: hidden; color: var(--text-faint); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.driver-option__reason { display: flex; align-items: center; color: var(--danger); font-size: 9px; gap: 4px; }
.driver-option__warning { display: flex; align-items: center; color: var(--warning); font-size: 9px; gap: 4px; }
.driver-option__side { display: flex; align-items: flex-end; flex-direction: column; gap: 5px; }
.driver-rating { display: inline-flex; align-items: center; color: var(--gold); font-family: var(--font-mono); font-size: 9px; gap: 3px; }
.driver-option__check { position: absolute; top: -6px; right: -6px; display: none; align-items: center; justify-content: center; width: 20px; height: 20px; border: 2px solid #fff; border-radius: 50%; background: var(--ink-700); color: #fff; }
.driver-option.is-selected .driver-option__check { display: inline-flex; }

.dispatch-waiting,
.dispatch-success,
.dispatch-expired {
  display: flex;
  align-items: center;
  min-height: 300px;
  flex-direction: column;
  justify-content: center;
  padding: 24px;
  text-align: center;
}

.dispatch-waiting__clock,
.dispatch-success__icon,
.dispatch-expired__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: var(--brand-100);
  color: var(--brand-dark);
}

.dispatch-success__icon { background: var(--success-bg); color: var(--success); }
.dispatch-expired__icon { background: var(--danger-bg); color: var(--danger); }
.dispatch-waiting h3, .dispatch-success h3, .dispatch-expired h3 { margin: 0; color: var(--text-strong); font-family: var(--font-display); font-size: 17px; }
.dispatch-waiting p, .dispatch-success p, .dispatch-expired p { max-width: 390px; margin: 6px 0 0; color: var(--text-muted); font-size: 11px; }
.dispatch-countdown { margin: 24px 0 12px; color: var(--brand); font-family: var(--font-mono); font-size: 26px; }
.dispatch-progress { width: 220px; height: 5px; overflow: hidden; border-radius: var(--radius-pill); background: var(--brand-100); }
.dispatch-progress span { display: block; height: 100%; border-radius: inherit; background: var(--brand); transition: width 1s linear; }
.prototype-hint { margin-top: 12px; color: var(--text-faint); font-size: 9px; }
.dispatch-success__facts { display: flex; width: 100%; justify-content: center; padding-top: 18px; margin-top: 18px; gap: 28px; border-top: 1px solid var(--border); }
.dispatch-success__facts > div { display: flex; align-items: center; flex-direction: column; gap: 6px; }
.dispatch-success__facts span:first-child { color: var(--text-faint); font-size: 9px; }

@media (max-width: 560px) {
  .dispatch-order-summary { grid-template-columns: 1fr; }
  .dispatch-filters { flex-direction: column; }
  .driver-option__side { display: none; }
}
</style>
