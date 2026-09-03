<script setup lang="ts">
import { AlertTriangle, Check, Info } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

import ContentLanguageTabs, { type ContentLanguage } from '@/components/forms/ContentLanguageTabs.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{
  row: ModuleRow | null
  rows: ModuleRow[]
}>()

const emit = defineEmits<{
  close: []
  save: [row: ModuleRow]
}>()

const name = ref('')
const nameEn = ref('')
const contentLanguage = ref<ContentLanguage>('zh')
const couponType = ref<'满减' | '折扣'>('满减')
const service = ref<'拼车' | '独享'>('拼车')
const thresholdAmount = ref<number | null>(null)
const discountAmount = ref<number | null>(null)
const discountRate = ref<number | null>(null)
const maxDiscountAmount = ref<number | null>(null)
const totalQuantity = ref<number | null>(null)
const validFrom = ref('')
const validTo = ref('')
const validationError = ref('')

const issuedQuantity = computed(() => Number(props.row?.issuedQuantity ?? 0))
const hasIssuedRecords = computed(() => Boolean(props.row) && issuedQuantity.value > 0)
const coreFieldsLocked = computed(() => hasIssuedRecords.value)
const remainingQuantity = computed(() => Math.max(0, Number(totalQuantity.value ?? 0) - issuedQuantity.value))

function initialize() {
  name.value = String(props.row?.name ?? '')
  nameEn.value = String(props.row?.nameEn ?? '')
  contentLanguage.value = 'zh'
  couponType.value = props.row?.couponType === '折扣' ? '折扣' : '满减'
  service.value = props.row?.service === '独享' ? '独享' : '拼车'
  thresholdAmount.value = props.row?.thresholdAmount == null ? null : Number(props.row.thresholdAmount)
  discountAmount.value = props.row?.discountAmount == null ? null : Number(props.row.discountAmount)
  discountRate.value = props.row?.discountRate == null ? null : Number(props.row.discountRate)
  maxDiscountAmount.value = props.row?.maxDiscountAmount == null ? null : Number(props.row.maxDiscountAmount)
  totalQuantity.value = props.row?.totalQuantity == null ? 1000 : Number(props.row.totalQuantity)
  validFrom.value = String(props.row?.validFrom ?? '')
  validTo.value = String(props.row?.validTo ?? '')
  validationError.value = ''
}

watch(() => props.row, initialize, { immediate: true })

function money(value: number) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)
}

const rulePreview = computed(() => {
  if (couponType.value === '满减') {
    if (!Number.isFinite(thresholdAmount.value) || !Number.isFinite(discountAmount.value)) return '请填写起用金额与抵扣金额'
    return `订单满 ${money(Number(thresholdAmount.value))} 减 ${money(Number(discountAmount.value))}`
  }
  if (!Number.isFinite(discountRate.value) || !Number.isFinite(maxDiscountAmount.value)) return '请填写折扣与最高抵扣金额'
  return `${discountRate.value} 折，单笔最高抵扣 ${money(Number(maxDiscountAmount.value))}`
})

function validate() {
  const trimmedName = name.value.trim()
  if (!trimmedName) return '请输入券名。'
  if (!nameEn.value.trim()) return '请输入英文券名。'
  if (props.rows.some((row) => row.id !== props.row?.id && String(row.name ?? '').trim().toLowerCase() === trimmedName.toLowerCase())) return '券名已存在，请使用其他名称。'
  if (!validFrom.value || !validTo.value) return '请选择完整的有效期范围。'
  if (validFrom.value > validTo.value) return '有效期开始日期不能晚于结束日期。'
  if (!Number.isInteger(totalQuantity.value) || Number(totalQuantity.value) < 1) return '发放数量必须是大于 0 的整数。'
  if (Number(totalQuantity.value) < issuedQuantity.value) return `发放数量不能小于已发放数量 ${issuedQuantity.value}。`
  if (couponType.value === '满减') {
    const threshold = Number(thresholdAmount.value)
    const discount = Number(discountAmount.value)
    if (!Number.isFinite(threshold) || threshold <= 0) return '起用金额必须大于 £0。'
    if (!Number.isFinite(discount) || discount <= 0) return '抵扣金额必须大于 £0。'
    if (discount >= threshold) return '抵扣金额必须小于起用金额。'
  } else {
    const rate = Number(discountRate.value)
    const maximum = Number(maxDiscountAmount.value)
    if (!Number.isFinite(rate) || rate < 0.1 || rate > 9.9) return '折扣必须在 0.1–9.9 之间。'
    if (!Number.isFinite(maximum) || maximum <= 0) return '最高抵扣金额必须大于 £0。'
  }
  return ''
}

function save() {
  validationError.value = validate()
  if (validationError.value) return

  const redeemedQuantity = Number(props.row?.redeemedQuantity ?? 0)
  const issued = issuedQuantity.value
  const isFullReduction = couponType.value === '满减'
  const threshold = isFullReduction ? Number(thresholdAmount.value) : null
  const discount = isFullReduction ? Number(discountAmount.value) : null
  const rate = isFullReduction ? null : Number(discountRate.value)
  const maximum = isFullReduction ? null : Number(maxDiscountAmount.value)
  emit('save', {
    id: props.row?.id ?? `CPN-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${String(props.rows.length + 1).padStart(2, '0')}`,
    name: name.value.trim(),
    nameEn: nameEn.value.trim(),
    couponType: couponType.value,
    thresholdAmount: threshold,
    discountAmount: discount,
    discountRate: rate,
    maxDiscountAmount: maximum,
    content: isFullReduction ? `满 £${threshold} 减 £${discount}` : `${rate} 折`,
    maxDiscount: isFullReduction ? '—' : `£${maximum}`,
    service: service.value,
    validFrom: validFrom.value,
    validTo: validTo.value,
    validity: `${validFrom.value} — ${validTo.value}`,
    totalQuantity: Number(totalQuantity.value),
    issuedQuantity: issued,
    redeemedQuantity,
    redemption: `${redeemedQuantity.toLocaleString('en-GB')} / ${issued.toLocaleString('en-GB')}`,
    status: String(props.row?.status ?? '启用'),
  })
}
</script>

<template>
  <ModalDialog :title="row ? `编辑优惠券 · ${row.id}` : '新增优惠券'" eyebrow="COUPON EDITOR" size="wide" @close="emit('close')">
    <section v-if="hasIssuedRecords" class="coupon-lock-notice">
      <AlertTriangle :size="18" />
      <div><strong>该券已有 {{ issuedQuantity.toLocaleString('en-GB') }} 张发放记录</strong><p>类型、金额/折扣、使用服务、发放总量和有效期开始时间已锁定，仅可修改券名与有效期结束时间。</p></div>
    </section>

    <ContentLanguageTabs v-model="contentLanguage" />
    <div class="coupon-localized-field">
      <label class="coupon-field"><span>{{ contentLanguage === 'zh' ? '券名（中文）' : 'Coupon name (English)' }} <em>*</em></span><input v-if="contentLanguage === 'zh'" v-model="name" class="field-control" type="text" maxlength="50" placeholder="请输入 App 展示的中文券名" /><input v-else v-model="nameEn" class="field-control" type="text" maxlength="80" placeholder="Enter the coupon name shown in the App" /></label>
    </div>
    <div class="coupon-form-grid">
      <label class="coupon-field"><span>券类型 <em>*</em></span><select v-model="couponType" class="field-control" :disabled="coreFieldsLocked"><option value="满减">满减</option><option value="折扣">折扣</option></select></label>
      <label class="coupon-field"><span>使用服务 <em>*</em></span><select v-model="service" class="field-control" :disabled="coreFieldsLocked"><option value="拼车">拼车</option><option value="独享">独享</option></select></label>

      <template v-if="couponType === '满减'">
        <label class="coupon-field"><span>起用金额（满） <em>*</em></span><div class="money-control"><b>£</b><input v-model.number="thresholdAmount" type="number" min="0.01" step="0.01" :disabled="coreFieldsLocked" placeholder="50.00" /></div></label>
        <label class="coupon-field"><span>抵扣金额 <em>*</em></span><div class="money-control"><b>£</b><input v-model.number="discountAmount" type="number" min="0.01" step="0.01" :disabled="coreFieldsLocked" placeholder="8.00" /></div></label>
      </template>
      <template v-else>
        <label class="coupon-field"><span>折扣 <em>*</em></span><div class="suffix-control"><input v-model.number="discountRate" type="number" min="0.1" max="9.9" step="0.1" :disabled="coreFieldsLocked" placeholder="9.0" /><b>折</b></div></label>
        <label class="coupon-field"><span>最高抵扣金额 <em>*</em></span><div class="money-control"><b>£</b><input v-model.number="maxDiscountAmount" type="number" min="0.01" step="0.01" :disabled="coreFieldsLocked" placeholder="12.00" /></div></label>
      </template>

      <label class="coupon-field"><span>发放数量 <em>*</em></span><input v-model.number="totalQuantity" class="field-control" type="number" min="1" step="1" :disabled="coreFieldsLocked" placeholder="请输入计划发放总量" /><small v-if="row">已发 {{ issuedQuantity.toLocaleString('en-GB') }}，剩余 {{ remainingQuantity.toLocaleString('en-GB') }}</small></label>
      <label class="coupon-field"><span>有效期开始 <em>*</em></span><input v-model="validFrom" class="field-control" type="date" :disabled="coreFieldsLocked" /></label>
      <label class="coupon-field"><span>有效期结束 <em>*</em></span><input v-model="validTo" class="field-control" type="date" /></label>
    </div>

    <section class="coupon-rule-preview"><Info :size="17" /><div><span>规则预览</span><strong>{{ rulePreview }}</strong><p>每单限用 1 张；优惠由平台承担，司机仍按优惠前金额结算。</p></div></section>
    <p v-if="validationError" class="coupon-error"><AlertTriangle :size="15" />{{ validationError }}</p>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">取消</button>
      <button class="btn btn--brand" type="button" @click="save"><Check :size="14" />确认保存</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.coupon-lock-notice { display: flex; align-items: flex-start; padding: 13px 14px; margin-bottom: 16px; gap: 10px; border: 1px solid #fed7aa; border-radius: var(--radius-md); background: #fff7ed; color: #c2410c; }
.coupon-lock-notice svg { flex: none; margin-top: 1px; }
.coupon-lock-notice strong { display: block; font-size: 10px; }
.coupon-lock-notice p { margin: 3px 0 0; font-size: 9px; line-height: 1.55; }
.coupon-form-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.coupon-localized-field { padding: 12px; margin: 10px 0 14px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.coupon-field { display: flex; min-width: 0; flex-direction: column; gap: 6px; }
.coupon-field--wide { grid-column: span 2; }
.coupon-field > span { color: var(--text-subtle); font-size: 9px; font-weight: 750; }
.coupon-field em { color: var(--brand); font-style: normal; }
.coupon-field .field-control { width: 100%; }
.coupon-field small { color: var(--text-faint); font-size: 8px; }
.money-control, .suffix-control { display: flex; overflow: hidden; min-height: 36px; align-items: stretch; border: 1px solid var(--border); border-radius: var(--radius-md); background: #fff; }
.money-control:focus-within, .suffix-control:focus-within { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(255,126,0,.1); }
.money-control b, .suffix-control b { display: grid; min-width: 34px; place-items: center; background: var(--page); color: var(--text-faint); font-size: 9px; }
.money-control input, .suffix-control input { min-width: 0; flex: 1; padding: 0 10px; border: 0; outline: 0; color: var(--text-strong); font: inherit; }
.money-control input:disabled, .suffix-control input:disabled { background: #f5f7f8; color: var(--text-faint); }
.coupon-rule-preview { display: flex; align-items: flex-start; padding: 14px; margin-top: 16px; gap: 10px; border-radius: var(--radius-md); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }
.coupon-rule-preview svg { flex: none; color: var(--brand-light); }
.coupon-rule-preview span { display: block; color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; letter-spacing: .08em; }
.coupon-rule-preview strong { display: block; margin-top: 4px; font-size: 11px; }
.coupon-rule-preview p { margin: 3px 0 0; color: var(--ink-300); font-size: 9px; }
.coupon-error { display: flex; align-items: center; padding: 10px 12px; margin: 12px 0 0; gap: 7px; border-radius: var(--radius-md); background: #fff1f2; color: #dc2626; font-size: 9px; }
@media (max-width: 760px) { .coupon-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 520px) { .coupon-form-grid { grid-template-columns: 1fr; } .coupon-field--wide { grid-column: span 1; } }
</style>
