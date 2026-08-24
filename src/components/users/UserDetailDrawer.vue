<script setup lang="ts">
import { Clock3, ReceiptText, ShieldCheck, Smartphone, TicketPercent, UserRound } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import DrawerShell from '@/components/overlay/DrawerShell.vue'
import { moduleCatalog } from '@/data/moduleCatalog'
import { orders } from '@/data/mock'
import type { ModuleRow } from '@/data/moduleCatalog.types'
import type { Order, OrderPassenger, ValueAddedServiceSelection } from '@/types'
import { formatCurrency, formatLuggage, formatLondonTime, formatParty } from '@/utils/format'

const props = defineProps<{
  user: ModuleRow
}>()

const emit = defineEmits<{
  close: []
}>()

type UserDetailTab = 'profile' | 'orders' | 'coupons'

interface UserOrderRecord {
  order: Order
  passenger?: OrderPassenger
}

interface UserCouponRecord {
  id: string
  code: string
  couponName: string
  couponType: string
  content: string
  service: string
  validity: string
  source: string
  grantedAt: string
  orderId: string
  status: string
  recordType: string
  carriedFromOrderId?: string
  snapshotOrderIds: string[]
}

const activeTab = ref<UserDetailTab>('profile')

const tabs: Array<{ id: UserDetailTab; label: string; icon: typeof UserRound }> = [
  { id: 'profile', label: '基础信息', icon: UserRound },
  { id: 'orders', label: '订单详情', icon: ReceiptText },
  { id: 'coupons', label: '优惠券信息', icon: TicketPercent },
]

const userName = computed(() => String(props.user.name ?? ''))
const userId = computed(() => String(props.user.id ?? ''))
const userOrderRecords = computed<UserOrderRecord[]>(() => {
  return orders.flatMap((order) => {
    const passenger = order.passengers.find((item) => item.id === userId.value)
    const isDriverOrder = String(props.user.identity ?? '').includes('司机') && order.driverName?.includes(userName.value)
    return passenger || isDriverOrder ? [{ order, passenger }] : []
  })
})

const userCouponGrants = computed(() => {
  const grants = moduleCatalog['coupon-grants']?.rows ?? []
  const phone = String(props.user.phone ?? '')
  return grants.filter((grant) => String(grant.phone ?? '') === phone || String(grant.holder ?? '').includes(userId.value))
})

const userCoupons = computed<UserCouponRecord[]>(() => {
  const recordsByCode = new Map<string, UserCouponRecord>()

  userCouponGrants.value.forEach((grant) => {
    const code = String(grant.code ?? '').trim()
    if (!code) return
    recordsByCode.set(code.toUpperCase(), {
      id: String(grant.id),
      code,
      couponName: String(grant.couponName ?? '未命名优惠券'),
      couponType: String(grant.couponType ?? '—'),
      content: String(grant.content ?? '—'),
      service: String(grant.service ?? '—'),
      validity: couponValidity(grant),
      source: String(grant.source ?? '—'),
      grantedAt: String(grant.grantedAt ?? '—'),
      orderId: String(grant.orderId ?? '—'),
      status: String(grant.status ?? '—'),
      recordType: '发放记录',
      snapshotOrderIds: [],
    })
  })

  const snapshotsByCode = new Map<string, Array<{
    order: Order
    coupon: NonNullable<Order['coupon']>
  }>>()

  userOrderRecords.value.forEach(({ order }) => {
    if (!order.coupon?.code) return
    const key = order.coupon.code.trim().toUpperCase()
    const snapshots = snapshotsByCode.get(key) ?? []
    snapshots.push({ order, coupon: order.coupon })
    snapshotsByCode.set(key, snapshots)
  })

  snapshotsByCode.forEach((snapshots, key) => {
    // 优先取带沿用来源的新单，其次取未取消订单，避免原单快照覆盖真实核销订单。
    const redeemedSnapshot = snapshots.find(({ coupon }) => coupon.carriedFromOrderId)
      ?? snapshots.find(({ order }) => order.status !== '已取消')
      ?? snapshots[0]
    if (!redeemedSnapshot) return

    const existing = recordsByCode.get(key)
    const snapshotOrderIds = [...new Set(snapshots.map(({ order }) => order.id))]
    const carriedFromOrderId = redeemedSnapshot.coupon.carriedFromOrderId
    recordsByCode.set(key, {
      id: existing?.id ?? `ORDER-COUPON-${redeemedSnapshot.order.id}-${key}`,
      code: redeemedSnapshot.coupon.code,
      couponName: redeemedSnapshot.coupon.name,
      couponType: existing?.couponType ?? '满减',
      content: existing?.content ?? `抵扣 ${formatCurrency(redeemedSnapshot.order.fees.couponPence)}`,
      service: existing?.service ?? redeemedSnapshot.order.serviceType,
      validity: existing?.validity ?? redeemedSnapshot.coupon.validityRange ?? '—',
      source: existing?.source ?? (carriedFromOrderId ? '订单快照 · 原单沿用' : '订单快照'),
      grantedAt: existing?.grantedAt ?? '—',
      orderId: redeemedSnapshot.order.id,
      status: '已核销',
      recordType: existing ? '发放记录 + 订单快照' : '订单用券快照',
      carriedFromOrderId,
      snapshotOrderIds,
    })
  })

  return [...recordsByCode.values()]
})

function statusTone(status: unknown) {
  const label = String(status ?? '')
  if (/冻结|过期|失败|取消/.test(label)) return 'danger' as const
  if (/待|处理中|未核销/.test(label)) return 'warning' as const
  if (/正常|已核销|成功|启用/.test(label)) return 'success' as const
  return 'neutral' as const
}

function routeParts(order: Order) {
  const parts = order.routeName.split(' → ')
  return { origin: parts[0] ?? order.routeName, destination: parts[1] ?? '—' }
}

function orderAmount(order: Order) {
  return order.priceStatus === '未定' ? '待定' : formatCurrency(order.amountPence)
}

function orderValueAddedServices(record: UserOrderRecord): ValueAddedServiceSelection[] {
  if (record.passenger) return record.passenger.valueAddedServices
  return record.order.passengers.flatMap((passenger) => passenger.valueAddedServices)
}

function orderValueAddedServiceTotal(record: UserOrderRecord) {
  return orderValueAddedServices(record).reduce((total, service) => total + service.pricePence, 0)
}

function couponValidity(coupon: ModuleRow) {
  const directValue = String(coupon.validity ?? '').trim()
  if (directValue) return directValue
  const couponId = String(coupon.couponId ?? '')
  const source = moduleCatalog.coupons?.rows?.find((item) => String(item.id) === couponId)
  return String(source?.validity ?? '—')
}

watch(() => props.user.id, () => {
  activeTab.value = 'profile'
})
</script>

<template>
  <DrawerShell :title="`${user.name ?? '用户'} · 用户详情`" eyebrow="USER DETAIL" @close="emit('close')">
    <div class="user-detail-hero">
      <div class="user-avatar" aria-hidden="true">{{ user.avatar ?? String(user.name ?? 'U').slice(0, 1) }}</div>
      <div class="user-detail-hero__main">
        <small>{{ user.id }}</small>
        <h3>{{ user.name }} <span>{{ user.englishName }}</span></h3>
        <p>{{ user.phone }} · {{ user.email }}</p>
      </div>
      <StatusBadge v-if="user.status" :label="String(user.status)" :tone="statusTone(user.status)" dot />
    </div>

    <div class="user-detail-tabs" role="tablist" aria-label="用户详情页签">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="activeTab === tab.id"
        :class="{ 'is-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <component :is="tab.icon" :size="14" />{{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'profile'" class="user-tab-panel">
      <section class="user-detail-card">
        <header><div><span>ACCOUNT</span><h3>账号信息</h3></div><ShieldCheck :size="17" /></header>
        <div class="user-info-grid">
          <div><span>用户ID</span><strong class="mono">{{ user.id }}</strong></div>
          <div><span>身份（乘客/司机）</span><strong class="identity-value">{{ user.identity ?? '—' }}</strong></div>
          <div><span>姓名</span><strong>{{ user.name ?? '—' }}</strong></div>
          <div><span>英文名</span><strong>{{ user.englishName ?? '—' }}</strong></div>
          <div><span>手机号</span><strong>{{ user.phone ?? '—' }}</strong></div>
          <div><span>邮箱</span><strong>{{ user.email ?? '—' }}</strong></div>
          <div><span>账号状态</span><StatusBadge v-if="user.status" :label="String(user.status)" :tone="statusTone(user.status)" dot /></div>
          <div><span>头像</span><strong class="avatar-note"><i>{{ user.avatar ?? String(user.name ?? 'U').slice(0, 1) }}</i>已配置（原型占位）</strong></div>
        </div>
      </section>

      <section class="user-detail-card">
        <header><div><span>LOGIN AUDIT</span><h3>登录信息</h3></div><Clock3 :size="17" /></header>
        <div class="user-info-grid">
          <div><span>注册时间</span><strong>{{ user.registeredAt ?? '—' }}</strong></div>
          <div><span>注册来源</span><strong>{{ user.registeredSource ?? '—' }}</strong></div>
          <div class="user-info-grid__wide"><span>注册设备</span><strong>{{ user.registeredDevice ?? '—' }}</strong></div>
          <div><span>最后登录时间</span><strong>{{ user.lastLoginAt ?? '—' }}</strong></div>
        </div>
        <p class="user-detail-note"><Smartphone :size="14" />设备标识已按后台展示规则脱敏，仅用于登录审计。</p>
      </section>
    </div>

    <div v-else-if="activeTab === 'orders'" class="user-tab-panel">
      <section class="user-detail-card user-list-card">
        <header><div><span>ORDER HISTORY</span><h3>订单详情</h3><small>共 {{ userOrderRecords.length }} 笔关联订单</small></div><ReceiptText :size="17" /></header>
        <div v-if="userOrderRecords.length" class="user-order-list">
          <article v-for="record in userOrderRecords" :key="record.order.id" class="user-order-item">
            <template v-if="record.order">
              <div class="user-order-item__top"><strong class="mono">{{ record.order.id }}</strong><StatusBadge :label="record.order.status" :tone="statusTone(record.order.status)" dot /></div>
              <div class="user-order-route"><strong>{{ record.order.routeName }}</strong><span>{{ record.passenger?.origin ?? routeParts(record.order).origin }} → {{ record.passenger?.destination ?? routeParts(record.order).destination }}</span></div>
              <div class="user-order-facts">
                <span><b>出发时间</b>{{ formatLondonTime(record.passenger?.departureAt ?? record.order.departureAt, true) }}</span>
                <span><b>人数</b>{{ formatParty(record.passenger ?? record.order) }}</span>
                <span><b>行李</b>{{ formatLuggage(record.passenger ?? record.order) }}</span>
                <span><b>金额</b>{{ orderAmount(record.order) }}</span>
                <div class="user-order-addon user-order-facts__wide">
                  <b>增值服务</b>
                  <template v-if="orderValueAddedServices(record).length">
                    <span v-for="service in orderValueAddedServices(record)" :key="service.id">{{ service.name }} {{ formatCurrency(service.pricePence) }}</span>
                    <strong>小计 {{ formatCurrency(orderValueAddedServiceTotal(record)) }}</strong>
                  </template>
                  <span v-else>无</span>
                </div>
                <span v-if="record.order.sourceOrderId || record.order.replacementOrderId" class="user-order-facts__wide"><b>关联订单</b>{{ [record.order.sourceOrderId, record.order.replacementOrderId].filter(Boolean).join(' / ') }}</span>
              </div>
            </template>
          </article>
        </div>
        <div v-else class="user-empty-state"><ReceiptText :size="20" /><strong>暂无关联订单</strong><p>当前原型数据仓中没有匹配到该用户的订单。</p></div>
      </section>
    </div>

    <div v-else class="user-tab-panel">
      <section class="user-detail-card user-list-card">
        <header><div><span>COUPON HISTORY</span><h3>优惠券信息</h3><small>发放记录与订单用券快照合并，按券码去重</small></div><TicketPercent :size="17" /></header>
        <div v-if="userCoupons.length" class="user-coupon-list">
          <article v-for="coupon in userCoupons" :key="coupon.id" class="user-coupon-item">
            <div class="user-coupon-item__top"><strong class="mono">{{ coupon.code }}</strong><StatusBadge :label="String(coupon.status ?? '—')" :tone="statusTone(coupon.status)" dot /></div>
            <div class="user-coupon-name"><strong>{{ coupon.couponName }}</strong><span>{{ coupon.couponType }} · {{ coupon.recordType }}</span></div>
            <div class="user-coupon-facts">
              <span><b>内容</b>{{ coupon.content }}</span>
              <span><b>使用服务</b>{{ coupon.service }}</span>
              <span><b>有效期范围</b>{{ coupon.validity }}</span>
              <span><b>获取方式</b>{{ coupon.source }}</span>
              <span><b>发放时间</b>{{ coupon.grantedAt }}</span>
              <span><b>核销订单</b>{{ coupon.orderId ?? '—' }}</span>
              <span v-if="coupon.carriedFromOrderId" class="user-coupon-facts__wide"><b>0819 沿用链路</b>{{ coupon.carriedFromOrderId }} → {{ coupon.orderId }}</span>
              <span v-if="coupon.snapshotOrderIds.length > 1" class="user-coupon-facts__wide"><b>关联订单快照</b>{{ coupon.snapshotOrderIds.join(' / ') }}</span>
            </div>
          </article>
        </div>
        <div v-else class="user-empty-state"><TicketPercent :size="20" /><strong>暂无优惠券记录</strong><p>该用户目前没有可展示的优惠券发放记录。</p></div>
      </section>
    </div>

    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button></template>
  </DrawerShell>
</template>

<style scoped>
.user-detail-hero { display: flex; align-items: center; padding: 14px; margin-bottom: 15px; gap: 11px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.user-avatar { display: inline-flex; width: 44px; height: 44px; flex: 0 0 44px; align-items: center; justify-content: center; border-radius: 50%; background: var(--ink-700); color: #fff; font-family: var(--font-display); font-size: 16px; font-weight: 800; }
.user-detail-hero__main { min-width: 0; flex: 1; }
.user-detail-hero__main small { color: var(--ink-500); font-family: var(--font-mono); font-size: 8px; }
.user-detail-hero__main h3 { margin: 2px 0 2px; color: var(--text-strong); font-family: var(--font-display); font-size: 14px; }
.user-detail-hero__main h3 span { margin-left: 4px; color: var(--text-faint); font-family: var(--font-body); font-size: 10px; font-weight: 500; }
.user-detail-hero__main p { overflow: hidden; margin: 0; color: var(--text-faint); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.user-detail-tabs { display: flex; overflow-x: auto; padding-bottom: 6px; margin-bottom: 15px; gap: 4px; border-bottom: 1px solid var(--border); }
.user-detail-tabs button { display: inline-flex; align-items: center; min-height: 34px; padding: 0 10px; gap: 5px; border-radius: var(--radius-md); background: transparent; color: var(--text-faint); font-size: 10px; font-weight: 600; white-space: nowrap; }
.user-detail-tabs button:hover, .user-detail-tabs button.is-active { background: var(--ink-50); color: var(--ink-700); }
.user-tab-panel { display: grid; gap: 12px; }
.user-detail-card { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.user-detail-card > header { display: flex; align-items: flex-start; justify-content: space-between; padding: 13px 14px; border-bottom: 1px solid var(--border); background: var(--page-2); color: var(--ink-500); }
.user-detail-card > header span { display: block; color: var(--ink-500); font-family: var(--font-mono); font-size: 8px; letter-spacing: .08em; }
.user-detail-card > header h3 { margin: 3px 0 0; color: var(--text-strong); font-family: var(--font-display); font-size: 13px; }
.user-detail-card > header small { display: block; margin-top: 3px; color: var(--text-faint); font-size: 9px; }
.user-info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 14px; gap: 10px; }
.user-info-grid > div { min-width: 0; padding: 9px 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.user-info-grid__wide { grid-column: 1 / -1; }
.user-info-grid span, .user-order-facts b, .user-coupon-facts b { display: block; margin-bottom: 3px; color: var(--text-faint); font-size: 8px; font-weight: 600; }
.user-info-grid strong { display: block; overflow-wrap: anywhere; color: var(--text-subtle); font-size: 10px; }
.identity-value { color: var(--ink-700) !important; font-weight: 800; }
.avatar-note { display: flex !important; align-items: center; gap: 5px; }
.avatar-note i { display: inline-flex; width: 20px; height: 20px; align-items: center; justify-content: center; border-radius: 50%; background: var(--ink-700); color: #fff; font-size: 9px; font-style: normal; }
.user-detail-note { display: flex; align-items: center; padding: 10px 14px; margin: 0; gap: 6px; border-top: 1px solid var(--border); color: var(--text-faint); font-size: 9px; }
.user-list-card { min-width: 0; }
.user-order-list, .user-coupon-list { display: grid; gap: 8px; padding: 12px; }
.user-order-item, .user-coupon-item { padding: 11px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.user-order-item__top, .user-coupon-item__top, .user-coupon-name { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.user-order-item__top strong, .user-coupon-item__top strong { color: var(--ink-700); font-size: 9px; }
.user-order-route { display: flex; flex-direction: column; margin: 9px 0; gap: 3px; }
.user-order-route strong, .user-coupon-name strong { color: var(--text-strong); font-family: var(--font-display); font-size: 11px; }
.user-order-route span, .user-coupon-name span { color: var(--text-faint); font-size: 9px; }
.user-order-facts, .user-coupon-facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.user-order-facts > span, .user-order-facts > div, .user-coupon-facts > span { min-width: 0; color: var(--text-subtle); font-size: 9px; overflow-wrap: anywhere; }
.user-order-facts__wide, .user-coupon-facts__wide { grid-column: 1 / -1; }
.user-order-addon { display: flex; flex-wrap: wrap; align-items: center; padding: 8px 9px; gap: 5px 10px; border-radius: var(--radius-md); background: var(--ink-50); }
.user-order-addon b { width: 100%; }
.user-order-addon > span { color: var(--text-subtle); }
.user-order-addon > strong { margin-left: auto; color: var(--ink-700); font-size: 9px; }
.user-coupon-name { padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid var(--border); }
.user-empty-state { display: flex; min-height: 180px; flex-direction: column; align-items: center; justify-content: center; padding: 20px; color: var(--text-faint); text-align: center; gap: 6px; }
.user-empty-state strong { color: var(--text-subtle); font-size: 11px; }
.user-empty-state p { margin: 0; font-size: 9px; }
@media (max-width: 560px) { .user-info-grid, .user-order-facts, .user-coupon-facts { grid-template-columns: 1fr; } .user-info-grid__wide, .user-order-facts__wide, .user-coupon-facts__wide { grid-column: auto; } }
</style>
