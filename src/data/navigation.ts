import {
  BadgePoundSterling,
  BellRing,
  CarFront,
  ClipboardCheck,
  Gauge,
  Headphones,
  MapPinned,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  TicketPercent,
  Users,
} from '@lucide/vue'

import type { NavGroup } from '@/types'

export const navigation: NavGroup[] = [
  {
    id: 'dashboard',
    label: '数据驾驶舱',
    icon: Gauge,
    items: [{ label: '核心指标总览', path: '/dashboard' }],
  },
  {
    id: 'users',
    label: '用户管理',
    icon: Users,
    items: [
      { label: '用户列表', path: '/module/users' },
      { label: '司机列表', path: '/module/drivers' },
      { label: '司机审核', path: '/driver-audits', badge: 6 },
    ],
  },
  {
    id: 'fleet',
    label: '司导运力监控',
    icon: CarFront,
    items: [{ label: '运力监控', path: '/module/fleet-dashboard' }],
  },
  {
    id: 'orders',
    label: '订单与拼车管理',
    icon: ClipboardCheck,
    items: [
      { label: '拼车需求管理', path: '/carpool-demands', badge: 12 },
      { label: '订单管理', path: '/orders', badge: 4 },
    ],
  },
  {
    id: 'routes',
    label: '路线与定价',
    icon: MapPinned,
    items: [
      { label: '车型管理', path: '/module/vehicle-types' },
      { label: '围栏管理', path: '/module/geofences' },
      { label: '接送机路线配置', path: '/module/airport-routes' },
      { label: '包车路线配置', path: '/module/charter-routes' },
    ],
  },
  {
    id: 'business',
    label: '业务配置管理',
    icon: SlidersHorizontal,
    items: [
      { label: '订单配置', path: '/module/order-config' },
      { label: '拼车配置', path: '/module/carpool-config' },
      { label: '支付配置', path: '/module/payment-config' },
    ],
  },
  {
    id: 'marketing',
    label: '营销管理',
    icon: TicketPercent,
    items: [
      { label: '优惠券管理', path: '/module/coupons' },
      { label: '优惠券发放记录', path: '/module/coupon-grants' },
      { label: '活动配置', path: '/module/campaigns' },
    ],
  },
  {
    id: 'operations',
    label: '运营配置',
    icon: BellRing,
    items: [
      { label: '增值服务', path: '/module/value-added-services' },
      { label: 'Banner 配置', path: '/module/banners' },
      { label: '公告配置', path: '/module/notices' },
      { label: '拼车团默认语配置', path: '/module/carpool-copy' },
      { label: '系统消息设置', path: '/module/system-messages' },
    ],
  },
  {
    id: 'finance',
    label: '财务与结算',
    icon: BadgePoundSterling,
    items: [
      { label: '订单结算明细', path: '/module/settlements' },
      { label: '司机对账明细', path: '/module/driver-statements' },
    ],
  },
  {
    id: 'service',
    label: '客服工单中心',
    icon: Headphones,
    items: [
      { label: '意见反馈', path: '/module/feedback' },
      { label: '异常订单', path: '/module/exception-orders', badge: 3 },
    ],
  },
  {
    id: 'system',
    label: '系统设置',
    icon: ShieldCheck,
    items: [
      { label: '角色管理', path: '/module/roles' },
      { label: '权限管理', path: '/module/permissions' },
      { label: '操作日志', path: '/module/audit-logs' },
    ],
  },
]

export const pageTitleByPath = Object.fromEntries(
  navigation.flatMap((group) =>
    group.items.map((item) => [item.path, { group: group.label, title: item.label }]),
  ),
)

export const moduleTitleBySlug: Record<string, { group: string; title: string }> = {
  ...Object.fromEntries(
    navigation.flatMap((group) =>
      group.items
        .filter((item) => item.path.startsWith('/module/'))
        .map((item) => [
          item.path.replace('/module/', ''),
          { group: group.label, title: item.label },
        ]),
    ),
  ),
  'fleet-list': { group: '司导运力监控', title: '运力监控' },
}
