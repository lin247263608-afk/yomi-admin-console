<script setup lang="ts">
import { ExternalLink, Pencil } from '@lucide/vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

defineProps<{ row: ModuleRow }>()
const emit = defineEmits<{ close: []; edit: [] }>()
</script>

<template>
  <ModalDialog :title="`Banner 详情 · ${row.id}`" eyebrow="BANNER DETAIL" size="wide" @close="emit('close')">
    <section class="banner-preview"><img :src="String(row.image ?? '')" :alt="`${String(row.name)} Banner`" /><div><span>{{ row.channel }}</span><strong>{{ row.name }}</strong><p>{{ row.description }}</p></div></section>

    <div class="banner-detail-grid">
      <div><span>Banner ID</span><strong class="mono">{{ row.id }}</strong></div>
      <div><span>发布端</span><strong>{{ row.channel }}</strong></div>
      <div><span>排序</span><strong class="mono">{{ row.sort ?? '—' }}</strong></div>
      <div><span>状态</span><StatusBadge :label="String(row.status ?? '—')" :tone="row.status === '启用' ? 'success' : row.status === '待生效' ? 'warning' : 'danger'" dot /></div>
      <div class="banner-detail-grid__wide"><span>Banner 名称</span><strong>{{ row.name }}</strong></div>
      <div class="banner-detail-grid__wide"><span>描述</span><strong>{{ row.description }}</strong></div>
      <div><span>生效开始</span><strong class="mono">{{ row.validFrom }}</strong></div>
      <div><span>生效结束</span><strong class="mono">{{ row.validTo }}</strong></div>
      <div><span>跳转类型</span><strong>{{ row.jumpType }}</strong></div>
      <div><span>当前展示</span><strong>{{ row.status === '启用' ? '已投放' : row.status === '待生效' ? '等待定时生效' : '未投放' }}</strong></div>
      <div v-if="row.jumpType === '链接跳转'" class="banner-detail-grid__full"><span>跳转地址</span><strong class="jump-address"><ExternalLink :size="13" />{{ row.jumpUrl }}</strong></div>
    </div>

    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button><button class="btn btn--brand" type="button" @click="emit('edit')"><Pencil :size="14" />编辑 Banner</button></template>
  </ModalDialog>
</template>

<style scoped>
.banner-preview { position: relative; overflow: hidden; min-height: 235px; border-radius: var(--radius-lg); background: var(--ink-900); }
.banner-preview > img { display: block; width: 100%; height: 235px; object-fit: cover; }
.banner-preview > div { position: absolute; right: 0; bottom: 0; left: 0; padding: 38px 18px 16px; background: linear-gradient(transparent, rgba(5,18,31,.88)); color: #fff; }
.banner-preview span { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; }
.banner-preview strong { display: block; margin-top: 3px; font-family: var(--font-display); font-size: 17px; }
.banner-preview p { margin: 2px 0 0; color: var(--ink-200); font-size: 9px; }
.banner-detail-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding-top: 17px; margin-top: 17px; gap: 10px; border-top: 1px solid var(--border); }
.banner-detail-grid > div { min-width: 0; padding: 12px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.banner-detail-grid__wide { grid-column: span 2; }
.banner-detail-grid__full { grid-column: 1 / -1; }
.banner-detail-grid span { display: block; color: var(--text-faint); font-size: 8px; }
.banner-detail-grid strong { display: block; overflow-wrap: anywhere; margin-top: 5px; color: var(--text-subtle); font-size: 10px; line-height: 1.55; }
.banner-detail-grid .badge { margin-top: 6px; }
.jump-address { display: flex !important; align-items: center; gap: 6px; color: var(--brand-dark) !important; font-family: var(--font-mono); }
@media (max-width: 680px) { .banner-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 440px) { .banner-detail-grid { grid-template-columns: 1fr; } .banner-detail-grid__wide, .banner-detail-grid__full { grid-column: auto; } }
</style>
