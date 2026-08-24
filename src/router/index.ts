import { createRouter, createWebHistory } from 'vue-router'

import AdminLayout from '@/layouts/AdminLayout.vue'
import { moduleTitleBySlug } from '@/data/navigation'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', redirect: '/dashboard' },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { title: '核心指标总览', group: '数据驾驶舱' },
        },
        {
          path: 'carpool-demands',
          name: 'carpool-demands',
          component: () => import('@/views/CarpoolDemandsView.vue'),
          meta: { title: '拼车需求管理', group: '订单与拼车管理' },
        },
        {
          path: 'orders',
          name: 'orders',
          component: () => import('@/views/OrdersView.vue'),
          meta: { title: '订单管理', group: '订单与拼车管理' },
        },
        {
          path: 'driver-audits',
          name: 'driver-audits',
          component: () => import('@/views/DriverAuditsView.vue'),
          meta: { title: '司机审核', group: '用户管理' },
        },
        {
          path: 'module/:section',
          name: 'module-preview',
          component: () => import('@/views/ModulePreviewView.vue'),
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  const moduleMeta = typeof to.params.section === 'string' ? moduleTitleBySlug[to.params.section] : undefined
  const title = typeof to.meta.title === 'string' ? to.meta.title : moduleMeta?.title ?? '运营中枢'
  document.title = `${title} · 有米出行`
})

export default router
