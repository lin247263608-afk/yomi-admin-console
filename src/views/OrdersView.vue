<script setup lang="ts">
import { AlertTriangle, Filter, MessageSquareText, RefreshCw, Search, X } from '@lucide/vue'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import DispatchDriverModal from '@/components/orders/DispatchDriverModal.vue'
import OrderDetailDrawer from '@/components/orders/OrderDetailDrawer.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import { driverCandidates, orders as mockOrders } from '@/data/mock'
import { lockOrderPrice } from '@/data/pricing'
import { useAppStore } from '@/stores/app'
import type { DriverCandidate, Order, OrderStatus, WarningLevel } from '@/types'
import { formatCurrency, formatLuggage, formatLondonTime, formatParty, timeUntil } from '@/utils/format'

const appStore = useAppStore()
// Mock 数组在当前 SPA 会话中充当原型业务仓，截团生成与派单结果可跨路由保留。
const rows = ref<Order[]>(mockOrders)

type OrderSearchFields = {
  orderId: string
  routeName: string
  passengerName: string
  passengerPhone: string
  driverName: string
  driverPhone: string
  plate: string
  status: '全部' | '履约中' | OrderStatus
  serviceType: '全部' | '拼车' | '独享'
  businessType: '全部' | '接机' | '送机'
  orderedFrom: string
  orderedTo: string
}

function createEmptyOrderSearch(): OrderSearchFields {
  return {
    orderId: '', routeName: '', passengerName: '', passengerPhone: '',
    driverName: '', driverPhone: '', plate: '', status: '全部',
    serviceType: '全部', businessType: '全部', orderedFrom: '', orderedTo: '',
  }
}

const searchDraft = reactive<OrderSearchFields>(createEmptyOrderSearch())
const searchApplied = reactive<OrderSearchFields>(createEmptyOrderSearch())
const pageSize = ref<20 | 50 | 100>(20)
const currentPage = ref(1)
const selectedOrder = ref<Order | null>(null)
const detailInitialTab = ref<'overview' | 'messages'>('overview')
const dispatchOrder = ref<Order | null>(null)
const commissionTarget = ref<Order | null>(null)
const commissionRateDraft = ref<string | number>('')
const commissionReasonDraft = ref('')
const tick = ref(0)
let countdownTimer: number | undefined

const commissionRateValue = computed(() => {
  const draft = String(commissionRateDraft.value).trim()
  if (!draft) return null
  const value = Number(draft)
  return Number.isFinite(value) && value >= 0 && value <= 100 ? value : null
})

const canSubmitCommissionAdjustment = computed(() =>
  commissionRateValue.value !== null && !!commissionReasonDraft.value.trim(),
)

function londonDateKey(iso: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso))
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

function driverForOrder(order: Order) {
  if (!order.driverName && !order.driverVehicle) return undefined
  return driverCandidates.find((driver) =>
    order.driverVehicle?.includes(driver.plate) || order.driverName?.includes(driver.name) || order.driverName?.includes(driver.englishName),
  )
}

function linkedOrdersFor(order: Order) {
  const links: Array<{ kind: '来源' | '替代'; id: string }> = []
  if (order.sourceOrderId) links.push({ kind: '来源', id: order.sourceOrderId })
  if (order.replacementOrderId) links.push({ kind: '替代', id: order.replacementOrderId })
  return links
}

const filteredRows = computed(() => {
  const textMatches = (value: unknown, query: string) => !query.trim()
    || String(value ?? '').toLowerCase().includes(query.trim().toLowerCase())

  return rows.value.filter((row) => {
    const driver = driverForOrder(row)
    const matchesStatus = searchApplied.status === '全部'
      || (searchApplied.status === '履约中' && ['待出行', '接乘客', '送乘客'].includes(row.status))
      || row.status === searchApplied.status
    const matchesService = searchApplied.serviceType === '全部' || row.serviceType === searchApplied.serviceType
    const matchesBusiness = searchApplied.businessType === '全部' || row.businessType === searchApplied.businessType
    const orderedAt = row.createdAt ?? row.passengers[0]?.orderedAt
    const orderedDate = orderedAt ? londonDateKey(orderedAt) : ''
    const matchesFrom = !searchApplied.orderedFrom || (!!orderedDate && orderedDate >= searchApplied.orderedFrom)
    const matchesTo = !searchApplied.orderedTo || (!!orderedDate && orderedDate <= searchApplied.orderedTo)
    return textMatches(row.id, searchApplied.orderId)
      && textMatches(row.routeName, searchApplied.routeName)
      && (!searchApplied.passengerName.trim() || row.passengers.some((passenger) => textMatches(passenger.name, searchApplied.passengerName)))
      && (!searchApplied.passengerPhone.trim() || row.passengers.some((passenger) => textMatches(passenger.phone, searchApplied.passengerPhone)))
      && textMatches(row.driverName, searchApplied.driverName)
      && textMatches(driver?.phone, searchApplied.driverPhone)
      && textMatches(driver?.plate ?? row.driverVehicle, searchApplied.plate)
      && matchesStatus && matchesService && matchesBusiness && matchesFrom && matchesTo
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

watch([filteredRows, pageSize], () => {
  currentPage.value = 1
})

const summary = computed(() => {
  tick.value
  return {
    total: rows.value.length,
    dispatch: rows.value.filter((row) => row.status === '待派单').length,
    active: rows.value.filter((row) => ['待出行', '接乘客', '送乘客'].includes(row.status)).length,
    finished: rows.value.filter((row) => row.status === '已完成').length,
  }
})

function warningLevelFor(order: Order): WarningLevel {
  tick.value
  if (order.status !== '待派单') return 'none'
  const minutes = (new Date(order.departureAt).getTime() - Date.now()) / 60_000
  if (minutes <= 30) return 'critical'
  if (minutes <= 120) return 'warning'
  if (minutes < 24 * 60) return 'notice'
  return 'none'
}

function syncExpiredOrders() {
  const now = Date.now()
  rows.value.forEach((order) => {
    if (order.status !== '待派单' || new Date(order.departureAt).getTime() > now) return
    order.status = '已取消'
    order.refundStatus = '退款处理中'
    order.cancelType = '平台自动取消'
    order.cancelReason = '出发时间到达时仍未派单'
    order.refundRecord = {
      amountPence: refundableAmountPence(order),
      status: '退款处理中',
      createdAt: new Date().toISOString(),
      fullRefund: true,
      includesValueAddedServices: order.fees.addOnPence > 0,
    }
    clearCancelledSettlement(order)
    order.warningLevel = 'none'
    if (!order.tags.includes('退款')) order.tags.push('退款')
    order.notes.unshift({
      id: `N-AUTO-${Date.now()}-${order.id}`,
      author: '系统',
      content: '出发时间到达时仍未派单，订单已自动取消并创建全额退款任务。',
      createdAt: new Date().toISOString(),
    })
    appStore.notify('订单已自动取消', `${order.id} 到时仍未派单，已发起全额退款。`, 'warning')
  })
}

function statusTone(status: OrderStatus) {
  if (['已完成', '待出行'].includes(status)) return 'success' as const
  if (['接乘客', '送乘客'].includes(status)) return 'coral' as const
  if (status === '待派单') return 'warning' as const
  return 'neutral' as const
}

function countdownLabel(order: Order) {
  tick.value
  return timeUntil(order.departureAt)
}

function resetFilters() {
  Object.assign(searchDraft, createEmptyOrderSearch())
  Object.assign(searchApplied, createEmptyOrderSearch())
  currentPage.value = 1
}

function applySearch() {
  if (searchDraft.orderedFrom && searchDraft.orderedTo && searchDraft.orderedFrom > searchDraft.orderedTo) {
    appStore.notify('下单日期范围有误', '开始日期不能晚于结束日期，请重新选择。', 'warning')
    return
  }
  Object.assign(searchApplied, searchDraft)
  currentPage.value = 1
}

function applyStatusFilter(status: OrderSearchFields['status']) {
  searchDraft.status = status
  searchApplied.status = status
  currentPage.value = 1
}

function refreshOrders() {
  tick.value++
  syncExpiredOrders()
  appStore.notify('订单数据已刷新', '列表状态、派单预警与到时退款检查已更新。', 'success')
}

function openDetail(order: Order) {
  detailInitialTab.value = 'overview'
  selectedOrder.value = order
}

function groupMessageCount(order: Order) {
  return order.groupMessages?.length ?? 0
}

function unreadGroupMessageCount(order: Order) {
  return order.groupMessages?.filter((message) => !message.readAt).length ?? 0
}

function openOrderMessages(order: Order) {
  detailInitialTab.value = 'messages'
  const readAt = new Date().toISOString()
  order.groupMessages?.forEach((message) => {
    if (!message.readAt) message.readAt = readAt
  })
  selectedOrder.value = order
}

function openLinkedOrder(orderId: string) {
  const linkedOrder = rows.value.find((order) => order.id === orderId)
  if (!linkedOrder) {
    appStore.notify('关联订单暂不可用', `当前演示数据中未找到 ${orderId}。`, 'warning')
    return
  }
  selectedOrder.value = linkedOrder
}

function openDispatch(order: Order) {
  selectedOrder.value = null
  dispatchOrder.value = order
}

function openCommissionAdjustment(order: Order) {
  if (order.status !== '待派单') return
  commissionTarget.value = order
  commissionRateDraft.value = ''
  commissionReasonDraft.value = ''
}

function closeCommissionAdjustment() {
  commissionTarget.value = null
  commissionRateDraft.value = ''
  commissionReasonDraft.value = ''
}

function submitCommissionAdjustment() {
  const order = commissionTarget.value
  const newRate = commissionRateValue.value
  const reason = commissionReasonDraft.value.trim()
  if (!order || newRate === null || !reason) return

  // 原型内的订单对象是共享业务状态；提交时重读状态，模拟后端并发校验。
  if (order.status !== '待派单') {
    appStore.notify('订单状态已变更，调整未生效', `${order.id} 当前状态为「${order.status}」，请刷新后重试。`, 'warning')
    closeCommissionAdjustment()
    tick.value++
    return
  }

  const previousRate = order.commissionRate
  const previousSource = order.commissionSource ?? '待锁定'
  const previousLabel = previousRate === undefined ? '未锁定' : `${previousRate}%（${previousSource}）`

  order.commissionRate = newRate
  order.commissionSource = '手动调整'
  order.commissionAdjustmentReason = reason
  order.notes.unshift({
    id: `N-COMMISSION-${Date.now()}-${order.id}`,
    author: '运营 · Ava',
    content: `手动调整抽佣：${previousLabel} → ${newRate}%（手动调整）。调整原因：${reason}`,
    createdAt: new Date().toISOString(),
  })
  appStore.notify('抽佣调整已生效', `${order.id} 已更新为 ${newRate}%，后续锁价与结算将使用手动调整比例。`, 'success')
  closeCommissionAdjustment()
}

function assignDriver(driver: DriverCandidate) {
  if (!dispatchOrder.value) return
  dispatchOrder.value.driverName = `${driver.name} · ${driver.englishName}`
  dispatchOrder.value.driverVehicle = `${driver.vehicle} · ${driver.plate}`
  dispatchOrder.value.status = '待出行'
  const priceResult = lockOrderPrice(dispatchOrder.value, driver)
  dispatchOrder.value.warningLevel = 'none'
  appStore.notify(
    '司机已接受指派',
    priceResult.recalculated
      ? `${driver.name} 已绑定订单，并按路线与车型完成价格锁定（${priceResult.priceStatus}）。`
      : `${driver.name} 已绑定订单；距出发不足 48 小时，改派维持原价。`,
    'success',
  )
}

function addOrderNote(order: Order, content: string) {
  order.notes.unshift({
    id: `N-${Date.now()}`,
    author: '运营 · Ava',
    content,
    createdAt: new Date().toISOString(),
  })
  appStore.notify('备注已添加', '操作人与时间已记录。', 'success')
}

function adjustOrderStatus(order: Order, status: OrderStatus, reason: string) {
  if (status === '已取消') {
    appStore.notify('请使用取消订单流程', '取消必须同时记录取消类型、原因与退款留痕。', 'warning')
    return
  }
  const previousStatus = order.status
  order.status = status
  if (status === '接乘客' && !order.routeTelemetry?.trackingStartedAt) {
    const [start = '路线起点', end = '路线终点'] = order.routeName.split(' → ')
    order.routeTelemetry = {
      startGeofence: `${start}起点围栏`,
      endGeofence: `${end}终点围栏`,
      trackingStartedAt: new Date().toISOString(),
      driverPoints: [{ x: 19, y: 28, recordedAt: new Date().toISOString() }],
    }
  }
  if (status === '已完成' && order.routeTelemetry?.trackingStartedAt && !order.routeTelemetry.trackingEndedAt) {
    order.routeTelemetry.trackingEndedAt = new Date().toISOString()
  }
  order.warningLevel = status === '待派单' ? warningLevelFor(order) : 'none'
  order.notes.unshift({
    id: `N-STATUS-${Date.now()}`,
    author: '运营 · Ava',
    content: `强制调整状态：${previousStatus} → ${status}。原因：${reason}`,
    createdAt: new Date().toISOString(),
  })
  appStore.notify('订单状态已调整', `${order.id} 已由「${previousStatus}」调整为「${status}」。`, 'success')
}

function refundableAmountPence(order: Order) {
  if (order.priceStatus === '未定') {
    return Math.max(0, order.fees.depositPence + order.fees.addOnPence)
  }
  return Math.max(0, order.amountPence)
}

function clearCancelledSettlement(order: Order) {
  order.fees.commissionPence = 0
  order.fees.driverPence = 0
  order.settlementPence = 0
}

function cancelOrder(order: Order, reason: string) {
  order.status = '已取消'
  order.refundStatus = '退款处理中'
  order.cancelType = '后台取消'
  order.cancelReason = reason
  order.refundRecord = {
    amountPence: refundableAmountPence(order),
    status: '退款处理中',
    createdAt: new Date().toISOString(),
    fullRefund: true,
    includesValueAddedServices: order.fees.addOnPence > 0,
  }
  clearCancelledSettlement(order)
  order.warningLevel = 'none'
  if (!order.tags.includes('退款')) order.tags.push('退款')
  order.notes.unshift({
    id: `N-CANCEL-${Date.now()}`,
    author: '运营 · Ava',
    content: `后台取消订单并进入退款处理。原因：${reason}`,
    createdAt: new Date().toISOString(),
  })
  appStore.notify('订单已取消', `${order.id} 已记录原因并创建退款处理任务。`, 'success')
}

function toggleOrderTag(order: Order, tag: string) {
  order.tags = order.tags.includes(tag)
    ? order.tags.filter((item) => item !== tag)
    : [...order.tags, tag]
  appStore.notify('订单标记已更新', `${order.id} 的运营标记已保存。`, 'success')
}

onMounted(() => {
  syncExpiredOrders()
  countdownTimer = window.setInterval(() => {
    tick.value++
    syncExpiredOrders()
  }, 1000)
})

onUnmounted(() => {
  if (countdownTimer) window.clearInterval(countdownTimer)
})
</script>

<template>
  <div class="orders-page">
    <header class="page-header">
      <div>
        <div class="page-header__eyebrow">ORDERS / FULFILMENT</div>
        <h1>订单管理</h1>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--refresh" type="button" @click="refreshOrders"><RefreshCw :size="15" />刷新状态</button>
      </div>
    </header>

    <section class="order-summary-strip stats-banner stats-banner--light">
      <button type="button" :class="{ 'is-active': searchApplied.status === '全部' }" @click="applyStatusFilter('全部')"><span>全部订单</span><strong>{{ summary.total }}</strong></button>
      <button type="button" :class="{ 'is-active': searchApplied.status === '待派单' }" @click="applyStatusFilter('待派单')"><span>待派单</span><strong class="text-warning">{{ summary.dispatch }}</strong></button>
      <button type="button" :class="{ 'is-active': searchApplied.status === '履约中' }" @click="applyStatusFilter('履约中')"><span>履约中</span><strong class="text-brand">{{ summary.active }}</strong></button>
      <button type="button" :class="{ 'is-active': searchApplied.status === '已完成' }" @click="applyStatusFilter('已完成')"><span>已完成</span><strong class="text-success">{{ summary.finished }}</strong></button>
      <div class="dispatch-alert"><AlertTriangle :size="16" /><span><strong>{{ rows.filter((row) => warningLevelFor(row) === 'critical').length }}</strong> 个订单距出发不足 30 分钟</span></div>
    </section>

    <section class="filter-bar order-filter-bar">
      <div class="advanced-filter-grid">
        <label class="filter-field"><span>订单号</span><input v-model="searchDraft.orderId" class="field-control" type="search" placeholder="请输入订单号" /></label>
        <label class="filter-field"><span>路线名称</span><input v-model="searchDraft.routeName" class="field-control" type="search" placeholder="请输入路线名称" /></label>
        <label class="filter-field"><span>乘客姓名</span><input v-model="searchDraft.passengerName" class="field-control" type="search" placeholder="请输入乘客姓名" /></label>
        <label class="filter-field"><span>乘客手机号</span><input v-model="searchDraft.passengerPhone" class="field-control" type="search" placeholder="请输入乘客手机号" /></label>
        <label class="filter-field"><span>司机姓名</span><input v-model="searchDraft.driverName" class="field-control" type="search" placeholder="请输入司机姓名" /></label>
        <label class="filter-field"><span>司机手机号</span><input v-model="searchDraft.driverPhone" class="field-control" type="search" placeholder="请输入司机手机号" /></label>
        <label class="filter-field"><span>车牌号</span><input v-model="searchDraft.plate" class="field-control" type="search" placeholder="请输入车牌号" /></label>
        <label class="filter-field"><span>订单状态</span><select v-model="searchDraft.status" class="field-control"><option value="全部">订单状态：全部</option><option value="履约中">履约中</option><option value="待派单">待派单</option><option value="待出行">待出行</option><option value="接乘客">接乘客</option><option value="送乘客">送乘客</option><option value="已完成">已完成</option><option value="已取消">已取消</option></select></label>
        <label class="filter-field"><span>业务类型</span><select v-model="searchDraft.businessType" class="field-control"><option value="全部">业务类型：全部</option><option value="接机">接机</option><option value="送机">送机</option></select></label>
        <label class="filter-field"><span>服务类型</span><select v-model="searchDraft.serviceType" class="field-control"><option value="全部">服务类型：全部</option><option value="拼车">拼车</option><option value="独享">独享</option></select></label>
        <label class="filter-field"><span>下单开始日期</span><input v-model="searchDraft.orderedFrom" class="field-control" type="date" aria-label="下单开始日期" /></label>
        <label class="filter-field"><span>下单结束日期</span><input v-model="searchDraft.orderedTo" class="field-control" type="date" aria-label="下单结束日期" /></label>
      </div>
      <div class="advanced-filter-actions">
        <button class="btn btn--brand" type="button" @click="applySearch"><Search :size="14" />搜索</button>
        <button class="btn btn--ghost" type="button" @click="resetFilters"><X :size="14" />重置</button>
        <div class="filter-bar__spacer"></div>
        <span class="filter-result"><Filter :size="13" />找到 {{ filteredRows.length }} 条记录</span>
      </div>
    </section>

    <section class="table-shell">
      <div class="table-scroll">
        <table class="data-table structured-data-table orders-table">
          <thead><tr><th>订单号</th><th>路线名称</th><th>业务类型</th><th>服务类型</th><th>出发时间</th><th>乘客人数</th><th>行李数</th><th>订单金额</th><th>状态</th><th>司导</th><th>拼车团消息</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.id" :class="{ 'is-warning': warningLevelFor(row) === 'warning', 'is-critical': warningLevelFor(row) === 'critical' }">
              <td><button class="order-id mono" type="button" @click="openDetail(row)">{{ row.id }}</button><button v-for="link in linkedOrdersFor(row)" :key="`${link.kind}-${link.id}`" class="linked-order-hint" type="button" @click="openLinkedOrder(link.id)">{{ link.kind }} · {{ link.id }}</button><div v-if="row.tags.includes('修改重下')" class="order-tags"><span>修改重下</span></div></td>
              <td><div class="table-primary route-name-cell" :title="row.routeName">{{ row.routeName }}</div></td>
              <td><span class="field-value">{{ row.businessType }}</span></td>
              <td><span class="field-value">{{ row.serviceType }}</span></td>
              <td>
                <div class="table-primary">{{ formatLondonTime(row.departureAt) }}</div>
                <div v-if="row.status === '待派单'" class="dispatch-countdown" :class="`dispatch-countdown--${warningLevelFor(row)}`"><AlertTriangle v-if="warningLevelFor(row) !== 'none'" :size="11" />{{ countdownLabel(row) }}</div><div v-else class="table-secondary">英国时区</div>
              </td>
              <td><span class="quantity-cell">{{ formatParty(row) }}</span><div class="table-secondary">{{ row.passengers.length }} 个下单组</div></td>
              <td><span class="quantity-cell">{{ formatLuggage(row) }}</span></td>
              <td><template v-if="row.priceStatus === '未定'"><div class="order-amount order-amount--pending">待司机确认车型</div><div class="table-secondary">价格与结算金额待定</div></template><template v-else><div class="order-amount">{{ formatCurrency(row.amountPence) }}</div><div class="table-secondary">司机应得 {{ formatCurrency(row.settlementPence) }}</div></template></td>
              <td><StatusBadge :label="row.status" :tone="statusTone(row.status)" dot /><div class="price-state">价格：{{ row.priceStatus }}</div></td>
              <td><template v-if="row.driverName"><div class="table-primary">{{ row.driverName.split(' · ')[0] }}</div><div class="table-secondary">{{ row.driverVehicle?.split(' · ')[0] }}</div></template><span v-else class="unassigned">未指派</span></td>
              <td>
                <button v-if="row.serviceType === '拼车'" class="group-message-entry" type="button" @click="openOrderMessages(row)">
                  <MessageSquareText :size="14" /><span>{{ groupMessageCount(row) }} 条</span><b v-if="unreadGroupMessageCount(row)">新消息 {{ unreadGroupMessageCount(row) }}</b>
                </button>
                <span v-else class="table-secondary">—</span>
              </td>
              <td>
                <div class="table-actions">
                  <button class="table-action" type="button" @click="openDetail(row)">详情</button>
                  <button
                    class="table-action"
                    type="button"
                    :disabled="row.status !== '待派单'"
                    :title="row.status === '待派单' ? '调整该订单的结算抽佣' : '仅待派单订单可调整抽佣'"
                    @click="openCommissionAdjustment(row)"
                  >调整抽佣</button>
                  <button v-if="!['已完成', '已取消'].includes(row.status)" class="table-action" type="button" @click="openDispatch(row)">{{ row.driverName ? '改派' : '调度' }}</button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredRows.length"><td colspan="12"><div class="empty-state"><span class="empty-state__icon"><Search :size="20" /></span><strong>没有匹配的订单</strong><p>调整搜索关键词或筛选条件后再试。</p></div></td></tr>
          </tbody>
        </table>
      </div>
      <footer class="table-footer"><span>共 {{ filteredRows.length }} 条 · 第 {{ currentPage }} / {{ totalPages }} 页</span><div class="pagination"><select v-model="pageSize" class="pagination-size" aria-label="每页条数"><option :value="20">20 条/页</option><option :value="50">50 条/页</option><option :value="100">100 条/页</option></select><button type="button" :disabled="currentPage === 1" @click="currentPage--">‹</button><button v-for="page in totalPages" :key="page" type="button" :class="{ 'is-active': currentPage === page }" @click="currentPage = page">{{ page }}</button><button type="button" :disabled="currentPage === totalPages" @click="currentPage++">›</button></div></footer>
    </section>

    <OrderDetailDrawer v-if="selectedOrder" :order="selectedOrder" :initial-tab="detailInitialTab" @close="selectedOrder = null" @dispatch="openDispatch" @open-linked-order="openLinkedOrder" @add-note="(content) => selectedOrder && addOrderNote(selectedOrder, content)" @adjust-status="(status, reason) => selectedOrder && adjustOrderStatus(selectedOrder, status, reason)" @cancel-order="(reason) => selectedOrder && cancelOrder(selectedOrder, reason)" @toggle-tag="(tag) => selectedOrder && toggleOrderTag(selectedOrder, tag)" />
    <DispatchDriverModal v-if="dispatchOrder" :order="dispatchOrder" @close="dispatchOrder = null" @assigned="assignDriver" />
    <ModalDialog v-if="commissionTarget" :title="`调整抽佣 · ${commissionTarget.id}`" eyebrow="COMMISSION OVERRIDE" @close="closeCommissionAdjustment">
      <p class="commission-dialog__copy">仅待派单订单可调整。提交后手动比例将覆盖路线常规或特殊时段抽佣，并写入操作记录。</p>
      <div class="commission-current">
        <div>
          <span>当前抽佣比例</span>
          <strong>{{ commissionTarget.commissionRate ?? '—' }}{{ commissionTarget.commissionRate === undefined ? '' : '%' }}</strong>
        </div>
        <small>生效来源：{{ commissionTarget.commissionSource ?? '待锁定' }}</small>
      </div>
      <label class="form-label" for="commission-rate">新抽佣比例（%）</label>
      <input id="commission-rate" v-model="commissionRateDraft" class="field-control commission-rate-input" type="number" min="0" max="100" step="0.01" inputmode="decimal" placeholder="请输入 0–100" autofocus />
      <p class="commission-field-hint" :class="{ 'is-error': commissionRateDraft && commissionRateValue === null }">
        {{ commissionRateDraft && commissionRateValue === null ? '抽佣比例必须在 0–100 之间。' : '可输入 0–100 之间的数字。' }}
      </p>
      <label class="form-label commission-reason-label" for="commission-reason">调整原因（必填）</label>
      <textarea id="commission-reason" v-model="commissionReasonDraft" class="form-textarea" maxlength="300" placeholder="例如：长途空驶补偿、协商单等"></textarea>
      <template #footer>
        <button class="btn btn--secondary" type="button" @click="closeCommissionAdjustment">取消</button>
        <button class="btn btn--primary" type="button" :disabled="!canSubmitCommissionAdjustment" @click="submitCommissionAdjustment">确认调整</button>
      </template>
    </ModalDialog>
  </div>
</template>

<style scoped>
.order-summary-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(100px, 1fr)) minmax(230px, 1.25fr);
  overflow: hidden;
  margin-bottom: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.order-summary-strip > button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 14px;
  border-right: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  text-align: left;
}

.order-summary-strip > button:hover, .order-summary-strip > button.is-active { background: var(--ink-50); }
.order-summary-strip button span { font-size: 10px; }
.order-summary-strip button strong { color: var(--text-strong); font-family: var(--font-display); font-size: 19px; font-weight: 800; }
.text-warning { color: var(--warning) !important; }
.text-brand { color: var(--brand) !important; }
.text-success { color: var(--success) !important; }

.dispatch-alert {
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 8px;
  background: var(--danger-bg);
  color: var(--danger);
  font-size: 10px;
}

.dispatch-alert strong { font-family: var(--font-display); font-size: 15px; }
.order-filter-bar { display: block; padding: 16px; }
.advanced-filter-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
.filter-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.filter-field > span { color: var(--text-subtle); font-size: 9px; font-weight: 700; }
.filter-field .field-control { width: 100%; min-width: 0; }
.advanced-filter-actions { display: flex; align-items: center; min-height: 38px; margin-top: 14px; gap: 8px; }
.filter-result { display: inline-flex; align-items: center; color: var(--text-faint); font-family: var(--font-mono); font-size: 10px; gap: 5px; }
.orders-table { min-width: 1640px; }
.orders-table th:nth-child(1) { min-width: 170px; }
.orders-table th:nth-child(2) { min-width: 190px; }
.orders-table th:nth-child(5) { min-width: 150px; }
.orders-table th:nth-child(10) { min-width: 130px; }
.orders-table th:nth-last-child(2),
.orders-table td:nth-last-child(2) { position: sticky; z-index: 2; right: 120px; min-width: 118px; background: var(--surface); box-shadow: -8px 0 12px -12px rgba(15, 30, 53, 0.24); }
.orders-table th:nth-last-child(2) { z-index: 3; background: var(--page-2); }
.orders-table tbody tr:hover td:nth-last-child(2) { background: var(--ink-50); }
.orders-table tbody tr.is-warning td:nth-last-child(2) { background: rgba(255, 247, 237, 0.66); }
.orders-table tbody tr.is-critical td:nth-last-child(2) { background: rgba(254, 242, 242, 0.76); }
.route-name-cell { max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pagination-size { height: 28px; padding: 0 7px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--text-muted); font-size: 9px; }
.order-id { padding: 0; background: transparent; color: var(--ink-600); font-weight: 600; }
.order-id:hover { color: var(--ink-800); text-decoration: underline; text-underline-offset: 3px; }
.linked-order-hint { display: block; max-width: 150px; overflow: hidden; padding: 0; margin-top: 4px; background: transparent; color: var(--text-faint); font-family: var(--font-mono); font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.linked-order-hint:hover { color: var(--ink-600); text-decoration: underline; text-underline-offset: 2px; }
.order-tags { display: flex; margin-top: 4px; gap: 3px; }
.order-tags span { padding: 1px 5px; border-radius: var(--radius-sm); background: var(--danger-bg); color: var(--danger); font-size: 8px; font-weight: 700; }
.dispatch-countdown { display: flex; align-items: center; margin-top: 3px; color: var(--text-faint); font-family: var(--font-mono); font-size: 9px; gap: 4px; }
.dispatch-countdown--warning { color: var(--warning); }
.dispatch-countdown--critical { color: var(--danger); font-weight: 700; }
.order-amount { color: var(--brand); font-family: var(--font-display); font-size: 13px; font-weight: 800; }
.order-amount--pending { color: var(--text-faint); font-family: var(--font-body); font-size: 10px; font-weight: 700; }
.price-state { margin-top: 4px; color: var(--text-faint); font-size: 9px; }
.unassigned { color: var(--warning); font-size: 10px; font-weight: 700; }
.group-message-entry { display: inline-flex; align-items: center; flex-wrap: wrap; padding: 0; gap: 4px; background: transparent; color: var(--ink-600); font-size: 9px; font-weight: 700; }
.group-message-entry:hover { color: var(--ink-800); }
.group-message-entry b { padding: 2px 5px; border-radius: var(--radius-pill); background: var(--brand); color: #fff; font-size: 7px; }
.table-action:disabled { opacity: 0.38; background: transparent; color: var(--text-faint); }
.table-action:disabled:hover { background: transparent; }
.commission-dialog__copy { margin: 0 0 14px; color: var(--text-muted); font-size: 11px; line-height: 1.65; }
.commission-current { display: flex; align-items: center; justify-content: space-between; padding: 13px 14px; margin-bottom: 16px; gap: 14px; border: 1px solid var(--ink-200); border-radius: var(--radius-lg); background: var(--ink-50); }
.commission-current > div { display: flex; align-items: baseline; gap: 9px; }
.commission-current span { color: var(--text-muted); font-size: 10px; }
.commission-current strong { color: var(--ink-700); font-family: var(--font-display); font-size: 18px; font-weight: 800; }
.commission-current small { color: var(--ink-600); font-size: 10px; font-weight: 700; }
.commission-rate-input { width: 100%; }
.commission-field-hint { margin: 5px 0 0; color: var(--text-faint); font-size: 9px; }
.commission-field-hint.is-error { color: var(--danger); }
.commission-reason-label { margin-top: 16px; }

@media (max-width: 1160px) {
  .order-summary-strip { grid-template-columns: repeat(4, 1fr); }
  .dispatch-alert { grid-column: 1 / -1; min-height: 42px; }
  .advanced-filter-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 720px) {
  .order-summary-strip { grid-template-columns: repeat(2, 1fr); }
  .dispatch-alert { grid-column: 1 / -1; }
  .advanced-filter-grid { grid-template-columns: 1fr; }
  .advanced-filter-actions { align-items: stretch; flex-direction: column; }
  .advanced-filter-actions .btn { width: 100%; }
  .advanced-filter-actions .filter-bar__spacer { display: none; }
}
</style>
