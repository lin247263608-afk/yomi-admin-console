<script setup lang="ts">
import { AlertTriangle, Check, ImagePlus, Info } from '@lucide/vue'
import { reactive, ref, watch } from 'vue'

import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{ row: ModuleRow | null; rows: ModuleRow[] }>()
const emit = defineEmits<{ close: []; save: [row: ModuleRow] }>()

const name = ref('')
const description = ref('')
const image = ref('')
const channels = reactive<string[]>([])
const jumpType = ref<'无跳转' | '链接跳转'>('无跳转')
const jumpUrl = ref('')
const validFrom = ref('')
const validTo = ref('')
const sort = ref('')
const validationError = ref('')
const channelOptions = ['小程序', 'APP']

function initialize() {
  name.value = String(props.row?.name ?? '')
  description.value = String(props.row?.description ?? '')
  image.value = String(props.row?.image ?? '')
  channels.splice(0, channels.length, ...channelOptions.filter((item) => String(props.row?.channel ?? '小程序 + APP').includes(item)))
  jumpType.value = props.row?.jumpType === '链接跳转' ? '链接跳转' : '无跳转'
  jumpUrl.value = String(props.row?.jumpUrl ?? '')
  validFrom.value = String(props.row?.validFrom ?? '')
  validTo.value = String(props.row?.validTo ?? '')
  sort.value = props.row?.sort == null ? String(props.rows.length + 1) : String(props.row.sort)
  validationError.value = ''
}

watch(() => props.row, initialize, { immediate: true })

function toggleChannel(channel: string) {
  const index = channels.indexOf(channel)
  if (index >= 0) channels.splice(index, 1)
  else channels.push(channel)
}

function handleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) validationError.value = '请上传 JPG、PNG 或 WebP 图片。'
  else if (file.size > 5 * 1024 * 1024) validationError.value = '图片文件不能超过 5 MB。'
  else validationError.value = ''
  if (validationError.value) {
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    image.value = String(reader.result ?? '')
    input.value = ''
  }
  reader.onerror = () => { validationError.value = '图片读取失败，请更换文件后重试。' }
  reader.readAsDataURL(file)
}

function save() {
  const trimmedName = name.value.trim()
  const trimmedDescription = description.value.trim()
  const trimmedJumpUrl = jumpUrl.value.trim()
  const sortValue = Number(sort.value)

  if (!trimmedName) validationError.value = '请输入 Banner 名称。'
  else if (props.rows.some((item) => item.id !== props.row?.id && String(item.name ?? '').trim().toLowerCase() === trimmedName.toLowerCase())) validationError.value = 'Banner 名称已存在，请使用其他名称。'
  else if (!image.value) validationError.value = '请上传 Banner 图片。'
  else if (!channels.length) validationError.value = '请至少选择一个发布端。'
  else if (jumpType.value === '链接跳转' && !trimmedJumpUrl) validationError.value = '选择链接跳转时，必须填写跳转地址。'
  else if (!validFrom.value || !validTo.value) validationError.value = '请选择完整的生效时间范围。'
  else if (validFrom.value > validTo.value) validationError.value = '生效开始日期不能晚于结束日期。'
  else if (!sort.value.trim() || !Number.isInteger(sortValue) || sortValue < 0) validationError.value = '排序必须是大于或等于 0 的整数。'
  else validationError.value = ''
  if (validationError.value) return

  emit('save', {
    id: props.row?.id ?? `BN-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${String(props.rows.length + 1).padStart(2, '0')}`,
    name: trimmedName,
    description: trimmedDescription || '—',
    image: image.value,
    channel: channelOptions.filter((item) => channels.includes(item)).join(' + '),
    jumpType: jumpType.value,
    jumpUrl: jumpType.value === '链接跳转' ? trimmedJumpUrl : '',
    validFrom: validFrom.value,
    validTo: validTo.value,
    validity: `${validFrom.value} — ${validTo.value}`,
    sort: sortValue,
    status: String(props.row?.status ?? '禁用'),
  })
}
</script>

<template>
  <ModalDialog :title="row ? `编辑 Banner · ${row.id}` : '新增 Banner'" eyebrow="BANNER EDITOR" size="wide" @close="emit('close')">
    <section class="banner-editor-note"><Info :size="17" /><div><strong>新增 Banner 默认禁用</strong><p>保存并检查图片、发布端与生效时间后，可在列表中启用。未到生效日期时将显示“待生效”。</p></div></section>

    <div class="banner-editor-layout">
      <label class="banner-uploader">
        <img v-if="image" :src="image" alt="Banner 图片预览" />
        <span v-else><ImagePlus :size="28" /><b>上传 Banner 图片</b><small>支持 JPG、PNG、WebP，最大 5 MB</small></span>
        <i><ImagePlus :size="14" />{{ image ? '更换图片' : '选择图片' }}</i>
        <input type="file" accept="image/jpeg,image/png,image/webp" @change="handleImageUpload" />
      </label>

      <div class="banner-form-grid">
        <label class="banner-field banner-field--wide"><span>Banner 名称 <em>*</em></span><input v-model="name" class="field-control" type="text" maxlength="50" placeholder="请输入 Banner 名称" /></label>
        <label class="banner-field banner-field--wide"><span>描述</span><textarea v-model="description" class="form-textarea" maxlength="160" placeholder="请输入展示文案或运营说明"></textarea></label>
        <div class="banner-field banner-field--wide"><span>发布端 <em>*</em></span><div class="channel-options"><button v-for="channel in channelOptions" :key="channel" type="button" :class="{ 'is-selected': channels.includes(channel) }" @click="toggleChannel(channel)">{{ channel }}</button></div><small>支持同时发布到小程序和 APP</small></div>
        <label class="banner-field"><span>跳转类型 <em>*</em></span><select v-model="jumpType" class="field-control"><option value="无跳转">无跳转</option><option value="链接跳转">链接跳转</option></select></label>
        <label class="banner-field"><span>排序 <em>*</em></span><input v-model="sort" class="field-control" type="number" min="0" step="1" placeholder="排序值" /></label>
        <label v-if="jumpType === '链接跳转'" class="banner-field banner-field--wide"><span>跳转地址 <em>*</em></span><input v-model="jumpUrl" class="field-control" type="text" placeholder="请输入页面路径或 HTTPS 链接" /></label>
        <label class="banner-field"><span>生效开始 <em>*</em></span><input v-model="validFrom" class="field-control" type="date" /></label>
        <label class="banner-field"><span>生效结束 <em>*</em></span><input v-model="validTo" class="field-control" type="date" /></label>
      </div>
    </div>

    <p v-if="validationError" class="banner-error"><AlertTriangle :size="15" />{{ validationError }}</p>
    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">取消</button><button class="btn btn--brand" type="button" @click="save"><Check :size="14" />确认保存</button></template>
  </ModalDialog>
</template>

<style scoped>
.banner-editor-note { display: flex; align-items: flex-start; padding: 12px 14px; margin-bottom: 16px; gap: 9px; border-radius: var(--radius-md); background: #eff6ff; color: #1d4ed8; }
.banner-editor-note svg { flex: none; margin-top: 1px; }
.banner-editor-note strong { display: block; font-size: 10px; }
.banner-editor-note p { margin: 3px 0 0; font-size: 9px; line-height: 1.55; }
.banner-editor-layout { display: grid; grid-template-columns: minmax(280px, .9fr) minmax(0, 1.35fr); align-items: start; gap: 18px; }
.banner-uploader { position: relative; display: flex; overflow: hidden; min-height: 235px; align-items: center; justify-content: center; border: 1px dashed var(--ink-300); border-radius: var(--radius-lg); background: var(--page); cursor: pointer; }
.banner-uploader:hover { border-color: var(--brand); background: var(--brand-50); }
.banner-uploader > img { width: 100%; min-height: 235px; object-fit: cover; }
.banner-uploader > span { display: flex; align-items: center; flex-direction: column; gap: 5px; color: var(--ink-600); }
.banner-uploader > span b { font-size: 11px; }
.banner-uploader > span small { color: var(--text-faint); font-size: 8px; }
.banner-uploader > i { position: absolute; right: 12px; bottom: 12px; display: inline-flex; min-height: 30px; align-items: center; padding: 0 11px; gap: 5px; border-radius: var(--radius-pill); background: rgba(8,28,48,.86); color: #fff; font-size: 9px; font-style: normal; font-weight: 700; }
.banner-uploader > input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.banner-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.banner-field { display: flex; min-width: 0; flex-direction: column; gap: 6px; }
.banner-field--wide { grid-column: 1 / -1; }
.banner-field > span { color: var(--text-subtle); font-size: 9px; font-weight: 750; }
.banner-field em { color: var(--brand); font-style: normal; }
.banner-field .field-control, .banner-field .form-textarea { width: 100%; }
.banner-field .form-textarea { min-height: 72px; }
.banner-field small { color: var(--text-faint); font-size: 8px; }
.channel-options { display: flex; gap: 8px; }
.channel-options button { min-width: 90px; min-height: 34px; padding: 0 14px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--text-muted); font-size: 9px; font-weight: 700; }
.channel-options button.is-selected { border-color: var(--brand); background: var(--brand-100); color: var(--brand-dark); box-shadow: inset 0 0 0 1px var(--brand); }
.banner-error { display: flex; align-items: center; padding: 10px 12px; margin: 14px 0 0; gap: 7px; border-radius: var(--radius-md); background: #fff1f2; color: #dc2626; font-size: 9px; }
@media (max-width: 760px) { .banner-editor-layout { grid-template-columns: 1fr; } .banner-uploader { min-height: 190px; } .banner-uploader > img { min-height: 190px; } }
@media (max-width: 480px) { .banner-form-grid { grid-template-columns: 1fr; } .banner-field--wide { grid-column: auto; } }
</style>
