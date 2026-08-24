<script setup lang="ts">
import { FileText, RefreshCw, ShieldCheck, UsersRound } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import { dashboardSnapshots, realtimeDrivers } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { DashboardPeriod } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/format'

const appStore = useAppStore()
const activePeriod = ref<DashboardPeriod>('today')
const isRefreshing = ref(false)
const periodRefreshedAt = ref(new Date())
const driversRefreshedAt = ref(new Date())
const liveDrivers = ref({
  ...realtimeDrivers,
  offline: Math.max(0, realtimeDrivers.total - realtimeDrivers.online),
})
let periodRefreshTimer: number | undefined
let driverRefreshTimer: number | undefined

const LONDON_TIME_ZONE = 'Europe/London'

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: 'today', label: '今日' },
  { value: '3d', label: '近3天' },
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: 'month', label: '本月' },
  { value: 'year', label: '今年' },
]

const snapshot = computed(() => dashboardSnapshots[activePeriod.value])
const formatLondonDateTime = (date: Date) =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: LONDON_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)

const periodRefreshText = computed(() => formatLondonDateTime(periodRefreshedAt.value))
const driversRefreshText = computed(() => formatLondonDateTime(driversRefreshedAt.value))

function refreshPeriodSnapshot() {
  periodRefreshedAt.value = new Date()
}

function refreshDriverSnapshot() {
  const total = Math.max(0, Math.trunc(liveDrivers.value.total))
  const onlineDelta = Math.random() > 0.5 ? 1 : -1
  const online = Math.min(total, Math.max(0, liveDrivers.value.online + onlineDelta))

  liveDrivers.value = {
    ...liveDrivers.value,
    total,
    online,
    offline: total - online,
  }
  driversRefreshedAt.value = new Date()
}

async function refreshDashboard() {
  if (isRefreshing.value) return
  isRefreshing.value = true
  await new Promise((resolve) => window.setTimeout(resolve, 520))
  refreshPeriodSnapshot()
  refreshDriverSnapshot()
  isRefreshing.value = false
  appStore.notify('全部数据已刷新', '周期指标更新时间与实时司机快照已同步更新。', 'success')
}

onMounted(() => {
  periodRefreshTimer = window.setInterval(refreshPeriodSnapshot, 5 * 60_000)
  driverRefreshTimer = window.setInterval(refreshDriverSnapshot, 30_000)
})

onUnmounted(() => {
  if (periodRefreshTimer) window.clearInterval(periodRefreshTimer)
  if (driverRefreshTimer) window.clearInterval(driverRefreshTimer)
})
</script>

<template>
  <div class="dashboard-page">
    <header class="page-header">
      <div>
        <div class="page-header__eyebrow">OPERATIONS / OVERVIEW</div>
        <h1>核心指标总览</h1>
      </div>
      <div class="page-header__actions">
        <div class="segment-control" aria-label="时间维度">
          <button
            v-for="option in periodOptions"
            :key="option.value"
            type="button"
            :class="{ 'is-active': activePeriod === option.value }"
            @click="activePeriod = option.value"
          >
            {{ option.label }}
          </button>
        </div>
        <button class="btn btn--primary" type="button" :disabled="isRefreshing" @click="refreshDashboard()">
          <RefreshCw :size="15" :class="{ 'is-spinning': isRefreshing }" />
          刷新全部
        </button>
      </div>
    </header>

    <section class="dashboard-hero dark-panel">
      <div class="dashboard-hero__metrics">
        <div>
          <span>全订单总量</span>
          <strong>{{ formatNumber(snapshot.totalOrders) }}</strong>
        </div>
        <div>
          <span>营收流水</span>
          <strong>{{ formatCurrency(snapshot.revenuePence) }}</strong>
        </div>
        <div>
          <span>活跃用户数</span>
          <strong>{{ formatNumber(snapshot.activeUsers) }}</strong>
        </div>
      </div>
    </section>

    <section class="dashboard-section">
      <div class="section-heading">
        <div>
          <span class="section-heading__eyebrow">APP PERFORMANCE</span>
          <h2>业务表现</h2>
        </div>
        <span class="section-heading__hint">周期：{{ periodOptions.find((item) => item.value === activePeriod)?.label }}</span>
      </div>
      <div class="metric-grid metric-grid--three">
        <article class="metric-card">
          <div class="metric-card__top"><span>支付订单量</span><span class="metric-card__icon metric-card__icon--blue"><FileText :size="16" /></span></div>
          <strong>{{ formatNumber(snapshot.paidOrders) }}</strong>
          <div class="metric-card__foot"><span>乘客下单并完成支付的订单数量</span></div>
        </article>
        <article class="metric-card">
          <div class="metric-card__top"><span>拼团成功率</span><span class="metric-card__icon metric-card__icon--brand"><UsersRound :size="16" /></span></div>
          <strong>{{ snapshot.carpoolSuccessRate }}<small>%</small></strong>
          <div class="metric-card__progress"><span :style="{ width: `${snapshot.carpoolSuccessRate}%` }"></span></div>
          <div class="metric-card__foot"><span>分母含独享支付订单</span></div>
        </article>
        <article class="metric-card">
          <div class="metric-card__top"><span>司机完单率</span><span class="metric-card__icon metric-card__icon--green"><ShieldCheck :size="16" /></span></div>
          <strong>{{ snapshot.driverCompletionRate }}<small>%</small></strong>
          <div class="metric-card__progress metric-card__progress--green"><span :style="{ width: `${snapshot.driverCompletionRate}%` }"></span></div>
          <div class="metric-card__foot"><span>分母仅含指派订单</span></div>
        </article>
      </div>
    </section>

    <section class="dashboard-section">
      <div class="section-heading">
        <div>
          <span class="section-heading__eyebrow">LIVE SNAPSHOT</span>
          <h2>在线司机数大盘</h2>
        </div>
        <div class="live-refresh"><span class="live-refresh__dot"></span>每 30 秒自动刷新 · {{ driversRefreshText }}（Europe/London）</div>
      </div>
      <div class="realtime-grid">
        <article class="realtime-card realtime-card--total">
          <span>平台司机总数量</span>
          <strong>{{ formatNumber(liveDrivers.total) }}</strong>
          <small>认证状态 = 已认证</small>
        </article>
        <article class="realtime-card">
          <span class="realtime-card__label"><i class="state-dot state-dot--green"></i>在线司机数</span>
          <strong>{{ formatNumber(liveDrivers.online) }}</strong>
          <small>心跳正常</small>
        </article>
        <article class="realtime-card">
          <span class="realtime-card__label"><i class="state-dot state-dot--gray"></i>离线司机数</span>
          <strong>{{ formatNumber(liveDrivers.offline) }}</strong>
          <small>30 分钟内无心跳</small>
        </article>
      </div>
    </section>

  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.dashboard-hero {
  padding: 24px 30px;
  margin-bottom: 34px;
  color: #fff;
}

.section-heading__eyebrow {
  color: var(--ink-400);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
}

.dashboard-hero__metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.dashboard-hero__metrics div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dashboard-hero__metrics span {
  color: var(--ink-300);
  font-size: 11px;
}

.dashboard-hero__metrics strong {
  color: #fff;
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 800;
  line-height: 1.1;
}

.dashboard-section {
  margin-bottom: 34px;
}

.section-heading,
.panel-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 14px;
}

.section-heading h2,
.panel-heading h2 {
  margin: 4px 0 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.2;
}

.section-heading__hint,
.live-refresh {
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 10px;
}

.metric-grid {
  display: grid;
  gap: 14px;
}

.metric-grid--three {
  grid-template-columns: repeat(3, 1fr);
}

.metric-card {
  padding: 18px 18px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--motion-normal), box-shadow var(--motion-normal), transform var(--motion-normal);
}

.metric-card:hover {
  border-color: var(--ink-200);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.metric-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-muted);
  font-size: 12px;
}

.metric-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-md);
}

.metric-card__icon--blue {
  background: var(--ink-50);
  color: var(--ink-600);
}

.metric-card__icon--brand {
  background: var(--brand-100);
  color: var(--brand-dark);
}

.metric-card__icon--green {
  background: var(--success-bg);
  color: var(--success);
}

.metric-card > strong {
  display: block;
  margin: 18px 0 12px;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.metric-card > strong small {
  margin-left: 2px;
  font-size: 16px;
}

.metric-card__foot {
  display: flex;
  align-items: center;
  min-height: 17px;
  color: var(--success);
  font-size: 10px;
  gap: 4px;
}

.metric-card__progress {
  height: 5px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--brand-100);
}

.metric-card__progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--brand);
}

.metric-card__progress--green {
  background: var(--success-bg);
}

.metric-card__progress--green span {
  background: var(--success);
}

.metric-card__progress + .metric-card__foot {
  margin-top: 8px;
  color: var(--text-faint);
}

.live-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
}

.live-refresh__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.12);
}

.realtime-grid {
  display: grid;
  grid-template-columns: 1.25fr repeat(2, 1fr);
  gap: 12px;
}

.realtime-card {
  min-height: 118px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.realtime-card--total {
  border-color: var(--ink-700);
  background: var(--ink-700);
  color: #fff;
}

.realtime-card > span {
  display: block;
  color: var(--text-muted);
  font-size: 11px;
}

.realtime-card--total > span {
  color: var(--ink-300);
}

.realtime-card strong {
  display: block;
  margin: 12px 0 4px;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 27px;
  font-weight: 800;
  line-height: 1;
}

.realtime-card--total strong {
  color: #fff;
}

.realtime-card small {
  color: var(--text-faint);
  font-size: 10px;
}

.realtime-card--total small {
  color: var(--ink-300);
}

.realtime-card__label {
  display: flex !important;
  align-items: center;
  gap: 7px;
}

.state-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.state-dot--green {
  background: var(--success);
}

.state-dot--gray {
  background: var(--text-faint);
}

.is-spinning {
  animation: spin 800ms linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1040px) {
  .realtime-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .realtime-card--total {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .dashboard-hero {
    padding: 22px 20px 20px;
    border-radius: var(--radius-xl);
  }

  .dashboard-hero__metrics {
    grid-template-columns: 1fr;
  }

  .metric-grid--three,
  .realtime-grid {
    grid-template-columns: 1fr;
  }

  .realtime-card--total {
    grid-column: auto;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
