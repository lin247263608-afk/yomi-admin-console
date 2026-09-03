<script setup lang="ts">
import { AlertTriangle, BellRing, Check, Search, TicketCheck, Users } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{
  coupons: ModuleRow[]
  users: ModuleRow[]
}>()

const emit = defineEmits<{
  close: []
  grant: [payload: { couponId: string; userIds: string[]; quantity: number }]
}>()

type UserQuery = { userId: string; phone: string; registeredFrom: string; registeredTo: string }
const emptyQuery = (): UserQuery => ({ userId: '', phone: '', registeredFrom: '', registeredTo: '' })
const searchDraft = reactive<UserQuery>(emptyQuery())
const searchApplied = reactive<UserQuery>(emptyQuery())
const selectedUserIds = ref<string[]>([])
const selectedCouponId = ref('')
const quantity = ref(1)
const validationError = ref('')

const enabledCoupons = computed(() => props.coupons.filter((coupon) => coupon.status === '启用'))
const selectedCoupon = computed(() => enabledCoupons.value.find((coupon) => coupon.id === selectedCouponId.value) ?? null)
const remaining = computed(() => selectedCoupon.value
  ? Math.max(0, Number(selectedCoupon.value.totalQuantity ?? 0) - Number(selectedCoupon.value.issuedQuantity ?? 0))
  : 0)
const totalGrant = computed(() => selectedUserIds.value.length * Number(quantity.value || 0))
const filteredUsers = computed(() => props.users.filter((user) => {
  const registeredDate = String(user.registeredAt ?? '').slice(0, 10)
  const textMatches = (value: unknown, query: string) => !query.trim()
    || String(value ?? '').toLowerCase().includes(query.trim().toLowerCase())
  return textMatches(user.id, searchApplied.userId)
    && textMatches(user.phone, searchApplied.phone)
    && (!searchApplied.registeredFrom || registeredDate >= searchApplied.registeredFrom)
    && (!searchApplied.registeredTo || registeredDate <= searchApplied.registeredTo)
}))
const allVisibleSelected = computed(() => filteredUsers.value.length > 0
  && filteredUsers.value.every((user) => selectedUserIds.value.includes(user.id)))

watch(enabledCoupons, (coupons) => {
  if (!coupons.some((coupon) => coupon.id === selectedCouponId.value)) selectedCouponId.value = coupons[0]?.id ?? ''
}, { immediate: true })

function applySearch() {
  if (searchDraft.registeredFrom && searchDraft.registeredTo && searchDraft.registeredFrom > searchDraft.registeredTo) {
    validationError.value = '注册开始日期不能晚于注册结束日期。'
    return
  }
  Object.assign(searchApplied, searchDraft)
  validationError.value = ''
}

function resetSearch() {
  Object.assign(searchDraft, emptyQuery())
  Object.assign(searchApplied, emptyQuery())
  selectedUserIds.value = []
  validationError.value = ''
}

function toggleUser(userId: string) {
  const index = selectedUserIds.value.indexOf(userId)
  if (index >= 0) selectedUserIds.value.splice(index, 1)
  else selectedUserIds.value.push(userId)
  validationError.value = ''
}

function toggleVisibleUsers() {
  if (allVisibleSelected.value) {
    const visibleIds = new Set(filteredUsers.value.map((user) => user.id))
    selectedUserIds.value = selectedUserIds.value.filter((id) => !visibleIds.has(id))
  } else {
    selectedUserIds.value = [...new Set([...selectedUserIds.value, ...filteredUsers.value.map((user) => user.id)])]
  }
  validationError.value = ''
}

function confirmGrant() {
  if (!selectedUserIds.value.length) validationError.value = '请至少勾选 1 名目标用户。'
  else if (!selectedCoupon.value) validationError.value = '请选择一张已启用的优惠券。'
  else if (!Number.isInteger(quantity.value) || Number(quantity.value) < 1) validationError.value = '每人发放数量必须是大于 0 的整数。'
  else if (totalGrant.value > remaining.value) validationError.value = `本次共需 ${totalGrant.value} 张，超过剩余可发数量 ${remaining.value} 张。`
  else validationError.value = ''
  if (validationError.value || !selectedCoupon.value) return
  emit('grant', { couponId: selectedCoupon.value.id, userIds: [...selectedUserIds.value], quantity: Number(quantity.value) })
}
</script>

<template>
  <ModalDialog title="优惠券定向发放" eyebrow="TARGETED COUPON GRANT" size="wide" @close="emit('close')">
    <div class="grant-flow" aria-label="定向发放流程">
      <div class="is-active"><span>1</span><strong>选择用户</strong></div><i></i>
      <div :class="{ 'is-active': selectedUserIds.length }"><span>2</span><strong>关联优惠券</strong></div><i></i>
      <div :class="{ 'is-active': selectedCouponId && quantity > 0 }"><span>3</span><strong>校验并发放</strong></div><i></i>
      <div><span><BellRing :size="12" /></span><strong>推送通知</strong></div>
    </div>

    <section class="grant-section">
      <header><span><Users :size="16" /></span><div><strong>搜索并勾选目标用户</strong><p>支持按用户ID、手机号与注册时间范围检索。</p></div><b>已选 {{ selectedUserIds.length }} 人</b></header>
      <div class="grant-user-filter" @keyup.enter="applySearch">
        <label><span>用户ID</span><input v-model="searchDraft.userId" class="field-control" type="search" placeholder="请输入用户ID" /></label>
        <label><span>手机号</span><input v-model="searchDraft.phone" class="field-control" type="search" placeholder="请输入手机号" /></label>
        <label><span>注册开始日期</span><input v-model="searchDraft.registeredFrom" class="field-control" type="date" /></label>
        <label><span>注册结束日期</span><input v-model="searchDraft.registeredTo" class="field-control" type="date" /></label>
        <button class="btn btn--brand" type="button" @click="applySearch"><Search :size="14" />搜索</button>
        <button class="btn btn--ghost" type="button" @click="resetSearch">重置</button>
      </div>
      <div class="grant-user-table">
        <table>
          <thead><tr><th><input type="checkbox" :checked="allVisibleSelected" aria-label="全选当前结果" @change="toggleVisibleUsers" /></th><th>用户ID</th><th>用户</th><th>手机号</th><th>注册时间</th><th>状态</th></tr></thead>
          <tbody><tr v-for="user in filteredUsers" :key="user.id" :class="{ 'is-selected': selectedUserIds.includes(user.id) }" @click="toggleUser(user.id)"><td><input type="checkbox" :checked="selectedUserIds.includes(user.id)" :aria-label="`选择${String(user.name)}`" @click.stop="toggleUser(user.id)" /></td><td class="mono">{{ user.id }}</td><td><strong>{{ user.name }}</strong><small>{{ user.englishName }}</small></td><td>{{ user.phone }}</td><td class="mono">{{ user.registeredAt }}</td><td><StatusBadge :label="String(user.status ?? '—')" :tone="user.status === '正常' ? 'success' : 'danger'" dot /></td></tr></tbody>
        </table>
        <div v-if="!filteredUsers.length" class="grant-empty">没有匹配的用户，请调整搜索条件。</div>
      </div>
    </section>

    <section class="grant-section">
      <header><span><TicketCheck :size="16" /></span><div><strong>关联已启用优惠券并设置数量</strong><p>选择目标券后，系统按已配置总量实时校验剩余可发数量。</p></div></header>
      <div class="grant-coupon-controls">
        <label class="grant-coupon-select"><span>已启用优惠券</span><select v-model="selectedCouponId" class="field-control"><option v-if="!enabledCoupons.length" value="">暂无可发优惠券</option><option v-for="coupon in enabledCoupons" :key="coupon.id" :value="coupon.id">{{ coupon.id }} · {{ coupon.name }}</option></select></label>
        <label><span>每人发放数量</span><input v-model.number="quantity" class="field-control" type="number" min="1" step="1" /></label>
        <article><span>目标用户</span><strong>{{ selectedUserIds.length }} 人</strong></article>
        <article><span>本次发放</span><strong>{{ totalGrant }} 张</strong></article>
        <article :class="{ 'is-short': totalGrant > remaining }"><span>剩余可发</span><strong>{{ remaining.toLocaleString('en-GB') }} 张</strong></article>
      </div>
      <div v-if="selectedCoupon" class="grant-coupon-preview"><div><span>{{ selectedCoupon.couponType }} · {{ selectedCoupon.service }}</span><strong>{{ selectedCoupon.name }}</strong><p>{{ selectedCoupon.content }} · 有效期 {{ selectedCoupon.validity }}</p></div><StatusBadge :label="String(selectedCoupon.status)" tone="success" dot /></div>
    </section>

    <p v-if="validationError" class="grant-error"><AlertTriangle :size="15" />{{ validationError }}</p>
    <p class="grant-notice"><BellRing :size="15" />确认后将生成单张券码写入发放记录，并向所有目标用户发送优惠券到账通知。</p>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">取消</button>
      <button class="btn btn--brand" type="button" @click="confirmGrant"><Check :size="14" />确认发放 {{ totalGrant || '' }}<template v-if="totalGrant"> 张</template></button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.grant-flow { display: flex; align-items: center; padding: 12px 14px; margin-bottom: 16px; border-radius: var(--radius-lg); background: var(--ink-900); }
.grant-flow > div { display: flex; align-items: center; gap: 7px; color: var(--ink-300); }
.grant-flow > div > span { display: grid; width: 24px; height: 24px; place-items: center; border: 1px solid rgba(255,255,255,.16); border-radius: 50%; font-family: var(--font-mono); font-size: 9px; }
.grant-flow > div strong { font-size: 9px; white-space: nowrap; }
.grant-flow > div.is-active { color: #fff; }
.grant-flow > div.is-active > span { border-color: var(--brand-light); background: var(--brand); }
.grant-flow > i { height: 1px; flex: 1; margin: 0 10px; background: rgba(255,255,255,.14); }
.grant-section { padding: 15px; margin-top: 12px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: #fff; }
.grant-section > header { display: flex; align-items: center; margin-bottom: 12px; gap: 9px; }
.grant-section > header > span { display: grid; width: 32px; height: 32px; flex: none; place-items: center; border-radius: 10px; background: var(--brand-soft); color: var(--brand-dark); }
.grant-section > header > div { min-width: 0; flex: 1; }
.grant-section > header strong { display: block; color: var(--text-strong); font-size: 10px; }
.grant-section > header p { margin: 2px 0 0; color: var(--text-faint); font-size: 8px; }
.grant-section > header > b { color: var(--brand-dark); font-size: 9px; }
.grant-user-filter { display: grid; grid-template-columns: 1fr 1.15fr 1fr 1fr auto auto; align-items: end; gap: 8px; }
.grant-user-filter label, .grant-coupon-controls label { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.grant-user-filter label > span, .grant-coupon-controls label > span, .grant-coupon-controls article span { color: var(--text-faint); font-size: 8px; font-weight: 700; }
.grant-user-filter .field-control, .grant-coupon-controls .field-control { width: 100%; }
.grant-user-table { overflow: auto; max-height: 210px; margin-top: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); }
.grant-user-table table { width: 100%; border-collapse: collapse; font-size: 9px; }
.grant-user-table th { padding: 8px 10px; background: var(--table-head); color: var(--text-faint); text-align: left; white-space: nowrap; }
.grant-user-table td { padding: 9px 10px; border-top: 1px solid var(--border); color: var(--text-subtle); }
.grant-user-table tbody tr { cursor: pointer; }
.grant-user-table tbody tr:hover, .grant-user-table tbody tr.is-selected { background: #fffaf3; }
.grant-user-table td strong, .grant-user-table td small { display: block; }
.grant-user-table td small { margin-top: 2px; color: var(--text-faint); }
.grant-empty { padding: 22px; color: var(--text-faint); font-size: 9px; text-align: center; }
.grant-coupon-controls { display: grid; grid-template-columns: minmax(240px, 2fr) minmax(110px, .7fr) repeat(3, minmax(95px, .65fr)); align-items: end; gap: 10px; }
.grant-coupon-controls article { min-height: 36px; padding: 7px 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.grant-coupon-controls article strong { display: block; margin-top: 2px; color: var(--text-strong); font-family: var(--font-mono); font-size: 11px; }
.grant-coupon-controls article.is-short { border-color: #fecaca; background: #fff1f2; }
.grant-coupon-controls article.is-short strong { color: #dc2626; }
.grant-coupon-preview { display: flex; align-items: center; justify-content: space-between; padding: 11px 12px; margin-top: 11px; gap: 12px; border-radius: var(--radius-md); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }
.grant-coupon-preview span { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; }
.grant-coupon-preview strong { display: block; margin-top: 3px; font-size: 11px; }
.grant-coupon-preview p { margin: 2px 0 0; color: var(--ink-300); font-size: 8px; }
.grant-error, .grant-notice { display: flex; align-items: center; padding: 10px 12px; margin: 12px 0 0; gap: 7px; border-radius: var(--radius-md); font-size: 9px; }
.grant-error { background: #fff1f2; color: #dc2626; }
.grant-notice { background: #eff6ff; color: #1d4ed8; }
@media (max-width: 900px) { .grant-user-filter { grid-template-columns: repeat(2, minmax(0, 1fr)); } .grant-coupon-controls { grid-template-columns: repeat(3, minmax(0, 1fr)); } .grant-coupon-select { grid-column: span 2; } }
@media (max-width: 560px) { .grant-flow strong { display: none; } .grant-user-filter, .grant-coupon-controls { grid-template-columns: 1fr; } .grant-coupon-select { grid-column: span 1; } }
</style>
