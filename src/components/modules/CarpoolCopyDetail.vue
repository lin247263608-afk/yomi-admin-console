<script setup lang="ts">
import { MessageCircle, Pencil } from '@lucide/vue'
import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: []; edit: [] }>()
</script>

<template>
  <ModalDialog :title="`默认语详情 · ${row.id}`" eyebrow="CARPOOL COPY DETAIL" size="wide" @close="emit('close')">
    <section class="copy-detail-hero"><span><MessageCircle :size="20" /></span><div><small>{{ row.endpoint }} / {{ row.node }}</small><h3>{{ row.content }}</h3><p>拼车团快捷消息模板</p></div><StatusBadge :label="String(row.status)" :tone="row.status === '启用' ? 'success' : 'danger'" dot /></section>
    <div class="copy-detail-grid"><div><span>模板 ID</span><strong class="mono">{{ row.id }}</strong></div><div><span>生效端</span><strong>{{ row.endpoint }}</strong></div><div><span>节点</span><strong>{{ row.node }}</strong></div><div><span>排序</span><strong class="mono">{{ row.sort }}</strong></div></div>
    <section class="copy-detail-content"><header><span>模板内容</span><small>客户端发送预览</small></header><div><MessageCircle :size="15" /><p>{{ row.content }}</p></div></section>
    <section class="copy-detail-rule"><strong>生效规则</strong><p>模板只在“{{ row.endpoint }} · {{ row.node }}”阶段展示；行程结束后拼车团自动关闭，历史消息仍保留用于客诉与纠纷核查。</p></section>
    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button><button class="btn btn--brand" type="button" @click="emit('edit')"><Pencil :size="14" />编辑模板</button></template>
  </ModalDialog>
</template>

<style scoped>
.copy-detail-hero { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; padding: 16px; gap: 12px; border-radius: var(--radius-lg); background: linear-gradient(125deg, var(--ink-900), #17324d); color: #fff; }
.copy-detail-hero > span { display: inline-flex; width: 42px; height: 42px; align-items: center; justify-content: center; border-radius: 14px; background: rgba(255,122,0,.16); color: var(--brand-light); }
.copy-detail-hero small { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; }
.copy-detail-hero h3 { margin: 4px 0 0; font-size: 13px; }
.copy-detail-hero p { margin: 4px 0 0; color: var(--ink-200); font-size: 8px; }
.copy-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 14px; gap: 9px; }
.copy-detail-grid > div { padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.copy-detail-grid span, .copy-detail-content small { color: var(--text-faint); font-size: 8px; }
.copy-detail-grid strong { display: block; margin-top: 5px; color: var(--text-subtle); font-size: 10px; }
.copy-detail-content { margin-top: 14px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.copy-detail-content header { display: flex; justify-content: space-between; padding: 11px 13px; border-bottom: 1px solid var(--border); }
.copy-detail-content header span { color: var(--text-strong); font-size: 10px; font-weight: 800; }
.copy-detail-content > div { display: flex; align-items: flex-end; padding: 22px; gap: 9px; background: var(--ink-50); }
.copy-detail-content > div > svg { color: var(--ink-500); }
.copy-detail-content p { max-width: 78%; padding: 10px 12px; margin: 0; border-radius: 12px 12px 12px 3px; background: var(--surface); color: var(--text-subtle); font-size: 10px; box-shadow: var(--shadow-sm); }
.copy-detail-rule { padding: 12px 14px; margin-top: 14px; border-radius: var(--radius-md); background: var(--brand-50); color: var(--brand-dark); }
.copy-detail-rule strong { font-size: 10px; }
.copy-detail-rule p { margin: 3px 0 0; color: var(--text-muted); font-size: 9px; line-height: 1.55; }
@media (max-width: 620px) { .copy-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
</style>
