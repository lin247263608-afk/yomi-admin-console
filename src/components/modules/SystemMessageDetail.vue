<script setup lang="ts">
import { BellRing, Pencil } from '@lucide/vue'
import { computed } from 'vue'
import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'
import { contextLabels, nodeContexts } from '@/data/messageVariables'

const props = defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: []; edit: [] }>()
const boundContexts = computed(() => (nodeContexts[String(props.row.node ?? '')] ?? []).map((context) => contextLabels[context]))
const contentParts = computed(() => String(props.row.content ?? '').split(/(\{[A-Za-z][A-Za-z0-9]*\})/g).filter(Boolean).map((text) => ({ text, variable: /^\{[A-Za-z][A-Za-z0-9]*\}$/.test(text) })))
</script>

<template>
  <ModalDialog :title="`系统消息详情 · ${row.id}`" eyebrow="SYSTEM MESSAGE DETAIL" size="wide" @close="emit('close')">
    <section class="message-detail-hero"><span><BellRing :size="20" /></span><div><small>{{ row.endpoint }} / {{ row.group }}</small><h3>{{ row.node }}</h3><p>{{ row.triggerAt }}</p></div><StatusBadge :label="String(row.status)" :tone="row.status === '启用' ? 'success' : 'danger'" dot /></section>
    <div class="message-detail-grid"><div><span>消息 ID</span><strong class="mono">{{ row.id }}</strong></div><div><span>发布端</span><strong>{{ row.endpoint }}</strong></div><div><span>节点分组</span><strong>{{ row.group }}</strong></div><div><span>发送节点</span><strong>{{ row.node }}</strong></div><div class="message-detail-grid__wide"><span>触发时机</span><strong>{{ row.triggerAt }}</strong></div><div class="message-detail-grid__wide"><span>绑定上下文</span><strong>{{ boundContexts.join('、') || '无' }}</strong></div></div>
    <section class="message-detail-content"><header><span>消息模板内容</span><small>变量以高亮标签展示</small></header><div><BellRing :size="15" /><p><template v-for="(part, index) in contentParts" :key="index"><code v-if="part.variable">{{ part.text }}</code><template v-else>{{ part.text }}</template></template></p></div></section>
    <section class="message-detail-rule"><strong>节点约束</strong><p>该节点由系统预置，不能新增或改名。禁用后仅停止后续触发，不影响已发送消息与历史记录。</p></section>
    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button><button class="btn btn--brand" type="button" @click="emit('edit')"><Pencil :size="14" />编辑文案</button></template>
  </ModalDialog>
</template>

<style scoped>
.message-detail-hero { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; padding: 16px; gap: 12px; border-radius: var(--radius-lg); background: linear-gradient(125deg, var(--ink-900), #17324d); color: #fff; }
.message-detail-hero > span { display: inline-flex; width: 42px; height: 42px; align-items: center; justify-content: center; border-radius: 14px; background: rgba(255,122,0,.16); color: var(--brand-light); }
.message-detail-hero small { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; }
.message-detail-hero h3 { margin: 3px 0 0; font-size: 15px; }
.message-detail-hero p { margin: 4px 0 0; color: var(--ink-200); font-size: 8px; }
.message-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 14px; gap: 9px; }
.message-detail-grid > div { padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.message-detail-grid__wide { grid-column: span 2; }
.message-detail-grid span, .message-detail-content small { color: var(--text-faint); font-size: 8px; }
.message-detail-grid strong { display: flex; align-items: center; margin-top: 5px; gap: 5px; color: var(--text-subtle); font-size: 10px; line-height: 1.5; }
.message-detail-content { margin-top: 14px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.message-detail-content header { display: flex; justify-content: space-between; padding: 11px 13px; border-bottom: 1px solid var(--border); }
.message-detail-content header span { color: var(--text-strong); font-size: 10px; font-weight: 800; }
.message-detail-content > div { display: flex; align-items: flex-end; padding: 22px; gap: 9px; background: var(--ink-50); }
.message-detail-content > div > svg { color: var(--ink-500); }
.message-detail-content p { max-width: 82%; padding: 10px 12px; margin: 0; border-radius: 12px 12px 12px 3px; background: var(--surface); color: var(--text-subtle); font-size: 10px; box-shadow: var(--shadow-sm); }
.message-detail-content p code { display: inline-flex; padding: 2px 5px; margin: 1px 2px; border: 1px solid #ffd3a8; border-radius: 6px; background: var(--brand-50); color: var(--brand-dark); font-family: var(--font-mono); font-size: 8px; font-weight: 700; }
.message-detail-rule { padding: 12px 14px; margin-top: 14px; border-radius: var(--radius-md); background: var(--brand-50); color: var(--brand-dark); }
.message-detail-rule strong { font-size: 10px; }
.message-detail-rule p { margin: 3px 0 0; color: var(--text-muted); font-size: 9px; line-height: 1.55; }
@media (max-width: 680px) { .message-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .message-detail-grid__wide { grid-column: auto; } }
</style>
