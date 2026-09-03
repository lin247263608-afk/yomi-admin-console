<script setup lang="ts">
import { CalendarRange, Megaphone, Pencil } from '@lucide/vue'
import { computed, ref } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ContentLanguageTabs, { type ContentLanguage } from '@/components/forms/ContentLanguageTabs.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

const props = defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: []; edit: [] }>()
const contentLanguage = ref<ContentLanguage>('zh')
const localized = computed(() => contentLanguage.value === 'en'
  ? { title: String(props.row.titleEn ?? '待配置 English 公告标题'), subtitle: String(props.row.subtitleEn ?? '—'), content: String(props.row.contentEn ?? '待配置 English 公告内容') }
  : { title: String(props.row.title ?? '—'), subtitle: String(props.row.subtitle ?? '—'), content: String(props.row.content ?? '—') })
</script>

<template>
  <ModalDialog :title="`公告详情 · ${row.id}`" eyebrow="NOTICE DETAIL" size="wide" @close="emit('close')">
    <section class="notice-detail-hero">
      <span><Megaphone :size="20" /></span>
      <div><small>{{ row.channel }}</small><h3>{{ localized.title }}</h3><p>{{ localized.subtitle }}</p></div>
      <StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '启用' ? 'success' : row.status === '待生效' ? 'warning' : 'danger'" dot />
    </section>
    <ContentLanguageTabs v-model="contentLanguage" compact />

    <div class="notice-detail-grid">
      <div><span>公告 ID</span><strong class="mono">{{ row.id }}</strong></div>
      <div><span>发布端</span><strong>{{ row.channel }}</strong></div>
      <div><span>排序</span><strong class="mono">{{ row.sort ?? '—' }}</strong></div>
      <div><span>状态</span><strong>{{ row.status }}</strong></div>
      <div class="notice-detail-grid__wide"><span>{{ contentLanguage === 'zh' ? '公告标题（中文）' : 'Notice title (English)' }}</span><strong>{{ localized.title }}</strong></div>
      <div class="notice-detail-grid__wide"><span>{{ contentLanguage === 'zh' ? '副标题（中文）' : 'Subtitle (English)' }}</span><strong>{{ localized.subtitle }}</strong></div>
      <div><span>生效开始</span><strong class="notice-date"><CalendarRange :size="13" />{{ row.validFrom }}</strong></div>
      <div><span>生效结束</span><strong class="notice-date"><CalendarRange :size="13" />{{ row.validTo }}</strong></div>
    </div>

    <section class="notice-content-preview">
      <header><div><span>RICH TEXT CONTENT</span><h4>富文本内容</h4></div><small>发布端实际展示预览</small></header>
      <div class="notice-content-preview__body"><p v-for="(paragraph, index) in localized.content.split('\n').filter(Boolean)" :key="index">{{ paragraph }}</p></div>
    </section>

    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button><button class="btn btn--brand" type="button" @click="emit('edit')"><Pencil :size="14" />编辑公告</button></template>
  </ModalDialog>
</template>

<style scoped>
.notice-detail-hero { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; padding: 16px; gap: 12px; border-radius: var(--radius-lg); background: linear-gradient(125deg, var(--ink-900), #17324d); color: #fff; }
.notice-detail-hero > span { display: inline-flex; width: 42px; height: 42px; align-items: center; justify-content: center; border-radius: 14px; background: rgba(255,122,0,.16); color: var(--brand-light); }
.notice-detail-hero small { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; }
.notice-detail-hero h3 { margin: 3px 0 0; font-family: var(--font-display); font-size: 17px; }
.notice-detail-hero p { margin: 3px 0 0; color: var(--ink-200); font-size: 9px; }
.notice-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 14px; gap: 9px; }
.notice-detail-grid > div { min-width: 0; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.notice-detail-grid__wide { grid-column: span 2; }
.notice-detail-grid span { display: block; color: var(--text-faint); font-size: 8px; }
.notice-detail-grid strong { display: block; overflow-wrap: anywhere; margin-top: 5px; color: var(--text-subtle); font-size: 10px; line-height: 1.55; }
.notice-date { display: flex !important; align-items: center; gap: 6px; }
.notice-content-preview { margin-top: 14px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.notice-content-preview > header { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--border); }
.notice-content-preview > header span { color: var(--brand-dark); font-family: var(--font-mono); font-size: 7px; letter-spacing: .12em; }
.notice-content-preview h4 { margin: 2px 0 0; color: var(--text-strong); font-size: 11px; }
.notice-content-preview > header small { color: var(--text-faint); font-size: 8px; }
.notice-content-preview__body { min-height: 145px; padding: 18px; color: var(--text-subtle); font-size: 10px; line-height: 1.85; }
.notice-content-preview__body p { margin: 0 0 9px; }
@media (max-width: 680px) { .notice-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 440px) { .notice-detail-grid { grid-template-columns: 1fr; } .notice-detail-grid__wide { grid-column: auto; } }
</style>
