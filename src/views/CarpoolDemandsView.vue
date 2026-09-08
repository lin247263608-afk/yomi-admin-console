<script setup lang="ts">
import { Filter, Search, SlidersHorizontal, Users, X } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ContentLanguageTabs, { type ContentLanguage } from '@/components/forms/ContentLanguageTabs.vue'
import PassengerAddOnSummary from '@/components/orders/PassengerAddOnSummary.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import DrawerShell from '@/components/overlay/DrawerShell.vue'
import { carpoolDemands, orders } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { CarpoolDemand, CarpoolStatus, Order } from '@/types'
import { formatCurrency, formatLuggage, formatLondonTime, formatParty, timeUntil } from '@/utils/format'

const appStore = useAppStore()
// Mock 数组在当前 SPA 会话中充当原型业务仓，保证跨路由操作结果可继续观察。
const rows = ref<CarpoolDemand[]>(carpoolDemands)

type CarpoolSearchFields = {
  routeId: string
  routeName: string
  passengerName: string
  phone: string
  email: string
  status: '全部' | CarpoolStatus
  paymentStatus: '全部' | '已付定金' | '已付尾款'
  orderedFrom: string
  orderedTo: string
}

function createEmptySearch(): CarpoolSearchFields {
  return {
    routeId: '',
    routeName: '',
    passengerName: '',
    phone: '',
    email: '',
    status: '全部',
    paymentStatus: '全部',
    orderedFrom: '',
    orderedTo: '',
  }
}

const searchDraft = reactive<CarpoolSearchFields>(createEmptySearch())
const searchApplied = reactive<CarpoolSearchFields>(createEmptySearch())
const pageSize = ref<20 | 50 | 100>(20)
const currentPage = ref(1)
const selectedDemand = ref<CarpoolDemand | null>(null)
const cutoffTarget = ref<CarpoolDemand | null>(null)
const cancelTarget = ref<CarpoolDemand | null>(null)
const cancelReason = ref('')
const shareConfigOpen = ref(false)
const sharePrefixDraft = ref(appStore.shareLinkPrefix)
const sharePrefixDraftEn = ref(appStore.shareLinkPrefixEn)
const shareLanguage = ref<ContentLanguage>('zh')

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

const filteredRows = computed(() => {
  const textMatches = (value: unknown, query: string) => !query.trim()
    || String(value ?? '').toLowerCase().includes(query.trim().toLowerCase())

  return rows.value.filter((row) => {
    const matchesStatus = searchApplied.status === '全部' || row.status === searchApplied.status
    const matchesPayment = searchApplied.paymentStatus === '全部' || row.paymentStatus === searchApplied.paymentStatus
    const orderedDate = londonDateKey(row.orderedAt)
    const matchesFrom = !searchApplied.orderedFrom || orderedDate >= searchApplied.orderedFrom
    const matchesTo = !searchApplied.orderedTo || orderedDate <= searchApplied.orderedTo
    return textMatches(row.routeId, searchApplied.routeId)
      && textMatches(row.routeName, searchApplied.routeName)
      && textMatches(row.passengerName, searchApplied.passengerName)
      && textMatches(row.phone, searchApplied.phone)
      && textMatches(row.email, searchApplied.email)
      && matchesStatus
      && matchesPayment
      && matchesFrom
      && matchesTo
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

const statusCounts = computed(() => ({
  all: rows.value.length,
  pending: rows.value.filter((row) => row.status === '拼团中').length,
  formed: rows.value.filter((row) => row.status === '已成团').length,
  cancelled: rows.value.filter((row) => row.status === '已取消').length,
}))

function statusTone(status: CarpoolStatus) {
  if (status === '拼团中') return 'coral' as const
  if (status === '已成团') return 'success' as const
  return 'neutral' as const
}

function demandDepositTotalPence(demand: CarpoolDemand) {
  return demand.depositUnitPence * demand.groupCount
}

function openDetail(row: CarpoolDemand) {
  selectedDemand.value = row
}

function requestCutoff(row: CarpoolDemand) {
  if (row.status !== '拼团中') return
  if (row.groupCount < 2) {
    appStore.notify('暂不可截团', '当前拼团人数不足 2 人，请引导转独享或取消拼团。', 'warning')
    return
  }
  cutoffTarget.value = row
}

function createOrderFromDemand(demand: CarpoolDemand): Order {
  const orderId = `YO-${demand.id.replace(/^CP-/, '')}`
  const largeLuggage = demand.members.reduce((sum, member) => sum + member.largeLuggage, 0)
  const smallLuggage = demand.members.reduce((sum, member) => sum + member.smallLuggage, 0)
  const adults = demand.members.reduce((sum, member) => sum + member.adults, 0)
  const children = demand.members.reduce((sum, member) => sum + member.children, 0)
  const addOnPence = demand.members.reduce(
    (orderSum, member) => orderSum + member.valueAddedServices.reduce(
      (passengerSum, service) => passengerSum + service.pricePence,
      0,
    ),
    0,
  )
  const originLooksLikeAirport = /airport|heathrow|gatwick|luton|terminal|\bt\d\b/i.test(demand.origin)
  const minutesUntilDeparture = (new Date(demand.departureAt).getTime() - Date.now()) / 60_000

  return {
    id: orderId,
    routeId: demand.routeId,
    createdAt: new Date().toISOString(),
    sourceDemandId: demand.id,
    routeName: demand.routeName,
    departureAt: demand.departureAt,
    adults,
    children,
    largeLuggage,
    smallLuggage,
    businessType: originLooksLikeAirport ? '接机' : '送机',
    serviceType: '拼车',
    amountPence: 0,
    settlementPence: 0,
    status: '待派单',
    priceStatus: '未定',
    warningLevel: minutesUntilDeparture <= 30 ? 'critical' : minutesUntilDeparture <= 120 ? 'warning' : 'none',
    passengers: demand.members.map((member) => ({
      id: member.id,
      orderPassengerId: member.orderPassengerId,
      name: member.name,
      phone: member.phone,
      email: member.email,
      origin: member.origin,
      destination: member.destination,
      adults: member.adults,
      children: member.children,
      largeLuggage: member.largeLuggage,
      smallLuggage: member.smallLuggage,
      departureAt: member.departureAt,
      orderedAt: member.orderedAt,
      paymentStatus: member.paymentStatus,
      // 保存下单时的乘客级服务名称与单价快照，后续配置改价不回写历史订单。
      valueAddedServices: member.valueAddedServices.map((service) => ({ ...service })),
    })),
    fees: {
      tripPence: 0,
      // v1.2：定金按实际乘车人数收取，不再按路线或下单组固定收取。
      depositUnitPence: demand.depositUnitPence,
      depositPassengerCount: adults + children,
      depositPence: demand.depositUnitPence * (adults + children),
      addOnPence,
      couponPence: 0,
      commissionPence: 0,
      driverPence: 0,
    },
    notes: [{
      id: `N-${Date.now()}`,
      author: '运营 · Ava',
      content: `由拼车需求 ${demand.id} 人工截团生成，价格待司机确认车型后锁定。`,
      createdAt: new Date().toISOString(),
    }],
    tags: ['人工截团'],
  }
}

function confirmCutoff() {
  if (!cutoffTarget.value) return
  const demand = cutoffTarget.value
  const existingOrder = orders.find((order) => order.sourceDemandId === demand.id)
  const generatedOrder = existingOrder ?? createOrderFromDemand(demand)
  if (!existingOrder) orders.unshift(generatedOrder)
  demand.status = '已成团'
  demand.generatedOrderId = generatedOrder.id
  appStore.notify('已完成截团并生成订单', `${generatedOrder.id} 已进入订单派单池，价格保持未定。`, 'success')
  cutoffTarget.value = null
}

function requestCancel(row: CarpoolDemand) {
  cancelTarget.value = row
  cancelReason.value = ''
}

function confirmCancel() {
  if (!cancelTarget.value || !cancelReason.value.trim()) return
  cancelTarget.value.status = '已取消'
  cancelTarget.value.cancellation = {
    reason: cancelReason.value.trim(),
    refundStatus: '退款处理中',
    notificationStatus: '已推送',
  }
  appStore.notify('拼团已取消', '原因已记录，成员通知已推送，全额退款任务已创建。', 'success')
  cancelTarget.value = null
  cancelReason.value = ''
}

function resetFilters() {
  Object.assign(searchDraft, createEmptySearch())
  Object.assign(searchApplied, createEmptySearch())
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

function applyStatusFilter(status: '全部' | CarpoolStatus) {
  searchDraft.status = status
  searchApplied.status = status
  currentPage.value = 1
}

function openShareConfig() {
  sharePrefixDraft.value = appStore.shareLinkPrefix
  sharePrefixDraftEn.value = appStore.shareLinkPrefixEn
  shareLanguage.value = 'zh'
  shareConfigOpen.value = true
}

function saveShareConfig() {
  const value = sharePrefixDraft.value.trim()
  const valueEn = sharePrefixDraftEn.value.trim()
  if (!value || !valueEn) return
  appStore.updateShareLinkPrefix(value, valueEn)
  shareConfigOpen.value = false
  appStore.notify('分享前缀已更新', '司机分享订单池与乘客分享拼车团已同步使用新文案。', 'success')
}

</script>

<template>
  <div class="list-page">
    <header class="page-header">
      <div>
        <div class="page-header__eyebrow">ORDERS / CARPOOL DEMANDS</div>
        <h1>拼车需求管理</h1>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary" type="button" @click="openShareConfig">
          <SlidersHorizontal :size="15" />
          分享链接前缀
        </button>
      </div>
    </header>

    <div class="quick-stats stats-banner stats-banner--light">
      <button class="quick-stat" :class="{ 'is-active': searchApplied.status === '全部' }" type="button" @click="applyStatusFilter('全部')">
        <span>全部需求</span><strong>{{ statusCounts.all }}</strong>
      </button>
      <button class="quick-stat" :class="{ 'is-active': searchApplied.status === '拼团中' }" type="button" @click="applyStatusFilter('拼团中')">
        <span>拼团中</span><strong class="quick-stat__brand">{{ statusCounts.pending }}</strong>
      </button>
      <button class="quick-stat" :class="{ 'is-active': searchApplied.status === '已成团' }" type="button" @click="applyStatusFilter('已成团')">
        <span>已成团</span><strong class="quick-stat__success">{{ statusCounts.formed }}</strong>
      </button>
      <button class="quick-stat" :class="{ 'is-active': searchApplied.status === '已取消' }" type="button" @click="applyStatusFilter('已取消')">
        <span>已取消</span><strong class="quick-stat__muted">{{ statusCounts.cancelled }}</strong>
      </button>
    </div>

    <section class="filter-bar carpool-filter-bar">
      <div class="advanced-filter-grid">
        <label class="filter-field"><span>路线 ID</span><input v-model="searchDraft.routeId" class="field-control" type="search" placeholder="请输入路线 ID" /></label>
        <label class="filter-field"><span>路线名称</span><input v-model="searchDraft.routeName" class="field-control" type="search" placeholder="请输入路线名称" /></label>
        <label class="filter-field"><span>乘客姓名</span><input v-model="searchDraft.passengerName" class="field-control" type="search" placeholder="请输入乘客姓名" /></label>
        <label class="filter-field"><span>手机号</span><input v-model="searchDraft.phone" class="field-control" type="search" placeholder="请输入手机号" /></label>
        <label class="filter-field"><span>邮箱</span><input v-model="searchDraft.email" class="field-control" type="search" placeholder="请输入邮箱" /></label>
        <label class="filter-field"><span>拼团状态</span><select v-model="searchDraft.status" class="field-control"><option value="全部">拼团状态：全部</option><option value="拼团中">拼团中</option><option value="已成团">已成团</option><option value="已取消">已取消</option></select></label>
        <label class="filter-field"><span>支付状态</span><select v-model="searchDraft.paymentStatus" class="field-control"><option value="全部">支付状态：全部</option><option value="已付定金">已付定金</option><option value="已付尾款">已付尾款</option></select></label>
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
        <table class="data-table structured-data-table carpool-table">
          <thead>
            <tr>
              <th>需求 ID</th>
              <th>乘客姓名</th>
              <th>手机号</th>
              <th>邮箱</th>
              <th>路线 ID</th>
              <th>路线名称</th>
              <th>起点</th>
              <th>终点</th>
              <th>人数</th>
              <th>行李</th>
              <th>出发时间</th>
              <th>下单时间</th>
              <th>支付状态</th>
              <th>拼团人数</th>
              <th>拼团状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.id">
              <td><div class="table-primary mono">{{ row.id }}</div></td>
              <td><div class="table-primary">{{ row.passengerName }}</div></td>
              <td><span class="nowrap">{{ row.phone }}</span></td>
              <td><span class="contact-email">{{ row.email }}</span></td>
              <td><span class="mono nowrap">{{ row.routeId }}</span></td>
              <td><div class="table-primary route-name" :title="row.routeName">{{ row.routeName }}</div></td>
              <td><span class="location-cell" :title="row.origin">{{ row.origin }}</span></td>
              <td><span class="location-cell" :title="row.destination">{{ row.destination }}</span></td>
              <td><span class="quantity-cell"><Users :size="14" />{{ formatParty(row) }}</span></td>
              <td><span class="nowrap">{{ formatLuggage(row) }}</span></td>
              <td><div class="table-primary nowrap">{{ formatLondonTime(row.departureAt) }}</div><div class="table-secondary">{{ timeUntil(row.departureAt) }} 后</div></td>
              <td><span class="nowrap">{{ formatLondonTime(row.orderedAt) }}</span></td>
              <td><StatusBadge :label="row.paymentStatus" :tone="row.paymentStatus === '已付尾款' ? 'success' : 'info'" /></td>
              <td>
                <div class="group-progress"><span :style="{ width: `${(row.groupCount / row.groupTarget) * 100}%` }"></span></div>
                <div class="table-secondary group-progress__text">{{ row.groupCount }} / {{ row.groupTarget }} 人</div>
              </td>
              <td><StatusBadge :label="row.status" :tone="statusTone(row.status)" dot /></td>
              <td>
                <div class="table-actions">
                  <button class="table-action" type="button" @click="openDetail(row)">详情</button>
                  <button class="table-action" type="button" :disabled="row.status !== '拼团中'" @click="requestCutoff(row)">截团</button>
                  <button class="table-action table-action--danger" type="button" :disabled="row.status !== '拼团中'" @click="requestCancel(row)">取消</button>
                </div>
              </td>
            </tr>
            <tr v-if="!filteredRows.length"><td colspan="16"><div class="empty-state"><span class="empty-state__icon"><Search :size="20" /></span><strong>没有匹配的拼车需求</strong><p>调整搜索关键词或筛选条件后再试。</p></div></td></tr>
          </tbody>
        </table>
      </div>
      <footer class="table-footer">
        <span>共 {{ filteredRows.length }} 条 · 第 {{ currentPage }} / {{ totalPages }} 页</span>
        <div class="pagination"><select v-model="pageSize" class="pagination-size" aria-label="每页条数"><option :value="20">20 条/页</option><option :value="50">50 条/页</option><option :value="100">100 条/页</option></select><button type="button" :disabled="currentPage === 1" @click="currentPage--">‹</button><button v-for="page in totalPages" :key="page" type="button" :class="{ 'is-active': currentPage === page }" @click="currentPage = page">{{ page }}</button><button type="button" :disabled="currentPage === totalPages" @click="currentPage++"><span aria-hidden="true">›</span></button></div>
      </footer>
    </section>

    <DrawerShell v-if="selectedDemand" :title="selectedDemand.id" eyebrow="CARPOOL DEMAND" @close="selectedDemand = null">
      <div class="drawer-summary">
        <div class="drawer-summary__status"><span>拼团状态</span><StatusBadge :label="selectedDemand.status" :tone="statusTone(selectedDemand.status)" dot /></div>
        <div><span>拼团人数</span><strong>{{ selectedDemand.groupCount }} / {{ selectedDemand.groupTarget }}</strong></div>
        <div><span>预计出发</span><strong>{{ formatLondonTime(selectedDemand.departureAt) }}</strong></div>
        <div><span>已付定金</span><strong>{{ formatCurrency(demandDepositTotalPence(selectedDemand)) }}</strong></div>
      </div>
      <div v-if="selectedDemand.generatedOrderId" class="workflow-notice workflow-notice--success"><strong>已生成派单订单</strong><span class="mono">{{ selectedDemand.generatedOrderId }}</span><p>价格仍为未定，待司机确认车型后首次锁定。</p></div>
      <div v-if="selectedDemand.cancellation" class="workflow-notice workflow-notice--danger"><strong>平台取消处理</strong><p>{{ selectedDemand.cancellation.reason }}</p><div><StatusBadge :label="selectedDemand.cancellation.refundStatus" tone="warning" /><StatusBadge :label="selectedDemand.cancellation.notificationStatus" tone="info" /></div></div>
      <div class="detail-section">
        <div class="detail-section__heading">
          <div class="detail-section__title">
            <h3>路线与下单信息</h3>
            <p><span>路线名称</span>{{ selectedDemand.routeName }}</p>
          </div>
          <span class="mono">{{ selectedDemand.routeId }} · {{ selectedDemand.paymentStatus }}</span>
        </div>
        <div class="route-rail"><span class="route-rail__dot route-rail__dot--start"></span><div><small>起点</small><strong>{{ selectedDemand.origin }}</strong></div><span class="route-rail__line"></span><span class="route-rail__dot route-rail__dot--end"></span><div><small>终点</small><strong>{{ selectedDemand.destination }}</strong></div></div>
        <div class="detail-grid">
          <div><span>乘客</span><strong>{{ selectedDemand.passengerName }}</strong></div>
          <div><span>手机号</span><strong>{{ selectedDemand.phone }}</strong></div>
          <div><span>邮箱</span><strong>{{ selectedDemand.email }}</strong></div>
          <div><span>人数</span><strong>{{ formatParty(selectedDemand) }}</strong></div>
          <div><span>定金单价</span><strong>{{ formatCurrency(selectedDemand.depositUnitPence) }} / 人</strong></div>
          <div><span>定金计算</span><strong>{{ formatCurrency(selectedDemand.depositUnitPence) }} × {{ selectedDemand.groupCount }} 人 = {{ formatCurrency(demandDepositTotalPence(selectedDemand)) }}</strong></div>
          <div><span>行李</span><strong>{{ formatLuggage(selectedDemand) }}</strong></div>
          <div><span>下单时间</span><strong>{{ formatLondonTime(selectedDemand.orderedAt) }}</strong></div>
          <div><span>出发时间</span><strong>{{ formatLondonTime(selectedDemand.departureAt) }}</strong></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-section__heading"><h3>团内乘客</h3><span class="muted">共 {{ selectedDemand.members.length }} 个下单组 / {{ selectedDemand.groupCount }} 人</span></div>
        <div class="member-list">
          <div v-for="(member, memberIndex) in selectedDemand.members" :key="member.id" class="member-row">
            <span class="member-avatar">{{ member.name.slice(0, 1) }}</span>
            <div>
              <strong>{{ member.name }} · <span class="mono">{{ member.id }}</span> · {{ memberIndex === 0 ? '当前乘客' : '其他乘客' }}</strong>
              <small>{{ member.phone }} · {{ member.email }}</small>
              <small>{{ member.routeName }} · {{ member.origin }} → {{ member.destination }}</small>
              <small>{{ formatParty(member) }} · {{ formatLuggage(member) }} · 下单 {{ formatLondonTime(member.orderedAt) }} · 出发 {{ formatLondonTime(member.departureAt) }}</small>
              <PassengerAddOnSummary :services="member.valueAddedServices" />
            </div>
            <StatusBadge :label="member.paymentStatus" :tone="member.paymentStatus === '已付尾款' ? 'success' : 'info'" />
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn btn--secondary" type="button" @click="selectedDemand = null">关闭</button>
        <button class="btn btn--primary" type="button" :disabled="selectedDemand.status !== '拼团中'" @click="requestCutoff(selectedDemand); selectedDemand = null">截团</button>
        <button class="btn btn--danger" type="button" :disabled="selectedDemand.status !== '拼团中'" @click="requestCancel(selectedDemand); selectedDemand = null">取消拼团</button>
      </template>
    </DrawerShell>

    <ModalDialog v-if="cutoffTarget" title="确认人工截团" eyebrow="FORCE FORMATION" @close="cutoffTarget = null">
      <div class="confirm-copy"><div class="confirm-icon confirm-icon--brand"><Users :size="20" /></div><div><strong>{{ cutoffTarget.id }}</strong><p>当前共有 {{ cutoffTarget.groupCount }} 名乘车人（最低 2 人），截团后将停止新成员加入并生成订单进入派单池。</p></div></div>
      <template #footer><button class="btn btn--secondary" type="button" @click="cutoffTarget = null">返回</button><button class="btn btn--brand" type="button" @click="confirmCutoff">确认截团</button></template>
    </ModalDialog>

    <ModalDialog v-if="cancelTarget" title="取消整个拼车团" eyebrow="CANCEL GROUP" @close="cancelTarget = null">
      <div class="confirm-copy"><div class="confirm-icon confirm-icon--danger"><X :size="20" /></div><div><strong>{{ cancelTarget.id }}</strong><p>取消后全体成员将全额退还定金与增值服务费，并向团内成员推送平台原因通知。</p></div></div>
      <label class="form-label" for="cancel-reason">取消原因（必填）</label>
      <textarea id="cancel-reason" v-model="cancelReason" class="form-textarea" placeholder="请输入平台取消原因"></textarea>
      <template #footer><button class="btn btn--secondary" type="button" @click="cancelTarget = null">返回</button><button class="btn btn--danger" type="button" :disabled="!cancelReason.trim()" @click="confirmCancel">确认取消并退款</button></template>
    </ModalDialog>

    <ModalDialog v-if="shareConfigOpen" title="分享链接前缀" eyebrow="SHARED COPY" @close="shareConfigOpen = false">
      <p class="config-description">这份文案由司机分享订单池与乘客分享拼车团共同使用，保存后两处同步生效。</p>
      <ContentLanguageTabs v-model="shareLanguage" />
      <template v-if="shareLanguage === 'zh'">
        <label class="form-label" for="share-prefix">分享前缀文案（中文）</label>
        <textarea id="share-prefix" v-model="sharePrefixDraft" class="form-textarea" maxlength="80" placeholder="请输入中文分享链接前缀"></textarea>
      </template>
      <template v-else>
        <label class="form-label" for="share-prefix-en">Share prefix (English)</label>
        <textarea id="share-prefix-en" v-model="sharePrefixDraftEn" class="form-textarea" maxlength="120" placeholder="Enter the English share prefix"></textarea>
      </template>
      <div class="share-preview"><span>{{ shareLanguage === 'zh' ? '中文预览' : 'English preview' }}</span><p>{{ (shareLanguage === 'zh' ? sharePrefixDraft : sharePrefixDraftEn) || (shareLanguage === 'zh' ? '请输入分享链接前缀' : 'Enter the English share prefix') }} · https://yomi.travel/s/••••</p></div>
      <template #footer><button class="btn btn--secondary" type="button" @click="shareConfigOpen = false">取消</button><button class="btn btn--brand" type="button" :disabled="!sharePrefixDraft.trim() || !sharePrefixDraftEn.trim()" @click="saveShareConfig">保存中英文并同步</button></template>
    </ModalDialog>
  </div>
</template>

<style scoped>
.quick-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-bottom: 16px;
  gap: 10px;
}

.quick-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
  padding: 0 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text-muted);
  text-align: left;
  transition: border-color var(--motion-fast), box-shadow var(--motion-fast), transform var(--motion-fast);
}

.quick-stat:hover,
.quick-stat.is-active {
  border-color: var(--ink-200);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.quick-stat.is-active {
  background: var(--ink-50);
}

.quick-stat span {
  font-size: 11px;
}

.quick-stat strong {
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 21px;
  font-weight: 800;
}

.quick-stat__brand { color: var(--brand) !important; }
.quick-stat__success { color: var(--success) !important; }
.quick-stat__muted { color: var(--text-faint) !important; }

.carpool-filter-bar { display: block; padding: 16px; }
.advanced-filter-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
.filter-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.filter-field > span { color: var(--text-subtle); font-size: 9px; font-weight: 700; }
.filter-field .field-control { width: 100%; min-width: 0; }
.advanced-filter-actions { display: flex; align-items: center; min-height: 38px; margin-top: 14px; gap: 8px; }
.filter-result {
  display: inline-flex;
  align-items: center;
  color: var(--text-faint);
  font-family: var(--font-mono);
  font-size: 10px;
  gap: 5px;
}

.pagination-size { height: 28px; padding: 0 7px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--text-muted); font-size: 9px; }

.carpool-table { min-width: 2180px; }
.carpool-table th:first-child,
.carpool-table td:first-child {
  position: sticky;
  z-index: 1;
  left: 0;
  min-width: 142px;
  background: var(--surface);
  box-shadow: 8px 0 12px -12px rgba(15, 30, 53, 0.35);
}
.carpool-table th:first-child { z-index: 3; background: var(--page-2); }
.carpool-table tbody tr:hover td:first-child { background: var(--ink-50); }
.carpool-table th:nth-child(2) { min-width: 104px; }
.carpool-table th:nth-child(3) { min-width: 150px; }
.carpool-table th:nth-child(4) { min-width: 190px; }
.carpool-table th:nth-child(5) { min-width: 120px; }
.carpool-table th:nth-child(6) { min-width: 190px; }
.carpool-table th:nth-child(7),
.carpool-table th:nth-child(8) { min-width: 150px; }
.carpool-table th:nth-child(11),
.carpool-table th:nth-child(12) { min-width: 145px; }
.nowrap { white-space: nowrap; }
.contact-email,
.location-cell,
.route-name {
  display: block;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.location-cell { max-width: 145px; }

.group-progress {
  width: 74px;
  height: 5px;
  overflow: hidden;
  border-radius: var(--radius-pill);
  background: var(--page-2);
}

.group-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--brand);
}

.group-progress__text {
  margin-top: 4px;
}

.drawer-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 14px;
  margin-bottom: 22px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--page);
  gap: 10px;
}

.drawer-summary > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.drawer-summary span:first-child,
.detail-grid span {
  color: var(--text-faint);
  font-size: 10px;
}

.drawer-summary strong {
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
}

.workflow-notice {
  padding: 12px 13px;
  margin: -8px 0 18px;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-lg);
  background: var(--ink-50);
}

.workflow-notice--danger { border-color: var(--danger-border); background: var(--danger-bg); }
.workflow-notice strong { display: block; color: var(--text-strong); font-size: 11px; }
.workflow-notice > span { display: block; margin-top: 3px; color: var(--ink-600); font-size: 10px; }
.workflow-notice p { margin: 4px 0 0; color: var(--text-muted); font-size: 10px; }
.workflow-notice > div { display: flex; margin-top: 8px; gap: 6px; }

.detail-section {
  margin-bottom: 24px;
}

.detail-section__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 10px;
}

.detail-section__heading h3 {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
}

.detail-section__title { min-width: 0; }
.detail-section__title p { display: flex; align-items: center; flex-wrap: wrap; margin: 5px 0 0; color: var(--text-subtle); font-size: 11px; font-weight: 700; gap: 6px; }
.detail-section__title p span { padding: 2px 6px; border-radius: var(--radius-sm); background: var(--ink-50); color: var(--text-faint); font-size: 8px; font-weight: 700; }

.route-rail {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) 30px auto minmax(0, 1fr);
  align-items: center;
  margin-bottom: 16px;
  gap: 8px;
}

.route-rail__dot {
  width: 10px;
  height: 10px;
  border: 2px solid var(--ink-600);
  border-radius: 50%;
}

.route-rail__dot--start {
  background: var(--ink-600);
  box-shadow: 0 0 0 4px var(--ink-50);
}

.route-rail__dot--end {
  border-color: var(--brand);
  background: var(--brand);
  box-shadow: 0 0 0 4px var(--brand-100);
}

.route-rail__line {
  height: 1px;
  background: var(--divider);
}

.route-rail small,
.member-row small {
  display: block;
  color: var(--text-faint);
  font-size: 10px;
}

.route-rail strong {
  display: block;
  overflow: hidden;
  margin-top: 3px;
  color: var(--text-strong);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  padding: 12px 0 0;
  border-top: 1px solid var(--border);
  gap: 14px 18px;
}

.detail-grid strong {
  display: block;
  margin-top: 3px;
  color: var(--text-subtle);
  font-size: 12px;
  font-weight: 600;
}

.member-list {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}

.member-row {
  display: flex;
  align-items: flex-start;
  padding: 11px 12px;
  border-bottom: 1px solid var(--border);
  gap: 9px;
}

.member-row:last-child { border-bottom: 0; }

.member-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: 50%;
  background: var(--ink-100);
  color: var(--ink-700);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 700;
}

.member-row > div {
  min-width: 0;
  flex: 1;
}

.member-row strong { display: block; color: var(--text-strong); font-size: 12px; }
.config-description { margin: 0 0 16px; color: var(--text-muted); font-size: 12px; }
.share-preview { padding: 11px 12px; margin-top: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.share-preview span { color: var(--text-faint); font-size: 9px; }
.share-preview p { margin: 3px 0 0; color: var(--text-subtle); font-size: 11px; }

.confirm-copy {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 12px;
}

.confirm-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 50%;
}

.confirm-icon--brand { background: var(--brand-100); color: var(--brand-dark); }
.confirm-icon--danger { background: var(--danger-bg); color: var(--danger); }
.confirm-copy strong { color: var(--text-strong); font-family: var(--font-display); font-size: 13px; }
.confirm-copy p { margin: 4px 0 0; color: var(--text-muted); font-size: 12px; line-height: 1.55; }

@media (max-width: 900px) {
  .quick-stats { grid-template-columns: repeat(2, 1fr); }
  .advanced-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 560px) {
  .quick-stats { grid-template-columns: 1fr; }
  .advanced-filter-grid { grid-template-columns: 1fr; }
  .advanced-filter-actions { align-items: stretch; flex-direction: column; }
  .advanced-filter-actions .btn { width: 100%; }
  .advanced-filter-actions .filter-bar__spacer { display: none; }
  .drawer-summary { grid-template-columns: 1fr; }
  .detail-grid { grid-template-columns: 1fr; }
  .route-rail { grid-template-columns: auto minmax(0, 1fr); }
  .route-rail__line { display: none; }
  .route-rail__dot--end { grid-row: 2; }
}
</style>
