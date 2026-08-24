<script setup lang="ts">
import { computed } from 'vue'

import SidebarNav from '@/components/navigation/SidebarNav.vue'
import Topbar from '@/components/navigation/Topbar.vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const shellClass = computed(() => ({
  'sidebar-collapsed': appStore.sidebarCollapsed,
  'mobile-nav-open': appStore.mobileMenuOpen,
}))
</script>

<template>
  <div class="app-shell" :class="shellClass">
    <SidebarNav />
    <div class="page-content">
      <Topbar />
      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>
