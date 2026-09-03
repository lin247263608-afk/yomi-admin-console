import { defineStore } from 'pinia'

export type ToastTone = 'success' | 'info' | 'warning' | 'danger'

interface ToastItem {
  id: number
  title: string
  description?: string
  tone: ToastTone
}

export const useAppStore = defineStore('app', {
  state: () => ({
    sidebarCollapsed: false,
    mobileMenuOpen: false,
    shareLinkPrefix: '一起拼车去机场，行程更划算',
    shareLinkPrefixEn: 'Share this airport ride and travel for less',
    toasts: [] as ToastItem[],
    toastId: 0,
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    toggleMobileMenu() {
      this.mobileMenuOpen = !this.mobileMenuOpen
    },
    closeMobileMenu() {
      this.mobileMenuOpen = false
    },
    updateShareLinkPrefix(value: string, valueEn: string) {
      this.shareLinkPrefix = value
      this.shareLinkPrefixEn = valueEn
    },
    notify(
      title: string,
      description?: string,
      tone: ToastTone = 'success',
    ) {
      const id = ++this.toastId
      this.toasts.push({ id, title, description, tone })
      window.setTimeout(() => this.dismissToast(id), 4200)
    },
    dismissToast(id: number) {
      this.toasts = this.toasts.filter((toast) => toast.id !== id)
    },
  },
})
