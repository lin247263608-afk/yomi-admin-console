<script setup lang="ts">
import { AlertTriangle, Check, Info, TriangleAlert } from '@lucide/vue'
import { computed, nextTick, ref, watch } from 'vue'

import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'
import {
  availableVariablesForNode,
  contextLabels,
  extractMessageVariableKeys,
  messageVariables,
  nodeContexts,
  type MessageContext,
} from '@/data/messageVariables'

const props = defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: []; save: [row: ModuleRow] }>()
const content = ref('')
const validationError = ref('')
const contentInput = ref<HTMLTextAreaElement | null>(null)
const isRiskNode = computed(() => ['支付', '退款', '结算', '认证'].includes(String(props.row.group ?? '')))
const availableVariables = computed(() => availableVariablesForNode(String(props.row.node ?? ''), props.row.endpoint))
const variableGroups = computed(() => {
  const groups = new Map<MessageContext, typeof messageVariables>()
  availableVariables.value.forEach((variable) => {
    const group = groups.get(variable.context) ?? []
    group.push(variable)
    groups.set(variable.context, group)
  })
  return [...groups.entries()].map(([context, variables]) => ({ context, label: contextLabels[context], variables }))
})
const boundContextLabels = computed(() => (nodeContexts[String(props.row.node ?? '')] ?? []).map((context) => contextLabels[context]))
const previewParts = computed(() => {
  const source = content.value.trim()
  if (!source) return [{ text: '系统消息内容会在这里预览。', unknown: false }]
  const dictionary = new Map(messageVariables.map((variable) => [variable.key, variable]))
  const parts: Array<{ text: string; unknown: boolean }> = []
  let cursor = 0
  source.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (raw, key: string, offset: number) => {
    if (offset > cursor) parts.push({ text: source.slice(cursor, offset), unknown: false })
    const variable = dictionary.get(key)
    parts.push({ text: variable?.sample ?? raw, unknown: !variable })
    cursor = offset + raw.length
    return raw
  })
  if (cursor < source.length) parts.push({ text: source.slice(cursor), unknown: false })
  return parts
})

watch(() => props.row, () => {
  content.value = String(props.row.content ?? '')
  validationError.value = ''
}, { immediate: true })

async function insertVariable(key: string) {
  const textarea = contentInput.value
  const token = `{${key}}`
  const start = textarea?.selectionStart ?? content.value.length
  const end = textarea?.selectionEnd ?? start
  content.value = `${content.value.slice(0, start)}${token}${content.value.slice(end)}`
  await nextTick()
  textarea?.focus()
  textarea?.setSelectionRange(start + token.length, start + token.length)
}

function save() {
  const copy = content.value.trim()
  const usedKeys = extractMessageVariableKeys(copy)
  const dictionaryKeys = new Set(messageVariables.map((variable) => variable.key))
  const allowedKeys = new Set(availableVariables.value.map((variable) => variable.key))
  const unknownKey = usedKeys.find((key) => !dictionaryKeys.has(key))
  const unavailableKey = usedKeys.find((key) => dictionaryKeys.has(key) && !allowedKeys.has(key))
  if (!copy) validationError.value = '请输入系统消息内容。'
  else if (copy.length > 300) validationError.value = '系统消息内容不能超过 300 个字符。'
  else if (unknownKey) validationError.value = `变量 {${unknownKey}} 不存在，请从右侧面板选择。`
  else if (unavailableKey) validationError.value = `变量 {${unavailableKey}} 在「${String(props.row.node)}」节点无值，请移除。`
  else validationError.value = ''
  if (validationError.value) return
  emit('save', { ...props.row, content: copy })
}
</script>

<template>
  <ModalDialog :title="`编辑系统消息 · ${row.id}`" eyebrow="SYSTEM MESSAGE EDITOR" size="wide" @close="emit('close')">
    <section class="message-editor-note"><Info :size="17" /><div><strong>发送节点由系统预置</strong><p>发布端、节点分组、发送节点和触发时机不可修改；运营人员只维护该节点的消息文案，启停在列表操作栏完成。</p></div></section>
    <section v-if="isRiskNode" class="message-editor-risk"><TriangleAlert :size="17" /><div><strong>资金与合规通知提醒</strong><p>该节点涉及资金或合规告知，禁用后用户将不再收到对应通知。此提示不阻断编辑和保存。</p></div></section>
    <div class="message-editor-grid">
      <section class="message-editor-card">
        <header><span>节点信息</span><small>只读</small></header>
        <dl><div><dt>发布端</dt><dd>{{ row.endpoint }}</dd></div><div><dt>节点分组</dt><dd>{{ row.group }}</dd></div><div><dt>发送节点</dt><dd>{{ row.node }}</dd></div><div><dt>触发时机</dt><dd>{{ row.triggerAt }}</dd></div><div class="message-node-context"><dt>绑定上下文</dt><dd>{{ boundContextLabels.join('、') || '无' }}</dd></div></dl>
        <section class="message-variables">
          <header><div><span>可插入变量</span><small>点击后插入当前光标位置</small></div><b>{{ availableVariables.length }} 项</b></header>
          <div v-if="variableGroups.length" class="message-variable-groups">
            <div v-for="group in variableGroups" :key="group.context" class="message-variable-group"><strong>{{ group.label }}</strong><div><button v-for="variable in group.variables" :key="variable.key" type="button" :title="`插入 {${variable.key}} · 示例：${variable.sample}`" @click="insertVariable(variable.key)"><span>{{ variable.label }}</span><code>{<i>{{ variable.key }}</i>}</code></button></div></div>
          </div>
          <p v-else>该节点无可插入变量</p>
        </section>
      </section>
      <section class="message-editor-card message-editor-card--content">
        <header><span>消息内容 <em>*</em></span><small>{{ content.length }} / 300</small></header>
        <textarea ref="contentInput" v-model="content" autofocus maxlength="300" placeholder="请输入该系统节点触发时发送的消息文案"></textarea>
        <div class="message-preview"><small>效果预览</small><p><template v-for="(part, index) in previewParts" :key="index"><mark v-if="part.unknown">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template></p><span>变量已使用示例数据渲染；红色内容表示未知变量。</span></div>
      </section>
    </div>
    <p v-if="validationError" class="message-editor-error"><AlertTriangle :size="15" />{{ validationError }}</p>
    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">取消</button><button class="btn btn--brand" type="button" @click="save"><Check :size="14" />保存文案</button></template>
  </ModalDialog>
</template>

<style scoped>
.message-editor-note { display: flex; align-items: flex-start; padding: 12px 14px; margin-bottom: 15px; gap: 9px; border-radius: var(--radius-md); background: #eff6ff; color: #1d4ed8; }
.message-editor-note svg { flex: none; margin-top: 1px; }
.message-editor-note strong { display: block; font-size: 10px; }
.message-editor-note p { margin: 3px 0 0; font-size: 9px; line-height: 1.55; }
.message-editor-risk { display: flex; align-items: flex-start; padding: 12px 14px; margin: -5px 0 15px; gap: 9px; border: 1px solid #f5c86d; border-radius: var(--radius-md); background: #fff8df; color: #a36100; }
.message-editor-risk svg { flex: none; margin-top: 1px; }
.message-editor-risk strong { display: block; font-size: 10px; }
.message-editor-risk p { margin: 3px 0 0; color: #85520b; font-size: 9px; line-height: 1.55; }
.message-editor-grid { display: grid; grid-template-columns: minmax(270px, .82fr) minmax(0, 1.18fr); gap: 14px; }
.message-editor-card { padding: 15px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.message-editor-card > header { display: flex; justify-content: space-between; padding-bottom: 11px; margin-bottom: 13px; border-bottom: 1px solid var(--border); }
.message-editor-card > header span { color: var(--text-strong); font-size: 11px; font-weight: 800; }
.message-editor-card > header small { color: var(--text-faint); font-size: 8px; }
.message-editor-card em { color: var(--brand); font-style: normal; }
.message-editor-card dl { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 0; gap: 8px; }
.message-editor-card dl > div { padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.message-editor-card dt { color: var(--text-faint); font-size: 8px; }
.message-editor-card dd { margin: 4px 0 0; color: var(--text-subtle); font-size: 10px; font-weight: 750; line-height: 1.45; }
.message-node-context { grid-column: 1 / -1; }
.message-variables { padding: 11px; margin-top: 11px; border-radius: var(--radius-md); background: var(--brand-50); color: var(--brand-dark); }
.message-variables > header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 9px; border-bottom: 1px solid rgba(245,124,0,.18); }
.message-variables > header span { display: block; font-size: 9px; font-weight: 800; }
.message-variables > header small { display: block; margin-top: 2px; color: var(--text-faint); font-size: 7px; }
.message-variables > header b { padding: 3px 6px; border-radius: var(--radius-pill); background: var(--surface); font-family: var(--font-mono); font-size: 7px; }
.message-variable-groups { display: grid; max-height: 265px; padding-top: 10px; gap: 10px; overflow-y: auto; }
.message-variable-group > strong { display: block; margin-bottom: 6px; color: var(--text-muted); font-size: 8px; }
.message-variable-group > div { display: flex; flex-wrap: wrap; gap: 5px; }
.message-variable-group button { display: inline-flex; align-items: center; padding: 5px 7px; gap: 5px; border: 1px solid #ffd3a8; border-radius: 7px; background: var(--surface); color: var(--brand-dark); cursor: pointer; }
.message-variable-group button:hover { border-color: var(--brand); background: #fff0df; transform: translateY(-1px); }
.message-variable-group button span { font-size: 8px; font-weight: 750; }
.message-variable-group code { font-family: var(--font-mono); font-size: 7px; }
.message-variable-group code i { font-style: normal; }
.message-variables > p { margin: 12px 0 3px; color: var(--text-faint); font-size: 8px; text-align: center; }
.message-editor-card--content textarea { width: 100%; min-height: 154px; padding: 13px; border: 1px solid var(--border); border-radius: var(--radius-md); outline: 0; resize: vertical; background: var(--surface); color: var(--text-subtle); font: inherit; font-size: 10px; line-height: 1.7; }
.message-editor-card--content textarea:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(245,124,0,.1); }
.message-preview { padding: 11px; margin-top: 10px; border-radius: var(--radius-md); background: var(--ink-50); }
.message-preview small { color: var(--text-faint); font-size: 8px; }
.message-preview p { width: fit-content; max-width: 90%; padding: 9px 11px; margin: 6px 0 0; border-radius: 10px 10px 10px 2px; background: var(--surface); color: var(--text-subtle); font-size: 9px; box-shadow: var(--shadow-sm); }
.message-preview p mark { padding: 1px 3px; border-radius: 3px; background: #fee2e2; color: #dc2626; font-family: var(--font-mono); }
.message-preview > span { display: block; margin-top: 7px; color: var(--text-faint); font-size: 7px; }
.message-editor-error { display: flex; align-items: center; padding: 10px 12px; margin: 14px 0 0; gap: 7px; border-radius: var(--radius-md); background: #fff1f2; color: #dc2626; font-size: 9px; }
@media (max-width: 720px) { .message-editor-grid { grid-template-columns: 1fr; } }
</style>
