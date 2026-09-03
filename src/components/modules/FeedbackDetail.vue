<script setup lang="ts">
import { computed } from 'vue'
import { Image, MessageSquareText, UserRound } from '@lucide/vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: []; advance: [] }>()

const flow = ['待处理', '已接收', '处理中', '已完结']
const currentIndex = computed(() => Math.max(0, flow.indexOf(String(props.row.status))))
const nextStatus = computed(() => flow[currentIndex.value + 1] ?? '')
const attachmentCount = computed(() => Number(props.row.attachmentCount ?? 0))
</script>

<template>
  <ModalDialog :title="`意见反馈 · ${row.id}`" eyebrow="FEEDBACK DETAIL" size="wide" @close="emit('close')">
    <section class="feedback-head">
      <span><MessageSquareText :size="21" /></span>
      <div><small>{{ row.feedbackType }}</small><h3>{{ row.submitter }} · {{ row.identity }}</h3><p>{{ row.userId }} · {{ row.contact }}</p></div>
      <StatusBadge :label="String(row.status)" :tone="row.status === '已完结' ? 'success' : 'warning'" dot />
    </section>

    <section class="feedback-flow" aria-label="反馈处理进度">
      <div v-for="(item, index) in flow" :key="item" :class="{ 'is-done': index <= currentIndex }"><i>{{ index + 1 }}</i><span>{{ item }}</span></div>
    </section>

    <div class="feedback-layout">
      <section class="feedback-content">
        <header><span>反馈内容</span><small>提交于 {{ row.submittedAt }}</small></header>
        <p>{{ row.content }}</p>
      </section>
      <aside class="feedback-meta">
        <div><span>反馈类型</span><strong>{{ row.feedbackType }}</strong></div>
        <div><span>提交人身份</span><strong>{{ row.identity }}</strong></div>
        <div><span>联系方式</span><strong>{{ row.contact }}</strong></div>
        <div><span>提交时间</span><strong class="mono">{{ row.submittedAt }}</strong></div>
      </aside>
    </div>

    <section class="feedback-attachments">
      <header><div><Image :size="15" /><strong>反馈图片</strong></div><small>{{ attachmentCount ? `${attachmentCount} 张` : '无附件' }}</small></header>
      <div v-if="attachmentCount" class="feedback-attachments__grid">
        <button v-for="index in attachmentCount" :key="index" type="button" :aria-label="`查看附件 ${index}`"><Image :size="22" /><span>附件 {{ index }}</span><small>点击预览</small></button>
      </div>
      <p v-else>该反馈未上传图片。</p>
    </section>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button>
      <button v-if="nextStatus" class="btn btn--brand" type="button" @click="emit('advance')">标记{{ nextStatus }}</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.feedback-head { display: flex; align-items: center; padding: 16px 18px; gap: 12px; border-radius: var(--radius-lg); background: linear-gradient(110deg, var(--ink-900), var(--ink-700)); color: #fff; }
.feedback-head > span { display: grid; width: 42px; height: 42px; flex: none; place-items: center; border: 1px solid rgba(255,255,255,.14); border-radius: 13px; background: rgba(255,255,255,.07); color: var(--brand-light); }
.feedback-head > div { min-width: 0; flex: 1; }.feedback-head small { color: var(--brand-light); font-size: 8px; }.feedback-head h3 { margin: 3px 0 2px; font-size: 16px; }.feedback-head p { margin: 0; color: var(--ink-300); font-size: 9px; }
.feedback-flow { display: grid; grid-template-columns: repeat(4, 1fr); padding: 14px; margin-top: 14px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.feedback-flow div { position: relative; display: flex; align-items: center; gap: 7px; color: var(--text-faint); font-size: 9px; font-weight: 700; }.feedback-flow div:not(:last-child)::after { position: absolute; right: 10px; left: 62px; height: 1px; background: var(--border); content: ''; }.feedback-flow i { display: grid; z-index: 1; width: 23px; height: 23px; place-items: center; border-radius: 50%; background: var(--ink-100); font-size: 8px; font-style: normal; }.feedback-flow .is-done { color: var(--success); }.feedback-flow .is-done i { background: var(--success-bg); }
.feedback-layout { display: grid; grid-template-columns: 1.55fr 1fr; margin-top: 14px; gap: 12px; }.feedback-content,.feedback-meta,.feedback-attachments { border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }.feedback-content { padding: 15px; }.feedback-content header,.feedback-attachments header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }.feedback-content header span { color: var(--text-strong); font-size: 10px; font-weight: 800; }.feedback-content header small,.feedback-attachments header small { color: var(--text-faint); font-size: 8px; }.feedback-content p { margin: 13px 0 0; color: var(--text-subtle); font-size: 10px; line-height: 1.8; }
.feedback-meta { display: grid; grid-template-columns: repeat(2, 1fr); padding: 11px; gap: 8px; }.feedback-meta div { min-width: 0; padding: 9px; border-radius: var(--radius-md); background: var(--page); }.feedback-meta span,.feedback-meta strong { display: block; }.feedback-meta span { color: var(--text-faint); font-size: 8px; }.feedback-meta strong { margin-top: 4px; overflow-wrap: anywhere; color: var(--text-subtle); font-size: 9px; }
.feedback-attachments { padding: 14px; margin-top: 12px; }.feedback-attachments header div { display: flex; align-items: center; gap: 6px; color: var(--text-strong); font-size: 10px; }.feedback-attachments__grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); margin-top: 11px; gap: 8px; }.feedback-attachments__grid button { display: grid; min-height: 90px; place-items: center; align-content: center; border: 1px dashed var(--ink-200); border-radius: var(--radius-md); background: var(--ink-50); color: var(--ink-500); cursor: pointer; }.feedback-attachments__grid span { margin-top: 6px; color: var(--text-subtle); font-size: 9px; font-weight: 750; }.feedback-attachments__grid small { margin-top: 2px; color: var(--text-faint); font-size: 7px; }.feedback-attachments > p { margin: 12px 0 0; color: var(--text-faint); font-size: 9px; }
@media (max-width: 720px) { .feedback-layout { grid-template-columns: 1fr; }.feedback-attachments__grid { grid-template-columns: repeat(3, 1fr); } }
</style>
