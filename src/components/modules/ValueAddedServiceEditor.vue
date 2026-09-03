<script setup lang="ts">
import { AlertTriangle, Check, Info } from '@lucide/vue'
import { ref, watch } from 'vue'

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
const description = ref('')
const nameEn = ref('')
const descriptionEn = ref('')
const contentLanguage = ref<ContentLanguage>('zh')
const fee = ref('')
const sort = ref('')
const validationError = ref('')

function initialize() {
  name.value = String(props.row?.name ?? '')
  description.value = String(props.row?.description ?? '')
  nameEn.value = String(props.row?.nameEn ?? '')
  descriptionEn.value = String(props.row?.descriptionEn ?? '')
  contentLanguage.value = 'zh'
  fee.value = props.row?.fee == null ? '' : String(props.row.fee)
  sort.value = props.row?.sort == null ? String(props.rows.length + 1) : String(props.row.sort)
  validationError.value = ''
}

watch(() => props.row, initialize, { immediate: true })

function save() {
  const trimmedName = name.value.trim()
  const trimmedDescription = description.value.trim()
  const trimmedNameEn = nameEn.value.trim()
  const trimmedDescriptionEn = descriptionEn.value.trim()
  const feeValue = Number(fee.value)
  const sortValue = Number(sort.value)

  if (!trimmedName) validationError.value = '请输入服务名称。'
  else if (props.rows.some((item) => item.id !== props.row?.id && String(item.name ?? '').trim().toLowerCase() === trimmedName.toLowerCase())) validationError.value = '服务名称已存在，请使用其他名称。'
  else if (!trimmedDescription) validationError.value = '请输入服务描述。'
  else if (!trimmedNameEn) validationError.value = '请输入英文服务名称。'
  else if (!trimmedDescriptionEn) validationError.value = '请输入英文服务描述。'
  else if (!fee.value.trim() || !Number.isFinite(feeValue) || feeValue < 0) validationError.value = '费用必须是大于或等于 £0 的有效金额。'
  else if (!sort.value.trim() || !Number.isInteger(sortValue) || sortValue < 0) validationError.value = '排序必须是大于或等于 0 的整数。'
  else validationError.value = ''

  if (validationError.value) return

  emit('save', {
    id: props.row?.id ?? `VAS-${String(Date.now()).slice(-6)}`,
    name: trimmedName,
    description: trimmedDescription,
    nameEn: trimmedNameEn,
    descriptionEn: trimmedDescriptionEn,
    fee: feeValue,
    sort: sortValue,
    ordersToday: props.row?.ordersToday ?? 0,
    serviceMode: props.row?.businessLinked ? '业务关联服务' : '线下服务',
    businessLinked: props.row?.businessLinked ?? false,
    status: String(props.row?.status ?? '启用'),
  })
}
</script>

<template>
  <ModalDialog :title="row ? `编辑增值服务 · ${row.id}` : '新增增值服务'" eyebrow="VALUE-ADDED SERVICE" size="wide" @close="emit('close')">
    <section class="service-editor-note">
      <Info :size="17" />
      <div><strong>费用与排序只影响新订单</strong><p>服务禁用后乘客端不可再选，已下单的服务明细、金额与分账口径不受影响。</p></div>
    </section>

    <ContentLanguageTabs v-model="contentLanguage" />
    <div class="service-localized-grid">
      <label class="service-field"><span>{{ contentLanguage === 'zh' ? '服务名称（中文）' : 'Service name (English)' }} <em>*</em></span><input v-if="contentLanguage === 'zh'" v-model="name" class="field-control" type="text" maxlength="30" placeholder="请输入服务名称" /><input v-else v-model="nameEn" class="field-control" type="text" maxlength="60" placeholder="Enter the service name" /></label>
      <label class="service-field service-field--full"><span>{{ contentLanguage === 'zh' ? '服务描述（中文）' : 'Service description (English)' }} <em>*</em></span><textarea v-if="contentLanguage === 'zh'" v-model="description" class="form-textarea" maxlength="200" placeholder="请输入服务内容、适用场景或交付说明"></textarea><textarea v-else v-model="descriptionEn" class="form-textarea" maxlength="300" placeholder="Describe the service, use cases and delivery"></textarea></label>
    </div>
    <div class="service-form-grid service-shared-grid">
      <label class="service-field"><span>费用（GBP） <em>*</em></span><div class="money-control"><b>£</b><input v-model="fee" type="number" min="0" step="0.01" placeholder="0.00" /></div></label>
      <label class="service-field"><span>排序 <em>*</em></span><input v-model="sort" class="field-control" type="number" min="0" step="1" placeholder="请输入排序值" /><small>数值越小，在乘客端下单页展示越靠前</small></label>
    </div>

    <section v-if="row?.businessLinked" class="service-link-warning"><AlertTriangle :size="16" /><div><strong>该服务已与业务关联</strong><p>儿童座椅可编辑、禁用，但不允许删除，以免破坏历史订单关联。</p></div></section>
    <p v-if="validationError" class="service-error"><AlertTriangle :size="15" />{{ validationError }}</p>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">取消</button>
      <button class="btn btn--brand" type="button" @click="save"><Check :size="14" />确认保存</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.service-editor-note, .service-link-warning { display: flex; align-items: flex-start; padding: 12px 14px; gap: 9px; border-radius: var(--radius-md); }
.service-editor-note { margin-bottom: 16px; background: #eff6ff; color: #1d4ed8; }
.service-link-warning { margin-top: 16px; background: #fff7ed; color: #c2410c; }
.service-editor-note svg, .service-link-warning svg { flex: none; margin-top: 1px; }
.service-editor-note strong, .service-link-warning strong { display: block; font-size: 10px; }
.service-editor-note p, .service-link-warning p { margin: 3px 0 0; font-size: 9px; line-height: 1.55; }
.service-form-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.service-localized-grid { display: grid; grid-template-columns: 1fr 2fr; padding: 12px; margin: 10px 0 14px; gap: 14px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.service-shared-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.service-field { display: flex; min-width: 0; flex-direction: column; gap: 6px; }
.service-field--full { grid-column: 1 / -1; }
.service-field > span { color: var(--text-subtle); font-size: 9px; font-weight: 750; }
.service-field em { color: var(--brand); font-style: normal; }
.service-field small { color: var(--text-faint); font-size: 8px; }
.service-field .field-control, .service-field .form-textarea { width: 100%; }
.service-field .form-textarea { min-height: 100px; }
.money-control { display: flex; overflow: hidden; min-height: 38px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.money-control:focus-within { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-100); }
.money-control b { display: grid; width: 38px; place-items: center; border-right: 1px solid var(--border); background: var(--page); color: var(--brand-dark); }
.money-control input { min-width: 0; flex: 1; padding: 0 11px; border: 0; outline: 0; background: transparent; color: var(--text-strong); }
.service-error { display: flex; align-items: center; padding: 10px 12px; margin: 12px 0 0; gap: 7px; border-radius: var(--radius-md); background: #fff1f2; color: #dc2626; font-size: 9px; }
@media (max-width: 680px) { .service-form-grid { grid-template-columns: 1fr; } .service-field--full { grid-column: auto; } }
</style>
