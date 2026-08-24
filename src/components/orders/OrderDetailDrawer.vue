<script setup lang="ts">
import { ArrowRight, CarFront, MapPinned, MessageSquareText, Plus, ReceiptText, UsersRound } from '@lucide/vue'
import { computed, ref } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import PassengerAddOnSummary from '@/components/orders/PassengerAddOnSummary.vue'
import DrawerShell from '@/components/overlay/DrawerShell.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { Order, OrderStatus } from '@/types'
import { formatCurrency, formatLuggage, formatLondonTime, formatParty } from '@/utils/format'

const props = defineProps<{
  order: Order
}>()

const emit = defineEmits<{
  close: []
  dispatch: [order: Order]
  addNote: [content: string]
  adjustStatus: [status: OrderStatus, reason: string]
  cancelOrder: [reason: string]
  toggleTag: [tag: string]
  openLinkedOrder: [orderId: string]
}>()

type TabId = 'overview' | 'passengers' | 'driver' | 'route' | 'messages'
const activeTab = ref<TabId>('overview')
const noteDraft = ref('')
const adjustStatusOpen = ref(false)
const cancelOrderOpen = ref(false)
const nextStatus = ref<OrderStatus>(props.order.status)
const operationReason = ref('')

const tabs: Array<{ id: TabId; label: string; icon: typeof ReceiptText }> = [
  { id: 'overview', label: '订单信息', icon: ReceiptText },
  { id: 'passengers', label: '乘客信息', icon: UsersRound },
  { id: 'driver', label: '司导信息', icon: CarFront },
  { id: 'route', label: '订单路由', icon: MapPinned },
  { id: 'messages', label: '拼车团消息', icon: MessageSquareText },
]

const statusTone = computed(() => {
  if (['已完成', '待出行'].includes(props.order.status)) return 'success' as const
  if (['接乘客', '送乘客'].includes(props.order.status)) return 'coral' as const
  if (props.order.status === '已取消') return 'neutral' as const
  return 'warning' as const
})

const passengerAddOnTotalPence = computed(() =>
  props.order.passengers.reduce(
    (orderSum, passenger) => orderSum + passenger.valueAddedServices.reduce(
      (passengerSum, service) => passengerSum + service.pricePence,
      0,
    ),
    0,
  ),
)

const addOnTotalMatches = computed(() =>
  passengerAddOnTotalPence.value === props.order.fees.addOnPence,
)

const relatedOrders = computed(() => {
  const links: Array<{ kind: '来源订单' | '替代订单'; id: string; description: string }> = []
  if (props.order.sourceOrderId) {
    links.push({
      kind: '来源订单',
      id: props.order.sourceOrderId,
      description: '乘客修改来源订单并完成全额支付后生成本单；两条订单作为独立记录保留。',
    })
  }
  if (props.order.replacementOrderId) {
    links.push({
      kind: '替代订单',
      id: props.order.replacementOrderId,
      description: '本订单因乘客修改下单信息而取消并全额退款，后续履约由替代订单承接。',
    })
  }
  return links
})

const refundScopeLabel = computed(() => {
  const record = props.order.refundRecord
  if (!record) return ''
  if (record.fullRefund) {
    return record.includesValueAddedServices ? '全额 · 含增值服务费' : '全额 · 本单无增值服务'
  }
  return record.includesValueAddedServices ? '按订单退款规则 · 含增值服务费' : '按订单退款规则'
})

function submitNote() {
  if (!noteDraft.value.trim()) return
  emit('addNote', noteDraft.value.trim())
  noteDraft.value = ''
}

function openAdjustStatus() {
  nextStatus.value = props.order.status
  operationReason.value = ''
  adjustStatusOpen.value = true
}

function openCancelOrder() {
  operationReason.value = ''
  cancelOrderOpen.value = true
}

function confirmAdjustStatus() {
  if (!operationReason.value.trim() || nextStatus.value === props.order.status) return
  emit('adjustStatus', nextStatus.value, operationReason.value.trim())
  adjustStatusOpen.value = false
}

function confirmCancelOrder() {
  if (!operationReason.value.trim()) return
  emit('cancelOrder', operationReason.value.trim())
  cancelOrderOpen.value = false
}
</script>

<template>
  <DrawerShell :title="order.id" eyebrow="ORDER DETAIL" @close="emit('close')">
    <div class="order-detail-head">
      <div>
        <span>订单状态</span>
        <StatusBadge :label="order.status" :tone="statusTone" dot />
      </div>
      <div><span>价格状态</span><StatusBadge :label="order.priceStatus" :tone="order.priceStatus === '封板' ? 'neutral' : 'info'" /></div>
      <div><span>订单金额</span><strong class="order-price" :class="{ 'order-price--pending': order.priceStatus === '未定' }">{{ order.priceStatus === '未定' ? '待定' : formatCurrency(order.amountPence) }}</strong></div>
    </div>

    <div class="detail-tabs" role="tablist">
      <button v-for="tab in tabs" :key="tab.id" type="button" :class="{ 'is-active': activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="14" />{{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'overview'" class="tab-panel">
      <div v-if="relatedOrders.length" class="related-order-stack">
        <section v-for="relation in relatedOrders" :key="`${relation.kind}-${relation.id}`" class="related-order-card">
          <div>
            <span>{{ relation.kind }}</span>
            <strong>{{ relation.id }}</strong>
            <p>{{ relation.description }}</p>
          </div>
          <button type="button" @click="emit('openLinkedOrder', relation.id)">
            查看关联订单 <ArrowRight :size="13" />
          </button>
        </section>
      </div>

      <section class="detail-block">
        <div class="detail-block__heading"><h3>行程概览</h3><span class="mono">{{ order.businessType }} · {{ order.serviceType }}</span></div>
        <div class="journey-row"><span class="journey-pin journey-pin--start"></span><div><small>路线</small><strong>{{ order.routeName }}</strong></div></div>
        <div class="detail-facts">
          <div><span>出发时间</span><strong>{{ formatLondonTime(order.departureAt, true) }}</strong></div>
          <div><span>乘客人数</span><strong>{{ formatParty(order) }}</strong></div>
          <div><span>行李</span><strong>{{ formatLuggage(order) }}</strong></div>
          <div><span>司机应得</span><strong>{{ order.priceStatus === '未定' ? '待定' : formatCurrency(order.settlementPence) }}</strong></div>
          <div><span>司导</span><strong>{{ order.driverName || '待指派' }}</strong></div>
        </div>
      </section>

      <section v-if="order.priceStatus !== '未定'" class="detail-block">
        <div class="detail-block__heading"><h3>费用构成</h3><span class="muted">GBP</span></div>
        <div class="fee-list">
          <div><span>行程费</span><strong>{{ formatCurrency(order.fees.tripPence) }}</strong></div>
          <div><span>乘客定金</span><strong>{{ formatCurrency(order.fees.depositPence) }}</strong></div>
          <div><span>增值服务费（计入分账）</span><strong>{{ formatCurrency(order.fees.addOnPence) }}</strong></div>
          <div><span>优惠券抵扣（平台承担）</span><strong>−{{ formatCurrency(order.fees.couponPence) }}</strong></div>
          <div><span>平台抽佣 · {{ order.commissionRate ?? '—' }}%（{{ order.commissionSource ?? '待锁定' }}）</span><strong>−{{ formatCurrency(order.fees.commissionPence) }}</strong></div>
          <div class="fee-list__total"><span>司机应得</span><strong>{{ formatCurrency(order.fees.driverPence) }}</strong></div>
        </div>
        <div v-if="order.coupon" class="coupon-snapshot">
          <div><span>优惠券快照</span><strong>{{ order.coupon.name }} · {{ order.coupon.code }}</strong></div>
          <p v-if="order.coupon.carriedFromOrderId">沿用自原订单 {{ order.coupon.carriedFromOrderId }}，本页仅展示新订单实际用券结果。</p>
        </div>
      </section>

      <section v-else class="price-pending-notice">
        <span><ReceiptText :size="19" /></span>
        <div><strong>费用尚未生成</strong><p>拼车成团后车型仍未知；司机确认接单后，系统才按“路线 + 车型 + 成团人数”首次锁价并生成分账明细。</p></div>
      </section>

      <section v-if="order.refundRecord" class="refund-record">
        <div class="refund-record__heading">
          <div><span>自动退款留痕</span><strong>{{ formatCurrency(order.refundRecord.amountPence) }}</strong></div>
          <StatusBadge :label="order.refundRecord.status" :tone="order.refundRecord.status === '退款完成' ? 'success' : 'warning'" dot />
        </div>
        <div class="refund-record__facts">
          <div><span>取消类型</span><strong>{{ order.cancelType || '—' }}</strong></div>
          <div><span>取消原因</span><strong>{{ order.cancelReason || '—' }}</strong></div>
          <div><span>退款发起时间</span><strong>{{ formatLondonTime(order.refundRecord.createdAt, true) }}</strong></div>
          <div><span>退款范围</span><strong>{{ refundScopeLabel }}</strong></div>
        </div>
        <p>系统自动创建退款，无需客服进入异常订单人工处理。</p>
      </section>
      <section v-else-if="order.refundStatus" class="refund-notice"><strong>退款处理</strong><StatusBadge :label="order.refundStatus" tone="warning" dot /><p>退款任务已创建，完成后状态将由支付回调更新。</p></section>

      <section class="detail-block">
        <div class="detail-block__heading"><h3>运营标记</h3><span class="muted">可多选</span></div>
        <div class="tag-controls"><button v-for="tag in ['异常', '退款', '乘客']" :key="tag" type="button" :class="{ 'is-active': order.tags.includes(tag) }" @click="emit('toggleTag', tag)">{{ tag }}</button></div>
      </section>

      <section class="detail-block">
        <div class="detail-block__heading"><h3>运营备注</h3><span class="muted">{{ order.notes.length }} 条</span></div>
        <div v-if="order.notes.length" class="note-list"><div v-for="note in order.notes" :key="note.id" class="note-item"><span class="note-avatar">{{ note.author.slice(-1) }}</span><div><strong>{{ note.author }} <small>{{ formatLondonTime(note.createdAt) }}</small></strong><p>{{ note.content }}</p></div></div></div>
        <div class="note-compose"><input v-model="noteDraft" type="text" placeholder="追加一条运营备注" @keydown.enter="submitNote" /><button type="button" aria-label="添加备注" @click="submitNote"><Plus :size="15" /></button></div>
      </section>
    </div>

    <div v-else-if="activeTab === 'passengers'" class="tab-panel">
      <section class="detail-block">
        <div class="detail-block__heading">
          <h3>订单乘客</h3>
          <span class="muted" :class="{ 'text-danger': !addOnTotalMatches }">{{ order.passengers.length }} 个下单组 · 增值服务 {{ formatCurrency(passengerAddOnTotalPence) }}{{ addOnTotalMatches ? '' : ' · 与订单合计不一致' }}</span>
        </div>
        <div class="passenger-list">
          <article v-for="passenger in order.passengers" :key="passenger.id">
            <div class="passenger-head"><span class="passenger-avatar">{{ passenger.name.slice(0, 1) }}</span><div><strong>{{ passenger.name }}</strong><small>{{ passenger.id }} · {{ passenger.phone }}<template v-if="passenger.email"> · {{ passenger.email }}</template></small></div><StatusBadge :label="passenger.paymentStatus" :tone="passenger.paymentStatus === '已付尾款' ? 'success' : 'info'" /></div>
            <div class="passenger-route"><span>{{ passenger.origin }}</span><i></i><span>{{ passenger.destination }}</span></div>
            <div class="passenger-meta">
              <span>{{ formatParty(passenger) }} · {{ formatLuggage(passenger) }}<template v-if="passenger.orderedAt"> · 下单 {{ formatLondonTime(passenger.orderedAt) }}</template><template v-if="passenger.departureAt"> · 出发 {{ formatLondonTime(passenger.departureAt) }}</template></span>
            </div>
            <PassengerAddOnSummary :services="passenger.valueAddedServices" />
          </article>
        </div>
      </section>
    </div>

    <div v-else-if="activeTab === 'driver'" class="tab-panel">
      <section class="driver-card">
        <template v-if="order.driverName">
          <span class="driver-card__avatar">{{ order.driverName.slice(0, 1) }}</span>
          <div><span class="muted">已指派司导</span><h3>{{ order.driverName }}</h3><p>{{ order.driverVehicle }}</p><div class="driver-signals"><StatusBadge label="合规（原型示例）" tone="success" dot /><StatusBadge label="Stripe verified（原型示例）" tone="info" /></div></div>
        </template>
        <template v-else>
          <span class="driver-card__avatar driver-card__avatar--empty"><CarFront :size="22" /></span>
          <div><span class="muted">尚未指派司导</span><h3>订单仍在派单池</h3><p>请在倒计时结束前完成调度。</p><button class="btn btn--brand" type="button" @click="emit('dispatch', order)">调度司机</button></div>
        </template>
      </section>
    </div>

    <div v-else-if="activeTab === 'route'" class="tab-panel">
      <section class="route-map" aria-label="订单路线示意">
        <div class="route-map__grid"></div>
        <span class="route-map__zone route-map__zone--start">起点围栏</span>
        <span class="route-map__zone route-map__zone--end">终点围栏</span>
        <span class="route-map__track"></span>
        <span class="route-map__pin route-map__pin--start"><i></i></span>
        <span class="route-map__pin route-map__pin--end"><i></i></span>
        <span class="route-map__car"><CarFront :size="16" /></span>
      </section>
      <div class="route-stats"><div><span>路线</span><strong>{{ order.routeName }}</strong></div><div><span>总用时</span><strong>{{ ['接乘客', '送乘客'].includes(order.status) ? '01:12:36（原型示例）' : '尚未开始' }}</strong></div></div>
    </div>

    <div v-else class="tab-panel">
      <section v-if="order.serviceType === '拼车'" class="message-list">
        <div><span class="message-avatar">林</span><p><strong>林诗雨 <small>09:12</small></strong><span>我的航班已经落地，正在前往入境检查。</span></p></div>
        <div><span class="message-avatar message-avatar--driver">司</span><p><strong>司导 <small>09:14</small></strong><span>收到，我会在指定上车点等候。</span></p></div>
        <div class="message-notice">原型示例消息 · 聊天记录仅查看，不支持后台发送。</div>
      </section>
      <div v-else class="empty-state"><span class="empty-state__icon"><MessageSquareText :size="20" /></span><strong>独享订单无拼车团消息</strong><p>该订单未创建拼车群聊。</p></div>
    </div>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button>
      <button v-if="!['已完成', '已取消'].includes(order.status)" class="btn btn--danger" type="button" @click="openCancelOrder">取消订单</button>
      <button v-if="!['已完成', '已取消'].includes(order.status)" class="btn btn--secondary" type="button" @click="openAdjustStatus">调整状态</button>
      <button v-if="!['已完成', '已取消'].includes(order.status)" class="btn btn--brand" type="button" @click="emit('dispatch', order)">{{ order.driverName ? '重新调度' : '调度司机' }}</button>
    </template>
  </DrawerShell>

  <ModalDialog v-if="adjustStatusOpen" title="调整订单状态" eyebrow="MANUAL OVERRIDE" @close="adjustStatusOpen = false">
    <p class="operation-copy">仅用于异常情况下强制修正；原因会写入订单操作记录。取消订单必须使用独立取消流程，以完整记录取消类型和退款。</p>
    <label class="form-label" for="next-order-status">目标状态</label>
    <select id="next-order-status" v-model="nextStatus" class="operation-select">
      <option value="待派单">待派单</option><option value="待出行">待出行</option><option value="接乘客">接乘客</option><option value="送乘客">送乘客</option><option value="已完成">已完成</option>
    </select>
    <label class="form-label operation-reason-label" for="adjust-reason">调整原因（必填）</label>
    <textarea id="adjust-reason" v-model="operationReason" class="form-textarea" placeholder="请输入强制调整原因"></textarea>
    <template #footer><button class="btn btn--secondary" type="button" @click="adjustStatusOpen = false">返回</button><button class="btn btn--primary" type="button" :disabled="!operationReason.trim() || nextStatus === order.status" @click="confirmAdjustStatus">确认调整</button></template>
  </ModalDialog>

  <ModalDialog v-if="cancelOrderOpen" title="取消订单" eyebrow="CANCEL ORDER" @close="cancelOrderOpen = false">
    <p class="operation-copy">取消将进入退款规则处理，并记录操作人与原因。</p>
    <label class="form-label" for="cancel-order-reason">取消原因（必填）</label>
    <textarea id="cancel-order-reason" v-model="operationReason" class="form-textarea" placeholder="请输入取消订单原因"></textarea>
    <template #footer><button class="btn btn--secondary" type="button" @click="cancelOrderOpen = false">返回</button><button class="btn btn--danger" type="button" :disabled="!operationReason.trim()" @click="confirmCancelOrder">确认取消并处理退款</button></template>
  </ModalDialog>
</template>

<style scoped>
.order-detail-head {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 13px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--page);
  gap: 10px;
}

.order-detail-head > div { display: flex; align-items: flex-start; flex-direction: column; gap: 6px; }
.order-detail-head > div > span:first-child { color: var(--text-faint); font-size: 9px; }
.order-price { color: var(--brand); font-family: var(--font-display); font-size: 14px; font-weight: 800; }
.order-price--pending { color: var(--text-faint); font-family: var(--font-body); font-size: 11px; }

.detail-tabs {
  display: flex;
  overflow-x: auto;
  padding-bottom: 6px;
  margin-bottom: 18px;
  gap: 4px;
  border-bottom: 1px solid var(--border);
}

.detail-tabs button {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 9px;
  gap: 5px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-faint);
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
}

.detail-tabs button:hover { background: var(--hover); color: var(--text-strong); }
.detail-tabs button.is-active { background: var(--ink-50); color: var(--ink-700); }
.detail-block { margin-bottom: 24px; }
.detail-block__heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; gap: 8px; }
.detail-block__heading h3 { margin: 0; color: var(--text-strong); font-family: var(--font-display); font-size: 14px; font-weight: 700; }
.text-danger { color: var(--danger) !important; }

.related-order-stack { display: grid; margin-bottom: 18px; gap: 8px; }

.related-order-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 14px;
  gap: 16px;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-lg);
  background: var(--ink-50);
}

.related-order-card > div { min-width: 0; }
.related-order-card span { display: block; color: var(--text-faint); font-size: 9px; }
.related-order-card strong { display: block; margin-top: 2px; color: var(--ink-700); font-family: var(--font-mono); font-size: 12px; }
.related-order-card p { margin: 4px 0 0; color: var(--text-muted); font-size: 9px; line-height: 1.5; }
.related-order-card button { display: inline-flex; align-items: center; min-height: 30px; flex: 0 0 auto; padding: 0 9px; gap: 4px; border: 1px solid var(--ink-200); border-radius: var(--radius-md); background: var(--surface); color: var(--ink-700); font-size: 9px; font-weight: 700; }
.related-order-card button:hover { border-color: var(--ink-400); }

.journey-row { display: flex; align-items: center; padding: 14px; margin-bottom: 14px; gap: 10px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.journey-pin { width: 10px; height: 10px; flex: 0 0 10px; border-radius: 50%; }
.journey-pin--start { background: var(--ink-700); box-shadow: 0 0 0 4px var(--ink-100); }
.journey-row small { display: block; color: var(--text-faint); font-size: 9px; }
.journey-row strong { display: block; margin-top: 2px; color: var(--text-strong); font-size: 12px; }

.detail-facts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 13px 18px; }
.detail-facts > div { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.detail-facts span, .route-stats span { color: var(--text-faint); font-size: 9px; }
.detail-facts strong, .route-stats strong {
  overflow: hidden;
  color: var(--text-subtle);
  font-size: 11px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fee-list { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-lg); }
.fee-list > div { display: flex; align-items: center; justify-content: space-between; min-height: 38px; padding: 0 12px; border-bottom: 1px solid var(--border); color: var(--text-muted); font-size: 10px; }
.fee-list > div:last-child { border-bottom: 0; }
.fee-list strong { color: var(--text-subtle); font-family: var(--font-mono); font-size: 10px; }
.fee-list__total { background: var(--ink-50); color: var(--ink-700) !important; font-weight: 700; }
.fee-list__total strong { color: var(--ink-700); font-size: 12px; }
.coupon-snapshot { padding: 10px 11px; margin-top: 8px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.coupon-snapshot > div { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.coupon-snapshot span { color: var(--text-faint); font-size: 9px; }
.coupon-snapshot strong { color: var(--text-subtle); font-size: 10px; }
.coupon-snapshot p { margin: 5px 0 0; color: var(--text-muted); font-size: 9px; }

.price-pending-notice { display: flex; align-items: flex-start; padding: 13px; margin-bottom: 24px; gap: 10px; border: 1px solid var(--ink-200); border-radius: var(--radius-lg); background: var(--ink-50); }
.price-pending-notice > span { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; flex: 0 0 34px; border-radius: 50%; background: var(--ink-100); color: var(--ink-600); }
.price-pending-notice strong { color: var(--text-strong); font-size: 11px; }
.price-pending-notice p { margin: 3px 0 0; color: var(--text-muted); font-size: 10px; }
.refund-notice { display: grid; grid-template-columns: 1fr auto; align-items: center; padding: 12px 13px; margin-bottom: 24px; border: 1px solid var(--warning-border); border-radius: var(--radius-lg); background: var(--warning-bg); gap: 4px 10px; }
.refund-notice strong { color: var(--text-strong); font-size: 11px; }
.refund-notice p { grid-column: 1 / -1; margin: 0; color: var(--text-muted); font-size: 10px; }
.refund-record { padding: 13px; margin-bottom: 24px; border: 1px solid var(--warning-border); border-radius: var(--radius-lg); background: var(--warning-bg); }
.refund-record__heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.refund-record__heading > div { display: flex; align-items: baseline; gap: 8px; }
.refund-record__heading span { color: var(--text-muted); font-size: 9px; }
.refund-record__heading strong { color: var(--text-strong); font-family: var(--font-display); font-size: 14px; }
.refund-record__facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding-top: 10px; margin-top: 10px; gap: 10px 14px; border-top: 1px solid var(--warning-border); }
.refund-record__facts > div { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.refund-record__facts span { color: var(--text-faint); font-size: 9px; }
.refund-record__facts strong { color: var(--text-subtle); font-size: 10px; }
.refund-record > p { margin: 10px 0 0; color: var(--text-muted); font-size: 9px; }

.tag-controls { display: flex; flex-wrap: wrap; gap: 7px; }
.tag-controls button { min-height: 30px; padding: 0 11px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--text-muted); font-size: 10px; font-weight: 700; }
.tag-controls button:hover { border-color: var(--ink-200); background: var(--ink-50); }
.tag-controls button.is-active { border-color: var(--ink-700); background: var(--ink-700); color: #fff; }

.operation-copy { margin: 0 0 16px; color: var(--text-muted); font-size: 12px; }
.operation-select { width: 100%; height: 40px; padding: 0 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); color: var(--text-subtle); }
.operation-reason-label { margin-top: 14px; }

.note-list { display: flex; flex-direction: column; margin-bottom: 10px; gap: 10px; }
.note-item { display: flex; align-items: flex-start; gap: 8px; }
.note-avatar { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; flex: 0 0 26px; border-radius: 50%; background: var(--ink-100); color: var(--ink-700); font-size: 9px; font-weight: 700; }
.note-item strong { display: block; color: var(--text-subtle); font-size: 10px; }
.note-item strong small { color: var(--text-faint); font-family: var(--font-mono); font-size: 8px; font-weight: 400; }
.note-item p { margin: 2px 0 0; color: var(--text-muted); font-size: 10px; }
.note-compose { display: flex; align-items: center; height: 38px; padding: 0 5px 0 10px; gap: 6px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.note-compose:focus-within { border-color: var(--ink-500); box-shadow: 0 0 0 3px rgba(45, 99, 152, 0.1); }
.note-compose input { min-width: 0; flex: 1; border: 0; outline: 0; background: transparent; color: var(--text); font-size: 10px; }
.note-compose button { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: var(--radius-sm); background: var(--ink-700); color: #fff; }

.passenger-list { display: flex; flex-direction: column; gap: 10px; }
.passenger-list article { padding: 13px; border: 1px solid var(--border); border-radius: var(--radius-lg); }
.passenger-head { display: flex; align-items: center; gap: 9px; }
.passenger-avatar { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; flex: 0 0 32px; border-radius: 50%; background: var(--brand-100); color: var(--brand-dark); font-family: var(--font-display); font-size: 11px; font-weight: 700; }
.passenger-head > div { min-width: 0; flex: 1; }
.passenger-head strong { display: block; color: var(--text-strong); font-size: 11px; }
.passenger-head small { display: block; color: var(--text-faint); font-family: var(--font-mono); font-size: 8px; }
.passenger-route { display: flex; align-items: center; margin: 12px 0 8px; gap: 7px; color: var(--text-muted); font-size: 9px; }
.passenger-route i { width: 16px; height: 1px; background: var(--divider); }
.passenger-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 5px 12px;
  color: var(--text-faint);
  font-size: 9px;
}

.driver-card { display: flex; align-items: flex-start; padding: 18px; gap: 13px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.driver-card__avatar { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; flex: 0 0 46px; border-radius: 50%; background: var(--ink-700); color: #fff; font-family: var(--font-display); font-size: 16px; font-weight: 800; }
.driver-card__avatar--empty { background: var(--ink-100); color: var(--ink-600); }
.driver-card h3 { margin: 3px 0 1px; color: var(--text-strong); font-family: var(--font-display); font-size: 15px; }
.driver-card p { margin: 0 0 10px; color: var(--text-faint); font-size: 10px; }
.driver-signals { display: flex; gap: 6px; }

.route-map { position: relative; height: 280px; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--ink-50); }
.route-map__grid { position: absolute; inset: 0; opacity: 0.7; background-image: linear-gradient(rgba(45, 99, 152, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(45, 99, 152, 0.08) 1px, transparent 1px); background-size: 32px 32px; transform: rotate(-8deg) scale(1.2); }
.route-map__zone { position: absolute; display: inline-flex; align-items: center; justify-content: center; width: 96px; height: 64px; border: 1px dashed var(--ink-400); border-radius: 50%; background: rgba(227, 237, 245, 0.75); color: var(--ink-600); font-size: 8px; }
.route-map__zone--start { top: 38px; left: 32px; }
.route-map__zone--end { right: 30px; bottom: 36px; border-color: rgba(245, 124, 0, 0.6); background: rgba(255, 243, 224, 0.78); color: var(--brand-dark); }
.route-map__track { position: absolute; top: 134px; left: 100px; width: calc(100% - 190px); height: 3px; border-radius: var(--radius-pill); background: var(--ink-600); transform: rotate(17deg); transform-origin: left center; }
.route-map__pin { position: absolute; width: 18px; height: 18px; border: 4px solid #fff; border-radius: 50%; box-shadow: var(--shadow-md); }
.route-map__pin--start { top: 74px; left: 74px; background: var(--ink-700); }
.route-map__pin--end { right: 71px; bottom: 69px; background: var(--brand); }
.route-map__car { position: absolute; top: 136px; left: 48%; display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 3px solid #fff; border-radius: 50%; background: var(--ink-700); color: #fff; box-shadow: var(--shadow-md); }
.route-stats { display: grid; grid-template-columns: 1.4fr 0.6fr; padding: 14px 0; gap: 14px; }
.route-stats > div { display: flex; min-width: 0; flex-direction: column; gap: 3px; }

.message-list { display: flex; flex-direction: column; gap: 12px; }
.message-list > div:not(.message-notice) { display: flex; align-items: flex-start; gap: 8px; }
.message-avatar { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; flex: 0 0 28px; border-radius: 50%; background: var(--brand-100); color: var(--brand-dark); font-size: 9px; font-weight: 700; }
.message-avatar--driver { background: var(--ink-100); color: var(--ink-700); }
.message-list p { max-width: 75%; padding: 9px 10px; margin: 0; border-radius: 4px 12px 12px; background: var(--page-2); color: var(--text-muted); font-size: 10px; }
.message-list p strong { display: block; margin-bottom: 3px; color: var(--text-strong); font-size: 9px; }
.message-list p small { color: var(--text-faint); font-family: var(--font-mono); font-size: 8px; font-weight: 400; }
.message-list p span { display: block; }
.message-notice { align-self: center; padding: 5px 10px; border-radius: var(--radius-pill); background: var(--page-2); color: var(--text-faint); font-size: 8px; }

@media (max-width: 540px) {
  .order-detail-head { grid-template-columns: 1fr; }
  .detail-facts { grid-template-columns: 1fr; }
  .related-order-card { align-items: flex-start; flex-direction: column; }
  .refund-record__facts { grid-template-columns: 1fr; }
}
</style>
