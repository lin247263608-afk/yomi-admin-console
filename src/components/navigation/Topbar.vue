<script setup lang="ts">
import { Bell, ChevronRight, Clock3, Menu, Search } from '@lucide/vue'
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { moduleTitleBySlug, navigation } from '@/data/navigation'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const searchTerm = ref('')
const searchFocused = ref(false)
const searchContainer = ref<HTMLElement | null>(null)
const currentTime = ref(new Date())
let timeRefreshTimer: number | undefined

const londonTime = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(currentTime.value),
)

const pageMeta = computed(() => {
  const moduleMeta = typeof route.params.section === 'string' ? moduleTitleBySlug[route.params.section] : undefined
  const routeTitle = typeof route.meta.title === 'string' ? route.meta.title : moduleMeta?.title ?? '运营中枢'
  const routeGroup = typeof route.meta.group === 'string' ? route.meta.group : moduleMeta?.group ?? '有米出行'
  return { title: routeTitle, group: routeGroup }
})

const searchResults = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  if (!term) return []
  return navigation
    .flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })))
    .filter((item) => `${item.label}${item.group}`.toLowerCase().includes(term))
    .slice(0, 5)
})

function chooseResult(path: string) {
  router.push(path)
  searchTerm.value = ''
  searchFocused.value = false
  appStore.closeMobileMenu()
}

function closeSearchOnOutsidePointer(event: PointerEvent) {
  if (!searchContainer.value?.contains(event.target as Node)) searchFocused.value = false
}

function closeSearchOnFocusLeave(event: FocusEvent) {
  const nextTarget = event.relatedTarget
  if (nextTarget instanceof Node && !searchContainer.value?.contains(nextTarget)) {
    searchFocused.value = false
    return
  }

  if (nextTarget) return
  window.setTimeout(() => {
    if (!searchContainer.value?.contains(document.activeElement)) searchFocused.value = false
  }, 0)
}

onMounted(() => {
  timeRefreshTimer = window.setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
  document.addEventListener('pointerdown', closeSearchOnOutsidePointer)
})

onUnmounted(() => {
  if (timeRefreshTimer !== undefined) window.clearInterval(timeRefreshTimer)
  document.removeEventListener('pointerdown', closeSearchOnOutsidePointer)
})
</script>

<template>
  <header class="topbar">
    <button
      class="icon-button icon-button--mobile"
      type="button"
      aria-label="打开导航"
      @click="appStore.toggleMobileMenu"
    >
      <Menu :size="18" />
    </button>

    <div class="topbar__crumbs">
      <span>{{ pageMeta.group }}</span>
      <ChevronRight :size="13" />
      <strong>{{ pageMeta.title }}</strong>
    </div>

    <div class="topbar__actions">
      <div class="topbar__timezone">
        <Clock3 :size="14" />
        <span>英国时间 · {{ londonTime }}</span>
      </div>

      <div ref="searchContainer" class="topbar__search" @focusout="closeSearchOnFocusLeave">
        <Search :size="15" />
        <input
          v-model="searchTerm"
          type="search"
          placeholder="搜索后台菜单"
          aria-label="搜索后台菜单"
          @focus="searchFocused = true"
          @keydown.esc="searchFocused = false"
        />
        <div v-if="searchFocused && searchResults.length" class="search-results">
          <button v-for="item in searchResults" :key="item.path" type="button" @click="chooseResult(item.path)">
            <Search :size="14" :stroke-width="1.8" />
            <span>
              {{ item.label }}
              <small>{{ item.group }}</small>
            </span>
          </button>
        </div>
      </div>

      <button class="icon-button notification-button" type="button" aria-label="查看通知" @click="appStore.notify('暂无新的系统通知', '所有待处理事项已在对应模块中标记。', 'info')">
        <Bell :size="17" />
      </button>

      <button class="admin-profile" type="button" aria-label="打开管理员菜单" @click="appStore.notify('当前账号：Ava Chen', '角色：超级管理员 · 权限范围：全量模块', 'info')">
        <span class="admin-avatar">AC</span>
        <span class="admin-profile__copy">
          <span class="admin-profile__name">Ava Chen</span>
          <span class="admin-profile__role">超级管理员</span>
        </span>
      </button>
    </div>
  </header>
</template>
