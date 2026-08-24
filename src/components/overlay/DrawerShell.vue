<script setup lang="ts">
import { X } from '@lucide/vue'
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

defineProps<{
  title: string
  eyebrow?: string
}>()

const emit = defineEmits<{
  close: []
}>()

const dialog = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function isTopmostOverlay() {
  const overlays = document.querySelectorAll<HTMLElement>('[data-focus-trap-overlay]')
  return overlays.item(overlays.length - 1) === dialog.value
}

function focusableElements() {
  if (!dialog.value) return []
  return [...dialog.value.querySelectorAll<HTMLElement>(focusableSelector)].filter(
    (element) => !element.hasAttribute('hidden') && element.getClientRects().length > 0,
  )
}

function lockBackground() {
  const { body } = document
  const lockCount = Number(body.dataset.overlayLockCount ?? '0')

  if (lockCount === 0) {
    body.dataset.overlayPreviousOverflow = body.style.overflow
    body.dataset.overlayPreviousPaddingRight = body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `calc(${body.style.paddingRight || '0px'} + ${scrollbarWidth}px)`
    }

    const appRoot = document.querySelector<HTMLElement>('#app')
    if (appRoot) {
      appRoot.dataset.overlayPreviousInert = String(appRoot.inert)
      appRoot.inert = true
    }
  }

  body.dataset.overlayLockCount = String(lockCount + 1)
}

function unlockBackground() {
  const { body } = document
  const lockCount = Number(body.dataset.overlayLockCount ?? '0')

  if (lockCount > 1) {
    body.dataset.overlayLockCount = String(lockCount - 1)
    return
  }

  body.style.overflow = body.dataset.overlayPreviousOverflow ?? ''
  body.style.paddingRight = body.dataset.overlayPreviousPaddingRight ?? ''
  delete body.dataset.overlayLockCount
  delete body.dataset.overlayPreviousOverflow
  delete body.dataset.overlayPreviousPaddingRight

  const appRoot = document.querySelector<HTMLElement>('#app')
  if (appRoot) {
    appRoot.inert = appRoot.dataset.overlayPreviousInert === 'true'
    delete appRoot.dataset.overlayPreviousInert
  }
}

function onKeydown(event: KeyboardEvent) {
  if (!isTopmostOverlay()) return

  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopImmediatePropagation()
    emit('close')
    return
  }

  if (event.key !== 'Tab') return

  const elements = focusableElements()
  const first = elements[0]
  const last = elements[elements.length - 1]
  const activeElement = document.activeElement

  if (!first || !last) {
    event.preventDefault()
    dialog.value?.focus()
  } else if (event.shiftKey && (activeElement === first || !dialog.value?.contains(activeElement))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && (activeElement === last || !dialog.value?.contains(activeElement))) {
    event.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
  lockBackground()
  window.addEventListener('keydown', onKeydown)
  nextTick(() => {
    const autofocusTarget = dialog.value?.querySelector<HTMLElement>('[autofocus]')
    const initialFocusTarget = autofocusTarget ?? focusableElements()[0] ?? dialog.value
    initialFocusTarget?.focus()
  })
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  unlockBackground()
  queueMicrotask(() => {
    if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true })
  })
})
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')"></div>
    <aside ref="dialog" class="drawer" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1" data-focus-trap-overlay>
      <header class="drawer__header">
        <div>
          <div v-if="eyebrow" class="page-header__eyebrow">{{ eyebrow }}</div>
          <h2>{{ title }}</h2>
        </div>
        <button class="icon-button" type="button" aria-label="关闭抽屉" @click="emit('close')">
          <X :size="17" />
        </button>
      </header>
      <div class="drawer__body">
        <slot />
      </div>
      <footer v-if="$slots.footer" class="drawer__footer">
        <slot name="footer" />
      </footer>
    </aside>
  </Teleport>
</template>
