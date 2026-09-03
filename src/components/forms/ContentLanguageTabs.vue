<script setup lang="ts">
export type ContentLanguage = 'zh' | 'en'

defineProps<{
  modelValue: ContentLanguage
  compact?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ContentLanguage]
}>()
</script>

<template>
  <div class="content-language-tabs" :class="{ 'content-language-tabs--compact': compact }">
    <div role="tablist" aria-label="App 展示语言">
      <button
        type="button"
        role="tab"
        :aria-selected="modelValue === 'zh'"
        :class="{ 'is-active': modelValue === 'zh' }"
        @click="emit('update:modelValue', 'zh')"
      >
        <strong>中文</strong>
        <small>Chinese</small>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="modelValue === 'en'"
        :class="{ 'is-active': modelValue === 'en' }"
        @click="emit('update:modelValue', 'en')"
      >
        <strong>English</strong>
        <small>英文</small>
      </button>
    </div>
    <p v-if="!compact">仅管理 App 对外展示的运营文案；金额、状态、排序和时间等字段共享一份配置。</p>
  </div>
</template>

<style scoped>
.content-language-tabs { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; margin-bottom: 14px; gap: 14px; border: 1px solid #dce6ed; border-radius: var(--radius-lg); background: linear-gradient(180deg, #f8fafb, #f3f7f9); }
.content-language-tabs > div { display: inline-flex; padding: 3px; gap: 3px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); box-shadow: var(--shadow-sm); }
.content-language-tabs button { display: flex; min-width: 96px; min-height: 34px; align-items: center; justify-content: center; padding: 5px 14px; gap: 6px; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-muted); cursor: pointer; }
.content-language-tabs button strong { font-size: 9px; }
.content-language-tabs button small { color: var(--text-faint); font-size: 7px; }
.content-language-tabs button.is-active { background: var(--ink-700); color: #fff; box-shadow: 0 3px 10px rgba(9, 35, 61, .18); }
.content-language-tabs button.is-active small { color: var(--ink-200); }
.content-language-tabs > p { margin: 0; color: var(--text-faint); font-size: 8px; line-height: 1.5; text-align: right; }
.content-language-tabs--compact { justify-content: flex-start; padding: 0; margin-bottom: 12px; border: 0; background: transparent; }
.content-language-tabs--compact button { min-width: 84px; min-height: 30px; }
@media (max-width: 620px) { .content-language-tabs { align-items: flex-start; flex-direction: column; } .content-language-tabs > p { text-align: left; } }
</style>
