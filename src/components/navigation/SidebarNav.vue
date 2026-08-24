<script setup lang="ts">
import { ChevronDown, ChevronRight, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BrandLogo from '@/components/brand/BrandLogo.vue'
import { navigation } from '@/data/navigation'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const expandedGroups = ref(new Set(['dashboard', 'users', 'orders']))

const activeGroupId = computed(() => {
  const path = route.path
  return navigation.find((group) => group.items.some((item) => item.path === path))?.id ?? 'dashboard'
})

watch(
  activeGroupId,
  (groupId) => {
    expandedGroups.value.add(groupId)
  },
  { immediate: true },
)

function isActive(path: string) {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path === path || route.path.startsWith(`${path}/`)
}

function toggleGroup(id: string) {
  const next = new Set(expandedGroups.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expandedGroups.value = next
}

function navigate(path: string) {
  router.push(path)
  appStore.closeMobileMenu()
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--collapsed': appStore.sidebarCollapsed }">
    <div class="sidebar__top">
      <RouterLink to="/dashboard" class="sidebar__brand" @click="appStore.closeMobileMenu">
        <BrandLogo :compact="appStore.sidebarCollapsed" />
      </RouterLink>
      <button
        class="icon-button sidebar__close"
        type="button"
        aria-label="关闭导航"
        @click="appStore.closeMobileMenu"
      >
        <X :size="18" />
      </button>
    </div>

    <nav class="sidebar__nav" aria-label="后台主导航">
      <div v-for="group in navigation" :key="group.id" class="nav-group">
        <button
          class="nav-group__label"
          type="button"
          :aria-expanded="expandedGroups.has(group.id)"
          :title="appStore.sidebarCollapsed ? group.label : undefined"
          @click="toggleGroup(group.id)"
        >
          <component :is="group.icon" :size="17" :stroke-width="1.8" />
          <span>{{ group.label }}</span>
          <ChevronDown
            v-if="!appStore.sidebarCollapsed"
            class="nav-group__chevron"
            :class="{ 'is-open': expandedGroups.has(group.id) }"
            :size="14"
          />
        </button>

        <div v-if="expandedGroups.has(group.id) && !appStore.sidebarCollapsed" class="nav-group__items">
          <button
            v-for="item in group.items"
            :key="item.path"
            class="nav-item"
            :class="{ 'is-active': isActive(item.path) }"
            type="button"
            @click="navigate(item.path)"
          >
            <span class="nav-item__dot" aria-hidden="true"></span>
            <span class="nav-item__label">{{ item.label }}</span>
            <span v-if="item.badge" class="nav-item__badge">{{ item.badge }}</span>
          </button>
        </div>

        <button
          v-else-if="appStore.sidebarCollapsed"
          class="nav-collapsed-active"
          :class="{ 'is-active': group.id === activeGroupId }"
          type="button"
          :title="group.label"
          @click="toggleGroup(group.id)"
        >
          <span v-for="item in group.items" :key="item.path" class="nav-collapsed-active__item" @click.stop="navigate(item.path)">
            <ChevronRight v-if="isActive(item.path)" :size="11" />
          </span>
        </button>
      </div>
    </nav>

    <div class="sidebar__footer">
      <div class="sidebar__status-dot"></div>
      <div v-if="!appStore.sidebarCollapsed" class="sidebar__status-copy">
        <strong>系统运行正常</strong>
        <span>Europe/London · v0.1</span>
      </div>
    </div>
  </aside>
  <button
    v-if="appStore.mobileMenuOpen"
    class="sidebar-backdrop"
    type="button"
    aria-label="关闭导航"
    @click="appStore.closeMobileMenu"
  ></button>
</template>

<style scoped>
.sidebar {
  position: fixed;
  z-index: 50;
  top: 0;
  bottom: 0;
  left: 0;
  display: flex;
  width: var(--sidebar-width);
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--ink-950);
  color: var(--ink-300);
  transition: width var(--motion-normal), transform var(--motion-normal);
}

.sidebar--collapsed {
  width: var(--sidebar-collapsed-width);
}

.sidebar__top {
  display: flex;
  align-items: center;
  min-height: 76px;
  padding: 0 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar__brand {
  min-width: 0;
}

.sidebar__close {
  display: none;
  margin-left: auto;
  color: var(--ink-300);
}

.sidebar__nav {
  flex: 1;
  overflow-y: auto;
  padding: 14px 10px 18px;
}

.sidebar__nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar__nav::-webkit-scrollbar-thumb {
  background: rgba(157, 184, 212, 0.22);
}

.nav-group {
  margin-bottom: 4px;
}

.nav-group__label {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 38px;
  padding: 0 10px;
  gap: 10px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--ink-300);
  font-size: 12px;
  font-weight: 700;
  text-align: left;
  transition: background var(--motion-fast), color var(--motion-fast);
}

.nav-group__label:hover,
.nav-group__label:focus-visible {
  background: rgba(227, 237, 245, 0.09);
  color: #fff;
}

.nav-group__label > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-group__chevron {
  margin-left: auto;
  opacity: 0.7;
  transition: transform var(--motion-fast);
}

.nav-group__chevron.is-open {
  transform: rotate(180deg);
}

.nav-group__items {
  position: relative;
  padding: 2px 0 6px 25px;
}

.nav-group__items::before {
  position: absolute;
  top: 4px;
  bottom: 10px;
  left: 16px;
  width: 1px;
  background: rgba(157, 184, 212, 0.18);
  content: '';
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 34px;
  padding: 0 8px 0 13px;
  gap: 8px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--ink-400);
  font-size: 11px;
  text-align: left;
  transition: background var(--motion-fast), color var(--motion-fast);
}

.nav-item:hover {
  background: rgba(227, 237, 245, 0.08);
  color: #fff;
}

.nav-item.is-active {
  background: rgba(227, 237, 245, 0.13);
  color: #fff;
}

.nav-item__dot {
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: var(--ink-500);
  opacity: 0.65;
}

.nav-item.is-active .nav-item__dot {
  background: var(--brand-light);
  box-shadow: 0 0 0 3px rgba(245, 124, 0, 0.16);
  opacity: 1;
}

.nav-item__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-item__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 17px;
  padding: 0 4px;
  margin-left: auto;
  border-radius: var(--radius-pill);
  background: rgba(245, 124, 0, 0.18);
  color: var(--brand-light);
  font-family: var(--font-mono);
  font-size: 9px;
}

.nav-collapsed-active {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 10px;
  padding: 0;
  background: transparent;
  color: var(--brand-light);
}

.nav-collapsed-active__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 10px;
}

.sidebar__footer {
  display: flex;
  align-items: center;
  min-height: 66px;
  padding: 0 18px;
  gap: 9px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.sidebar__status-dot {
  width: 7px;
  height: 7px;
  flex: 0 0 7px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.13);
}

.sidebar__status-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  line-height: 1.25;
}

.sidebar__status-copy strong {
  color: var(--ink-200);
  font-size: 10px;
  font-weight: 700;
}

.sidebar__status-copy span {
  margin-top: 3px;
  color: var(--ink-400);
  font-family: var(--font-mono);
  font-size: 9px;
}

.sidebar-backdrop {
  display: none;
}

@media (max-width: 720px) {
  .sidebar {
    width: min(var(--sidebar-width), calc(100vw - 52px));
    transform: translateX(-100%);
  }

  .sidebar:not(.sidebar--collapsed) {
    transform: translateX(-100%);
  }

  .app-shell.mobile-nav-open .sidebar {
    transform: translateX(0);
  }

  .sidebar__close {
    display: inline-flex;
  }

  .sidebar-backdrop {
    position: fixed;
    z-index: 40;
    inset: 0;
    display: block;
    background: rgba(11, 23, 38, 0.42);
  }
}
</style>
