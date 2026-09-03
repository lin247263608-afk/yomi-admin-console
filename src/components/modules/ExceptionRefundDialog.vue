<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AlertCircle, ArrowLeft, ShieldCheck } from '@lucide/vue'

import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: []; submit: [payload: { amount: number; reason: string; note: string }] }>()

const amount = ref(Number(props.row.pendingAmount ?? 0))
const reason = ref('')
const note = ref('')
const error = ref('')
const confirming = ref(false)
const reasons = ['乘客未出现', '航班延误', '航班取消', '司机原因', '平台原因', '其他']
const money = (value: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)
const maximum = computed(() => Number(props.row.pendingAmount ?? 0))

watch([amount, reason, note], () => { error.value = ''; confirming.value = false })

function requestConfirm() {
  if (!Number.isFinite(amount.value) || amount.value <= 0 || amount.value > maximum.value) {
    error.value = `退款金额必须大于 £0.00，且不能超过 ${money(maximum.value)}。`
    return
  }
  if (!reason.value) {
    error.value = '请选择退款原因。'
    return
  }
  confirming.value = true
}
</script>

<template>
  <ModalDialog :title="confirming ? '二次确认人工退款' : `人工退款 · ${row.id}`" eyebrow="STRIPE REFUND" @close="emit('close')">
    <template v-if="!confirming">
      <section class="refund-summary"><div><span>异常乘客</span><strong>{{ row.passenger }}</strong></div><div><span>可退款上限</span><strong>{{ money(maximum) }}</strong></div></section>
      <div class="refund-form">
        <label><span>退款金额（GBP）<b>*</b></span><input v-model.number="amount" type="number" min="0.01" :max="maximum" step="0.01" /></label>
        <label><span>退款原因<b>*</b></span><select v-model="reason"><option value="" disabled>请选择退款原因</option><option v-for="item in reasons" :key="item" :value="item">{{ item }}</option></select></label>
        <label class="is-wide"><span>备注</span><textarea v-model="note" rows="3" placeholder="选填，记录核实经过或补充说明"></textarea></label>
      </div>
      <p v-if="error" class="refund-error"><AlertCircle :size="14" />{{ error }}</p>
      <p class="refund-tip">退款成功后，该乘客订单转为已退款并推送通知；司机仍按原始订单金额结算。</p>
    </template>
    <section v-else class="refund-confirm">
      <span><ShieldCheck :size="27" /></span><h3>确认提交 Stripe Refund？</h3><p>将向 {{ row.passenger }} 退款 <strong>{{ money(amount) }}</strong>，原因为“{{ reason }}”。提交后当前异常订单将标记为已处理。</p>
    </section>
    <template #footer>
      <button v-if="confirming" class="btn btn--secondary" type="button" @click="confirming = false"><ArrowLeft :size="14" />返回修改</button>
      <button v-else class="btn btn--secondary" type="button" @click="emit('close')">取消</button>
      <button class="btn btn--brand" type="button" @click="confirming ? emit('submit', { amount, reason, note }) : requestConfirm()">{{ confirming ? '确认退款' : '下一步' }}</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.refund-summary { display: grid; grid-template-columns: repeat(2, 1fr); padding: 12px; gap: 8px; border-radius: var(--radius-lg); background: var(--ink-900); }.refund-summary div { padding: 9px 11px; border: 1px solid rgba(255,255,255,.1); border-radius: var(--radius-md); }.refund-summary span,.refund-summary strong { display: block; }.refund-summary span { color: var(--ink-300); font-size: 8px; }.refund-summary strong { margin-top: 4px; color: #fff; font-size: 13px; }.refund-summary div:last-child strong { color: var(--brand-light); }
.refund-form { display: grid; grid-template-columns: repeat(2, 1fr); margin-top: 14px; gap: 12px; }.refund-form label { display: flex; flex-direction: column; gap: 6px; }.refund-form label.is-wide { grid-column: span 2; }.refund-form span { color: var(--text-subtle); font-size: 9px; font-weight: 750; }.refund-form b { margin-left: 2px; color: var(--danger); }.refund-form input,.refund-form select,.refund-form textarea { width: 100%; padding: 9px 10px; border: 1px solid var(--border); border-radius: var(--radius-md); outline: 0; background: var(--page); color: var(--text-subtle); font: inherit; font-size: 10px; }.refund-form input:focus,.refund-form select:focus,.refund-form textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-100); }.refund-form textarea { resize: vertical; }
.refund-error { display: flex; align-items: center; padding: 9px 10px; margin: 11px 0 0; gap: 6px; border: 1px solid var(--danger-border); border-radius: var(--radius-md); background: var(--danger-bg); color: var(--danger); font-size: 9px; }.refund-tip { margin: 11px 2px 0; color: var(--text-faint); font-size: 8px; line-height: 1.6; }.refund-confirm { padding: 28px 24px; border: 1px solid var(--warning-border); border-radius: var(--radius-lg); background: var(--warning-bg); text-align: center; }.refund-confirm > span { display: grid; width: 52px; height: 52px; margin: 0 auto 12px; place-items: center; border-radius: 50%; background: #fff; color: var(--brand); }.refund-confirm h3 { margin: 0; color: var(--text-strong); font-size: 15px; }.refund-confirm p { max-width: 420px; margin: 9px auto 0; color: var(--text-muted); font-size: 10px; line-height: 1.7; }.refund-confirm strong { color: var(--brand); }
</style>
