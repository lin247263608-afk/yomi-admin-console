<script setup lang="ts">
import { AlertTriangle, CheckCircle2, Info, XCircle } from '@lucide/vue'

import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>

<template>
  <div class="toast-viewport" aria-live="polite">
    <div v-for="toast in appStore.toasts" :key="toast.id" class="toast" :class="`toast--${toast.tone}`">
      <span class="toast__icon">
        <CheckCircle2 v-if="toast.tone === 'success'" :size="15" />
        <Info v-else-if="toast.tone === 'info'" :size="15" />
        <AlertTriangle v-else-if="toast.tone === 'warning'" :size="15" />
        <XCircle v-else :size="15" />
      </span>
      <span>
        <strong class="toast__title">{{ toast.title }}</strong>
        <span v-if="toast.description" class="toast__description">{{ toast.description }}</span>
      </span>
      <button class="icon-button" type="button" aria-label="关闭提示" @click="appStore.dismissToast(toast.id)">
        ×
      </button>
    </div>
  </div>
</template>
