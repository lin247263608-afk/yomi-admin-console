<script setup lang="ts">
import { AlertTriangle, Download, Filter, Search, SlidersHorizontal, X } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

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
const searchTerm = ref('')
const statusFilter = ref<'全部' | '履约中' | OrderStatus>('全部')
const serviceFilter = ref<'全部' | '拼车' | '独享'>('全部')
const businessFilter = ref<'全部' | '接机' | '送机'>('全部')
const orderedFrom = ref('')
const orderedTo = ref('')
const pageSize = ref<20 | 50 | 100>(20)
const currentPage = ref(1)
const selectedOrder = ref<Order | null>(null)
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

function driverSearchText(order: Order) {
  if (!order.driverName && !order.driverVehicle) return ''
  const candidate = driverCandidates.find((driver) =>
    order.driverVehicle?.includes(driver.plate) || order.driverName?.includes(driver.name) || order.driverName?.includes(driver.englishName),
  )
  return `${order.driverName ?? ''}${order.driverVehicle ?? ''}${candidate?.phone ?? ''}${candidate?.email ?? ''}`
}

function linkedOrdersFor(order: Order) {
  const links: Array<{ kind: '来源' | '替代'; id: string }> = []
  if (order.sourceOrderId) links.push({ kind: '来源', id: order.sourceOrderId })
  if (order.replacementOrderId) links.push({ kind: '替代', id: order.replacementOrderId })
  return links
}

const filteredRows = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const relationText = `${row.sourceOrderId ?? ''}${row.replacementOrderId ?? ''}${row.cancelType ?? ''}${row.cancelReason ?? ''}${row.coupon?.code ?? ''}${row.coupon?.name ?? ''}`
    const matchesTerm = !term || `${row.id}${row.routeName}${relationText}${driverSearchText(row)}${row.passengers.map((p) => `${p.name}${p.phone}${p.email ?? ''}`).join('')}`.toLowerCase().includes(term)
    const matchesStatus = statusFilter.value === '全部'
      || (statusFilter.value === '履约中' && ['待出行', '接乘客', '送乘客'].includes(row.status))
      || row.status === statusFilter.value
    const matchesService = serviceFilter.value === '全部' || row.serviceType === serviceFilter.value
    const matchesBusiness = businessFilter.value === '全部' || row.businessType === businessFilter.value
    const orderedAt = row.createdAt ?? row.passengers[0]?.orderedAt
    const orderedDate = orderedAt ? londonDateKey(orderedAt) : ''
    const matchesFrom = !orderedFrom.value || (!!orderedDate && orderedDate >= orderedFrom.value)
    const matchesTo = !orderedTo.value || (!!orderedDate && orderedDate <= orderedTo.value)
    return matchesTerm && matchesStatus && matchesService && matchesBusiness && matchesFrom && matchesTo
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
  searchTerm.value = ''
  statusFilter.value = '全部'
  serviceFilter.value = '全部'
  businessFilter.value = '全部'
  orderedFrom.value = ''
  orderedTo.value = ''
}

function refreshOrders() {
  tick.value++
  syncExpiredOrders()
  appStore.notify('订单数据已刷新', '列表状态、派单预警与到时退款检查已更新。', 'success')
}

function openDetail(order: Order) {
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

function exportOrders() {
  const csvCell = (value: string) => `"${value.replaceAll('"', '""')}"`
  const csv = [
    ['订单号', '关联订单号', '路线', '出发时间', '业务类型', '服务类型', '订单金额', '状态', '取消类型'].map(csvCell).join(','),
    ...filteredRows.value.map((row) => [row.id, linkedOrdersFor(row).map((link) => `${link.kind} · ${link.id}`).join('；'), row.routeName, formatLondonTime(row.departureAt, true), row.businessType, row.serviceType, row.priceStatus === '未定' ? '待定' : formatCurrency(row.amountPence), row.status, row.cancelType ?? ''].map(csvCell).join(',')),
  ].join('\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'yomi-orders.csv'
  link.click()
  URL.revokeObjectURL(url)
  appStore.notify('订单列表已导出', `已导出 ${filteredRows.value.length} 条筛选结果。`, 'success')
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
        <p class="page-header__description">承载成团后与独享已支付订单，覆盖派单、履约、完成和异常干预。</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary" type="button" @click="exportOrders"><Download :size="15" />导出订单</button>
        <button class="btn btn--primary" type="button" @click="refreshOrders"><SlidersHorizontal :size="15" />刷新状态</button>
      </div>
    </header>

    <section class="order-summary-strip">
      <button type="button" :class="{ 'is-active': statusFilter === '全部' }" @click="statusFilter = '全部'"><span>全部订单</span><strong>{{ summary.total }}</strong></button>
      <button type="button" :class="{ 'is-active': statusFilter === '待派单' }" @click="statusFilter = '待派单'"><span>待派单</span><strong class="text-warning">{{ summary.dispatch }}</strong></button>
      <button type="button" :class="{ 'is-active': statusFilter === '履约中' }" @click="statusFilter = '履约中'"><span>履约中</span><strong class="text-brand">{{ summary.active }}</strong></button>
      <button type="button" :class="{ 'is-active': statusFilter === '已完成' }" @click="statusFilter = '已完成'"><span>已完成</span><strong class="text-success">{{ summary.finished }}</strong></button>
      <div class="dispatch-alert"><AlertTriangle :size="16" /><span><strong>{{ rows.filter((row) => warningLevelFor(row) === 'critical').length }}</strong> 个订单距出发不足 30 分钟</span></div>
    </section>

    <section class="filter-bar">
      <label class="filter-bar__search"><Search :size="15" /><input v-model="searchTerm" type="search" placeholder="订单/关联订单、路线、乘客/司机、手机或车牌" aria-label="搜索订单" /></label>
      <select v-model="statusFilter" class="field-control" aria-label="订单状态"><option value="全部">全部订单状态</option><option value="履约中">履约中</option><option value="待派单">待派单</option><option value="待出行">待出行</option><option value="接乘客">接乘客</option><option value="送乘客">送乘客</option><option value="已完成">已完成</option><option value="已取消">已取消</option></select>
      <select v-model="businessFilter" class="field-control" aria-label="业务类型"><option value="全部">全部业务类型</option><option value="接机">接机</option><option value="送机">送机</option></select>
      <select v-model="serviceFilter" class="field-control" aria-label="服务类型"><option value="全部">全部服务类型</option><option value="拼车">拼车</option><option value="独享">独享</option></select>
      <input v-model="orderedFrom" class="field-control date-control" type="date" aria-label="下单开始日期" title="下单开始日期" />
      <input v-model="orderedTo" class="field-control date-control" type="date" aria-label="下单结束日期" title="下单结束日期" />
      <div class="filter-bar__spacer"></div>
      <button class="btn btn--ghost" type="button" @click="resetFilters"><X :size="14" />清空筛选</button>
      <span class="filter-result"><Filter :size="13" />{{ filteredRows.length }} 条结果</span>
    </section>

    <section class="table-shell">
      <div class="table-scroll">
        <table class="data-table orders-table">
          <thead><tr><th>订单号</th><th>路线 / 类型</th><th>出发时间</th><th>乘客 / 行李</th><th>订单金额</th><th>状态</th><th>司导</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.id" :class="{ 'is-warning': warningLevelFor(row) === 'warning', 'is-critical': warningLevelFor(row) === 'critical' }">
              <td><button class="order-id mono" type="button" @click="openDetail(row)">{{ row.id }}</button><button v-for="link in linkedOrdersFor(row)" :key="`${link.kind}-${link.id}`" class="linked-order-hint" type="button" @click="openLinkedOrder(link.id)">{{ link.kind }} · {{ link.id }}</button><div v-if="row.tags.length" class="order-tags"><span v-for="tag in row.tags" :key="tag">{{ tag }}</span></div></td>
              <td><div class="table-primary">{{ row.routeName }}</div><div class="table-secondary"><span>{{ row.businessType }}</span> · <span>{{ row.serviceType }}</span></div></td>
              <td>
                <div class="table-primary">{{ formatLondonTime(row.departureAt) }}</div>
                <div v-if="row.status === '待派单'" class="dispatch-countdown" :class="`dispatch-countdown--${warningLevelFor(row)}`"><AlertTriangle v-if="warningLevelFor(row) !== 'none'" :size="11" />{{ countdownLabel(row) }}</div><div v-else class="table-secondary">英国时区</div>
              </td>
              <td>
                <div class="table-primary">{{ formatParty(row) }}</div>
                <div class="table-secondary">{{ formatLuggage(row) }}</div>
                <div class="table-secondary">{{ row.passengers.length }} 个下单组</div>
              </td>
              <td><template v-if="row.priceStatus === '未定'"><div class="order-amount order-amount--pending">待司机确认车型</div><div class="table-secondary">价格与结算金额待定</div></template><template v-else><div class="order-amount">{{ formatCurrency(row.amountPence) }}</div><div class="table-secondary">司机应得 {{ formatCurrency(row.settlementPence) }}</div></template></td>
              <td><StatusBadge :label="row.status" :tone="statusTone(row.status)" dot /><div class="price-state">价格：{{ row.priceStatus }}</div></td>
              <td><template v-if="row.driverName"><div class="table-primary">{{ row.driverName.split(' · ')[0] }}</div><div class="table-secondary">{{ row.driverVehicle?.split(' · ')[0] }}</div></template><span v-else class="unassigned">未指派</span></td>
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
            <tr v-if="!filteredRows.length"><td colspan="8"><div class="empty-state"><span class="empty-state__icon"><Search :size="20" /></span><strong>没有匹配的订单</strong><p>调整搜索关键词或筛选条件后再试。</p></div></td></tr>
          </tbody>
        </table>
      </div>
      <footer class="table-footer"><span>共 {{ filteredRows.length }} 条 · 第 {{ currentPage }} / {{ totalPages }} 页</span><div class="pagination"><select v-model="pageSize" class="pagination-size" aria-label="每页条数"><option :value="20">20 条/页</option><option :value="50">50 条/页</option><option :value="100">100 条/页</option></select><button type="button" :disabled="currentPage === 1" @click="currentPage--">‹</button><button v-for="page in totalPages" :key="page" type="button" :class="{ 'is-active': currentPage === page }" @click="currentPage = page">{{ page }}</button><button type="button" :disabled="currentPage === totalPages" @click="currentPage++">›</button></div></footer>
    </section>

    <OrderDetailDrawer v-if="selectedOrder" :order="selectedOrder" @close="selectedOrder = null" @dispatch="openDispatch" @open-linked-order="openLinkedOrder" @add-note="(content) => selectedOrder && addOrderNote(selectedOrder, content)" @adjust-status="(status, reason) => selectedOrder && adjustOrderStatus(selectedOrder, status, reason)" @cancel-order="(reason) => selectedOrder && cancelOrder(selectedOrder, reason)" @toggle-tag="(tag) => selectedOrder && toggleOrderTag(selectedOrder, tag)" />
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
.filter-result { display: inline-flex; align-items: center; color: var(--text-faint); font-family: var(--font-mono); font-size: 10px; gap: 5px; }
.date-control { min-width: 142px; }
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
}

@media (max-width: 720px) {
  .order-summary-strip { grid-template-columns: repeat(2, 1fr); }
  .dispatch-alert { grid-column: 1 / -1; }
}
</style>
