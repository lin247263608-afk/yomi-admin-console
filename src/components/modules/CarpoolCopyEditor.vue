<script setup lang="ts">
import { AlertTriangle, Check, Info } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{ row: ModuleRow | null; rows: ModuleRow[] }>()
const emit = defineEmits<{ close: []; save: [row: ModuleRow] }>()

const endpoint = ref('乘客端')
const node = ref('拼车成功')
const content = ref('')
const sort = ref('1')
const validationError = ref('')
const nodeOptions = computed(() => endpoint.value === '乘客端'
  ? ['拼车成功', '待出发', '行程中']
  : ['待出发', '行程中'])

function initialize() {
  endpoint.value = String(props.row?.endpoint ?? '乘客端')
  node.value = String(props.row?.node ?? '拼车成功')
  content.value = String(props.row?.content ?? '')
  sort.value = String(props.row?.sort ?? 1)
  validationError.value = ''
}

watch(() => props.row, initialize, { immediate: true })
watch(endpoint, () => {
  if (!nodeOptions.value.includes(node.value)) node.value = nodeOptions.value[0] ?? ''
})

function save() {
  const copy = content.value.trim()
  const sortValue = Number(sort.value)
  if (!copy) validationError.value = '请输入模板内容。'
  else if (!Number.isInteger(sortValue) || sortValue < 0) validationError.value = '排序必须是大于或等于 0 的整数。'
  else if (props.rows.some((item) => item.id !== props.row?.id
    && item.endpoint === endpoint.value
    && item.node === node.value
    && String(item.content ?? '').trim() === copy)) validationError.value = '同一生效端与节点下已存在相同内容。'
  else validationError.value = ''
  if (validationError.value) return

  const nextNumber = Math.max(0, ...props.rows.map((item) => Number(String(item.id).replace(/\D/g, '')) || 0)) + 1
  emit('save', {
    id: props.row?.id ?? `CC-${String(nextNumber).padStart(3, '0')}`,
    endpoint: endpoint.value,
    node: node.value,
    content: copy,
    sort: sortValue,
    status: String(props.row?.status ?? '禁用'),
  })
}
</script>

<template>
  <ModalDialog :title="row ? `编辑默认语 · ${row.id}` : '新增默认语'" eyebrow="CARPOOL COPY EDITOR" size="wide" @close="emit('close')">
    <section class="copy-editor-note"><Info :size="17" /><div><strong>模板按“生效端 + 节点”独立生效</strong><p>新增模板默认禁用，可保存后从列表启用。行程结束后拼车团关闭，不再允许发送模板消息。</p></div></section>
    <div class="copy-editor-grid">
      <section class="copy-editor-card">
        <header><span>应用范围</span><small>决定模板在哪一端、哪个行程阶段出现</small></header>
        <div class="copy-editor-fields">
          <label><span>生效端 <em>*</em></span><select v-model="endpoint" class="field-control"><option>乘客端</option><option>司导端</option></select></label>
          <label><span>节点 <em>*</em></span><select v-model="node" class="field-control"><option v-for="item in nodeOptions" :key="item">{{ item }}</option></select></label>
          <label><span>排序 <em>*</em></span><input v-model="sort" class="field-control" type="number" min="0" step="1" /><small>同端同节点内，数值越小越靠前</small></label>
        </div>
      </section>
      <section class="copy-editor-card copy-editor-card--content">
        <header><span>模板内容 <em>*</em></span><small>{{ content.length }} / 200</small></header>
        <textarea v-model="content" maxlength="200" autofocus placeholder="请输入拼车团内可快捷发送的固定话术"></textarea>
        <div class="copy-preview"><small>发送预览</small><p>{{ content.trim() || '模板内容会在这里预览。' }}</p></div>
      </section>
    </div>
    <p v-if="validationError" class="copy-editor-error"><AlertTriangle :size="15" />{{ validationError }}</p>
    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">取消</button><button class="btn btn--brand" type="button" @click="save"><Check :size="14" />确认保存</button></template>
  </ModalDialog>
</template>

<style scoped>
.copy-editor-note { display: flex; align-items: flex-start; padding: 12px 14px; margin-bottom: 15px; gap: 9px; border-radius: var(--radius-md); background: #eff6ff; color: #1d4ed8; }
.copy-editor-note svg { flex: none; margin-top: 1px; }
.copy-editor-note strong { display: block; font-size: 10px; }
.copy-editor-note p { margin: 3px 0 0; font-size: 9px; line-height: 1.55; }
.copy-editor-grid { display: grid; grid-template-columns: minmax(270px, .72fr) minmax(0, 1.28fr); gap: 14px; }
.copy-editor-card { padding: 15px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.copy-editor-card > header { display: flex; justify-content: space-between; padding-bottom: 11px; margin-bottom: 13px; gap: 12px; border-bottom: 1px solid var(--border); }
.copy-editor-card > header span { color: var(--text-strong); font-size: 11px; font-weight: 800; }
.copy-editor-card > header small { color: var(--text-faint); font-size: 8px; }
.copy-editor-card em { color: var(--brand); font-style: normal; }
.copy-editor-fields { display: grid; gap: 13px; }
.copy-editor-fields label { display: flex; flex-direction: column; gap: 6px; }
.copy-editor-fields label > span { color: var(--text-subtle); font-size: 9px; font-weight: 750; }
.copy-editor-fields label > small { color: var(--text-faint); font-size: 8px; }
.copy-editor-card--content textarea { width: 100%; min-height: 150px; padding: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); outline: 0; resize: vertical; background: var(--surface); color: var(--text-subtle); font: inherit; font-size: 10px; line-height: 1.7; }
.copy-editor-card--content textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(245,124,0,.1); }
.copy-preview { padding: 11px; margin-top: 10px; border-radius: var(--radius-md); background: var(--ink-50); }
.copy-preview small { color: var(--text-faint); font-size: 8px; }
.copy-preview p { width: fit-content; max-width: 90%; padding: 8px 10px; margin: 6px 0 0; border-radius: 10px 10px 10px 2px; background: var(--surface); color: var(--text-subtle); font-size: 9px; box-shadow: var(--shadow-sm); }
.copy-editor-error { display: flex; align-items: center; padding: 10px 12px; margin: 14px 0 0; gap: 7px; border-radius: var(--radius-md); background: #fff1f2; color: #dc2626; font-size: 9px; }
@media (max-width: 720px) { .copy-editor-grid { grid-template-columns: 1fr; } }
</style>
