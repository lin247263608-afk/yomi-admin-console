<script setup lang="ts">
import { AlertTriangle, Bold, Check, Info, Link, List, ListOrdered } from '@lucide/vue'
import { computed, nextTick, reactive, ref, watch } from 'vue'

import ContentLanguageTabs, { type ContentLanguage } from '@/components/forms/ContentLanguageTabs.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{ row: ModuleRow | null; rows: ModuleRow[] }>()
const emit = defineEmits<{ close: []; save: [row: ModuleRow] }>()

const title = ref('')
const subtitle = ref('')
const channels = reactive<string[]>([])
const validFrom = ref('')
const validTo = ref('')
const content = ref('')
const titleEn = ref('')
const subtitleEn = ref('')
const contentEn = ref('')
const contentLanguage = ref<ContentLanguage>('zh')
const sort = ref('')
const validationError = ref('')
const contentInput = ref<HTMLTextAreaElement | null>(null)
const channelOptions = ['小程序', '乘客', '司导']
const activeContent = computed({
  get: () => contentLanguage.value === 'zh' ? content.value : contentEn.value,
  set: (value: string) => { if (contentLanguage.value === 'zh') content.value = value; else contentEn.value = value },
})

function initialize() {
  title.value = String(props.row?.title ?? '')
  subtitle.value = String(props.row?.subtitle ?? '')
  channels.splice(0, channels.length, ...channelOptions.filter((item) => String(props.row?.channel ?? '').includes(item)))
  validFrom.value = String(props.row?.validFrom ?? '')
  validTo.value = String(props.row?.validTo ?? '')
  content.value = String(props.row?.content ?? '')
  titleEn.value = String(props.row?.titleEn ?? '')
  subtitleEn.value = String(props.row?.subtitleEn ?? '')
  contentEn.value = String(props.row?.contentEn ?? '')
  contentLanguage.value = 'zh'
  sort.value = props.row?.sort == null ? String(props.rows.length + 1) : String(props.row.sort)
  validationError.value = ''
}

watch(() => props.row, initialize, { immediate: true })

function toggleChannel(channel: string) {
  const index = channels.indexOf(channel)
  if (index >= 0) channels.splice(index, 1)
  else channels.push(channel)
}

async function insertFormat(prefix: string, suffix = '') {
  const textarea = contentInput.value
  const start = textarea?.selectionStart ?? activeContent.value.length
  const end = textarea?.selectionEnd ?? start
  const selected = activeContent.value.slice(start, end)
  activeContent.value = `${activeContent.value.slice(0, start)}${prefix}${selected}${suffix}${activeContent.value.slice(end)}`
  await nextTick()
  textarea?.focus()
  textarea?.setSelectionRange(start + prefix.length, end + prefix.length)
}

function save() {
  const trimmedTitle = title.value.trim()
  const trimmedSubtitle = subtitle.value.trim()
  const trimmedContent = content.value.trim()
  const trimmedTitleEn = titleEn.value.trim()
  const trimmedSubtitleEn = subtitleEn.value.trim()
  const trimmedContentEn = contentEn.value.trim()
  const sortValue = Number(sort.value)

  if (!trimmedTitle) validationError.value = '请输入公告标题。'
  else if (props.rows.some((item) => item.id !== props.row?.id && String(item.title ?? '').trim().toLowerCase() === trimmedTitle.toLowerCase())) validationError.value = '公告标题已存在，请使用其他标题。'
  else if (!channels.length) validationError.value = '请至少选择一个发布端。'
  else if (!validFrom.value || !validTo.value) validationError.value = '请选择完整的生效时间范围。'
  else if (validFrom.value > validTo.value) validationError.value = '生效开始日期不能晚于结束日期。'
  else if (!trimmedContent) validationError.value = '请输入公告富文本内容。'
  else if (!trimmedTitleEn) validationError.value = '请输入英文公告标题。'
  else if (!trimmedContentEn) validationError.value = '请输入英文公告内容。'
  else if (!sort.value.trim() || !Number.isInteger(sortValue) || sortValue < 0) validationError.value = '排序必须是大于或等于 0 的整数。'
  else validationError.value = ''
  if (validationError.value) return

  emit('save', {
    id: props.row?.id ?? `NT-${new Date().toISOString().slice(2, 10).replaceAll('-', '')}-${String(props.rows.length + 1).padStart(2, '0')}`,
    title: trimmedTitle,
    subtitle: trimmedSubtitle || '—',
    channel: channelOptions.filter((item) => channels.includes(item)).join(' + '),
    validFrom: validFrom.value,
    validTo: validTo.value,
    validity: `${validFrom.value} — ${validTo.value}`,
    content: trimmedContent,
    titleEn: trimmedTitleEn,
    subtitleEn: trimmedSubtitleEn || '—',
    contentEn: trimmedContentEn,
    sort: sortValue,
    status: String(props.row?.status ?? '禁用'),
  })
}
</script>

<template>
  <ModalDialog :title="row ? `编辑公告 · ${row.id}` : '新增公告'" eyebrow="NOTICE EDITOR" size="wide" @close="emit('close')">
    <section class="notice-editor-note"><Info :size="17" /><div><strong>新增公告默认禁用</strong><p>保存后可从列表启用；开始日期未到时显示“待生效”。同一公告支持同时发布至小程序、乘客端和司导端。</p></div></section>
    <ContentLanguageTabs v-model="contentLanguage" />

    <div class="notice-editor-layout">
      <section class="notice-editor-card">
        <header><span>基础信息</span><small>标题用于列表和公告入口展示</small></header>
        <div class="notice-form-grid">
          <label class="notice-field notice-field--wide"><span>{{ contentLanguage === 'zh' ? '公告标题（中文）' : 'Notice title (English)' }} <em>*</em></span><input v-if="contentLanguage === 'zh'" v-model="title" class="field-control" type="text" maxlength="60" autofocus placeholder="请输入公告标题" /><input v-else v-model="titleEn" class="field-control" type="text" maxlength="100" placeholder="Enter the notice title" /></label>
          <label class="notice-field notice-field--wide"><span>{{ contentLanguage === 'zh' ? '副标题（中文）' : 'Subtitle (English)' }}</span><input v-if="contentLanguage === 'zh'" v-model="subtitle" class="field-control" type="text" maxlength="100" placeholder="请输入副标题" /><input v-else v-model="subtitleEn" class="field-control" type="text" maxlength="160" placeholder="Enter the subtitle" /></label>
          <div class="notice-field notice-field--wide"><span>发布端 <em>*</em></span><div class="notice-channel-options"><button v-for="channel in channelOptions" :key="channel" type="button" :class="{ 'is-selected': channels.includes(channel) }" @click="toggleChannel(channel)">{{ channel }}</button></div><small>可多选；乘客与司导可在各自客户端查看公告</small></div>
          <label class="notice-field"><span>生效开始 <em>*</em></span><input v-model="validFrom" class="field-control" type="date" /></label>
          <label class="notice-field"><span>生效结束 <em>*</em></span><input v-model="validTo" class="field-control" type="date" /></label>
          <label class="notice-field"><span>排序 <em>*</em></span><input v-model="sort" class="field-control" type="number" min="0" step="1" placeholder="排序值" /><small>数值越小越靠前</small></label>
        </div>
      </section>

      <section class="notice-editor-card notice-editor-card--content">
        <header><span>{{ contentLanguage === 'zh' ? '富文本内容（中文）' : 'Rich text content (English)' }} <em>*</em></span><small>{{ activeContent.length }} / 3000</small></header>
        <div class="notice-rich-editor">
          <div class="notice-rich-editor__toolbar" aria-label="富文本快捷工具">
            <button type="button" title="加粗" @click="insertFormat('**', '**')"><Bold :size="14" /></button>
            <button type="button" title="无序列表" @click="insertFormat('\n• ')"><List :size="14" /></button>
            <button type="button" title="有序列表" @click="insertFormat('\n1. ')"><ListOrdered :size="14" /></button>
            <button type="button" title="插入链接" @click="insertFormat('[链接文字](', ')')"><Link :size="14" /></button>
          </div>
          <textarea ref="contentInput" v-model="activeContent" maxlength="3000" :placeholder="contentLanguage === 'zh' ? '请输入公告正文，可使用工具栏快速插入强调、列表或链接。' : 'Enter the English notice content shown in the App.'"></textarea>
        </div>
      </section>
    </div>

    <p v-if="validationError" class="notice-error"><AlertTriangle :size="15" />{{ validationError }}</p>
    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">取消</button><button class="btn btn--brand" type="button" @click="save"><Check :size="14" />确认保存</button></template>
  </ModalDialog>
</template>

<style scoped>
.notice-editor-note { display: flex; align-items: flex-start; padding: 12px 14px; margin-bottom: 16px; gap: 9px; border-radius: var(--radius-md); background: #eff6ff; color: #1d4ed8; }
.notice-editor-note svg { flex: none; margin-top: 1px; }
.notice-editor-note strong { display: block; font-size: 10px; }
.notice-editor-note p { margin: 3px 0 0; font-size: 9px; line-height: 1.55; }
.notice-editor-layout { display: grid; grid-template-columns: minmax(0, .92fr) minmax(0, 1.08fr); align-items: stretch; gap: 14px; }
.notice-editor-card { padding: 15px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.notice-editor-card > header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 11px; margin-bottom: 13px; border-bottom: 1px solid var(--border); }
.notice-editor-card > header span { color: var(--text-strong); font-family: var(--font-display); font-size: 11px; font-weight: 800; }
.notice-editor-card > header small { color: var(--text-faint); font-size: 8px; }
.notice-editor-card em, .notice-field em { color: var(--brand); font-style: normal; }
.notice-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.notice-field { display: flex; min-width: 0; flex-direction: column; gap: 6px; }
.notice-field--wide { grid-column: 1 / -1; }
.notice-field > span { color: var(--text-subtle); font-size: 9px; font-weight: 750; }
.notice-field .field-control { width: 100%; }
.notice-field small { color: var(--text-faint); font-size: 8px; }
.notice-channel-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 7px; }
.notice-channel-options button { min-height: 34px; padding: 0 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); color: var(--text-muted); font-size: 9px; font-weight: 700; }
.notice-channel-options button.is-selected { border-color: var(--brand); background: var(--brand-100); color: var(--brand-dark); box-shadow: inset 0 0 0 1px var(--brand); }
.notice-editor-card--content { display: flex; min-height: 360px; flex-direction: column; }
.notice-rich-editor { display: flex; overflow: hidden; min-height: 285px; flex: 1; flex-direction: column; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.notice-rich-editor__toolbar { display: flex; align-items: center; padding: 7px; gap: 5px; border-bottom: 1px solid var(--border); background: var(--page); }
.notice-rich-editor__toolbar button { display: inline-flex; width: 30px; height: 28px; align-items: center; justify-content: center; border: 1px solid transparent; border-radius: var(--radius-sm); background: transparent; color: var(--text-muted); }
.notice-rich-editor__toolbar button:hover { border-color: var(--border); background: var(--surface); color: var(--brand-dark); }
.notice-rich-editor textarea { width: 100%; min-height: 235px; flex: 1; padding: 13px; border: 0; outline: 0; resize: vertical; background: transparent; color: var(--text-subtle); font-family: inherit; font-size: 10px; line-height: 1.75; }
.notice-error { display: flex; align-items: center; padding: 10px 12px; margin: 14px 0 0; gap: 7px; border-radius: var(--radius-md); background: #fff1f2; color: #dc2626; font-size: 9px; }
@media (max-width: 800px) { .notice-editor-layout { grid-template-columns: 1fr; } }
@media (max-width: 480px) { .notice-form-grid { grid-template-columns: 1fr; } .notice-field--wide { grid-column: auto; } }
</style>
