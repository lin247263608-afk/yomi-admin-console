<script setup lang="ts">
import { AlertTriangle, Check, Info, ShieldCheck } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{
  row: ModuleRow | null
  rows: ModuleRow[]
  coupons: ModuleRow[]
}>()

const emit = defineEmits<{
  close: []
  save: [row: ModuleRow]
}>()

const name = ref('')
const campaignType = ref<'新用户优惠券奖励' | '分享优惠券奖励'>('新用户优惠券奖励')
const couponId = ref('')
const validFrom = ref('')
const validTo = ref('')
const validationError = ref('')

const enabledCoupons = computed(() => props.coupons.filter((coupon) => coupon.status === '启用'))
const selectedCoupon = computed(() => enabledCoupons.value.find((coupon) => coupon.id === couponId.value) ?? null)
const isNewUserCampaign = computed(() => campaignType.value === '新用户优惠券奖励')
const triggerRule = computed(() => isNewUserCampaign.value ? '首次 APP 登录成功' : '被分享者首次 APP 登录成功')
const recipient = computed(() => isNewUserCampaign.value ? '新用户本人' : '分享者')

function initialize() {
  name.value = String(props.row?.name ?? '')
  campaignType.value = props.row?.campaignType === '分享优惠券奖励' ? '分享优惠券奖励' : '新用户优惠券奖励'
  couponId.value = String(props.row?.couponId ?? enabledCoupons.value[0]?.id ?? '')
  validFrom.value = String(props.row?.validFrom ?? '')
  validTo.value = String(props.row?.validTo ?? '')
  validationError.value = ''
}

watch([() => props.row, enabledCoupons], initialize, { immediate: true })

function save() {
  const trimmedName = name.value.trim()
  if (!trimmedName) validationError.value = '请输入活动名。'
  else if (props.rows.some((row) => row.id !== props.row?.id && String(row.name ?? '').trim().toLowerCase() === trimmedName.toLowerCase())) validationError.value = '活动名已存在，请使用其他名称。'
  else if (!validFrom.value || !validTo.value) validationError.value = '请选择完整的有效期范围。'
  else if (validFrom.value > validTo.value) validationError.value = '有效期开始日期不能晚于结束日期。'
  else if (!selectedCoupon.value) validationError.value = '请选择一张当前已启用的优惠券。'
  else validationError.value = ''
  if (validationError.value || !selectedCoupon.value) return

  emit('save', {
    id: props.row?.id ?? `ACT-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${String(props.rows.length + 1).padStart(2, '0')}`,
    name: trimmedName,
    campaignType: campaignType.value,
    couponId: selectedCoupon.value.id,
    coupon: selectedCoupon.value.name ?? selectedCoupon.value.id,
    validFrom: validFrom.value,
    validTo: validTo.value,
    validity: `${validFrom.value} — ${validTo.value}`,
    triggerRule: triggerRule.value,
    recipient: recipient.value,
    triggered: props.row?.triggered ?? '—',
    granted: props.row?.granted ?? '—',
    status: String(props.row?.status ?? '下架'),
  })
}
</script>

<template>
  <ModalDialog :title="row ? `编辑活动 · ${row.id}` : '新增活动'" eyebrow="CAMPAIGN EDITOR" size="wide" @close="emit('close')">
    <section class="campaign-editor-note"><Info :size="17" /><div><strong>活动保存后默认处于下架状态</strong><p>只有下架活动支持编辑与删除；上架后状态将根据有效期自动推导为待开始、进行中或已结束。</p></div></section>

    <div class="campaign-form-grid">
      <label class="campaign-field campaign-field--wide"><span>活动名 <em>*</em></span><input v-model="name" class="field-control" type="text" maxlength="50" placeholder="请输入活动名称" /></label>
      <label class="campaign-field"><span>活动类型 <em>*</em></span><select v-model="campaignType" class="field-control"><option value="新用户优惠券奖励">新用户优惠券奖励</option><option value="分享优惠券奖励">分享优惠券奖励</option></select></label>
      <label class="campaign-field campaign-field--wide"><span>关联优惠券 <em>*</em></span><select v-model="couponId" class="field-control"><option v-if="!enabledCoupons.length" value="">暂无已启用优惠券</option><option v-for="coupon in enabledCoupons" :key="coupon.id" :value="coupon.id">{{ coupon.id }} · {{ coupon.name }}（{{ coupon.content }}）</option></select><small>仅支持关联状态为“启用”的优惠券</small></label>
      <label class="campaign-field"><span>有效期开始 <em>*</em></span><input v-model="validFrom" class="field-control" type="date" /></label>
      <label class="campaign-field"><span>有效期结束 <em>*</em></span><input v-model="validTo" class="field-control" type="date" /></label>
    </div>

    <section class="campaign-rule-card">
      <header><ShieldCheck :size="16" /><div><span>触发规则预览</span><strong>{{ campaignType }}</strong></div></header>
      <div class="campaign-rule-grid">
        <article><span>发放触发</span><strong>{{ triggerRule }}</strong></article>
        <article><span>得券方</span><strong>{{ recipient }}</strong></article>
        <article><span>设备防刷</span><strong>同设备标识仅触发一次</strong></article>
        <article><span>总量约束</span><strong>受关联券剩余可发数量限制</strong></article>
      </div>
      <p v-if="!isNewUserCampaign">分享奖励单向发给分享者；被分享者仅通过同时进行的新用户活动获得新用户券。</p>
      <p v-else>首次 APP 登录按账号维度判断，与注册来源无关；先通过小程序注册后首次登录 APP 仍可触发。</p>
    </section>

    <p v-if="validationError" class="campaign-error"><AlertTriangle :size="15" />{{ validationError }}</p>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">取消</button>
      <button class="btn btn--brand" type="button" @click="save"><Check :size="14" />确认保存</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.campaign-editor-note { display: flex; align-items: flex-start; padding: 12px 14px; margin-bottom: 16px; gap: 9px; border-radius: var(--radius-md); background: #eff6ff; color: #1d4ed8; }
.campaign-editor-note svg { flex: none; margin-top: 1px; }
.campaign-editor-note strong { display: block; font-size: 10px; }
.campaign-editor-note p { margin: 3px 0 0; font-size: 9px; }
.campaign-form-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.campaign-field { display: flex; min-width: 0; flex-direction: column; gap: 6px; }
.campaign-field--wide { grid-column: span 2; }
.campaign-field > span { color: var(--text-subtle); font-size: 9px; font-weight: 750; }
.campaign-field em { color: var(--brand); font-style: normal; }
.campaign-field .field-control { width: 100%; }
.campaign-field small { color: var(--text-faint); font-size: 8px; }
.campaign-rule-card { padding: 15px; margin-top: 17px; border-radius: var(--radius-lg); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }
.campaign-rule-card > header { display: flex; align-items: center; gap: 9px; }
.campaign-rule-card > header svg { color: var(--brand-light); }
.campaign-rule-card > header span { display: block; color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; }
.campaign-rule-card > header strong { display: block; margin-top: 2px; font-size: 11px; }
.campaign-rule-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 12px; gap: 8px; }
.campaign-rule-grid article { padding: 10px; border: 1px solid rgba(255,255,255,.12); border-radius: var(--radius-md); background: rgba(255,255,255,.05); }
.campaign-rule-grid span { display: block; color: var(--ink-300); font-size: 8px; }
.campaign-rule-grid strong { display: block; margin-top: 4px; font-size: 9px; line-height: 1.45; }
.campaign-rule-card > p { margin: 11px 0 0; color: var(--ink-300); font-size: 8px; line-height: 1.55; }
.campaign-error { display: flex; align-items: center; padding: 10px 12px; margin: 12px 0 0; gap: 7px; border-radius: var(--radius-md); background: #fff1f2; color: #dc2626; font-size: 9px; }
@media (max-width: 720px) { .campaign-form-grid, .campaign-rule-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 480px) { .campaign-form-grid, .campaign-rule-grid { grid-template-columns: 1fr; } .campaign-field--wide { grid-column: span 1; } }
</style>
