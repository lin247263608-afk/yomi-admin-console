import type { Component } from 'vue'

export type BadgeTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'coral'

export interface NavItem {
  label: string
  path: string
  badge?: number
}

export interface NavGroup {
  id: string
  label: string
  icon: Component
  items: NavItem[]
}

export type DashboardPeriod =
  | 'today'
  | '3d'
  | '7d'
  | '30d'
  | 'month'
  | 'year'

export interface DashboardSnapshot {
  totalOrders: number
  revenuePence: number
  activeUsers: number
  paidOrders: number
  carpoolSuccessRate: number
  driverCompletionRate: number
  trend: number[]
}

export type CarpoolStatus = '拼团中' | '已成团' | '已取消'
export type PaymentStatus = '已付定金' | '已付尾款'

export interface ValueAddedServiceSelection {
  id: string
  name: string
  pricePence: number
}

export interface PassengerSummary {
  id: string
  /** 乘客在拼车需求中的稳定业务标识；截团后作为 order_passenger_id 快照。 */
  orderPassengerId: string
  name: string
  phone: string
  email: string
  routeName: string
  origin: string
  destination: string
  adults: number
  children: number
  largeLuggage: number
  smallLuggage: number
  departureAt: string
  orderedAt: string
  paymentStatus: PaymentStatus
  valueAddedServices: ValueAddedServiceSelection[]
}

export interface CarpoolDemand {
  id: string
  routeId: string
  passengerName: string
  phone: string
  email: string
  routeName: string
  origin: string
  destination: string
  adults: number
  children: number
  largeLuggage: number
  smallLuggage: number
  departureAt: string
  orderedAt: string
  paymentStatus: PaymentStatus
  /** 路线定金单价（便士/人）；订单实际定金按乘车人数计算。 */
  depositUnitPence: number
  groupCount: number
  groupTarget: number
  status: CarpoolStatus
  members: PassengerSummary[]
  generatedOrderId?: string
  cancellation?: {
    reason: string
    refundStatus: '退款处理中' | '退款完成'
    notificationStatus: '待推送' | '已推送'
  }
}

export type OrderStatus =
  | '待派单'
  | '待出行'
  | '接乘客'
  | '送乘客'
  | '已完成'
  | '已取消'

export type WarningLevel = 'none' | 'notice' | 'warning' | 'critical'

export interface OrderPassenger {
  id: string
  /** 后端订单乘客表主键，增值服务按该维度归属。 */
  orderPassengerId: string
  name: string
  phone: string
  email?: string
  origin: string
  destination: string
  adults: number
  children: number
  largeLuggage: number
  smallLuggage: number
  departureAt?: string
  orderedAt?: string
  paymentStatus: PaymentStatus
  valueAddedServices: ValueAddedServiceSelection[]
}

export type OrderCancelType =
  | '乘客主动取消'
  | '乘客修改下单信息'
  | '平台自动取消'
  | '后台取消'

export interface OrderRefundRecord {
  amountPence: number
  status: '退款处理中' | '退款完成'
  createdAt: string
  /** 区分全额退款与其他按规则退款，避免“无增值服务”被误读为非全额。 */
  fullRefund: boolean
  includesValueAddedServices: boolean
}

export interface OrderNote {
  id: string
  author: string
  content: string
  createdAt: string
}

export interface OrderTrackPoint {
  x: number
  y: number
  recordedAt: string
}

export interface OrderRouteTelemetry {
  startGeofence: string
  endGeofence: string
  trackingStartedAt?: string
  trackingEndedAt?: string
  driverPoints: OrderTrackPoint[]
}

export interface OrderGroupMessage {
  id: string
  author: string
  role: '乘客' | '司导' | '系统'
  content: string
  createdAt: string
  readAt?: string
}

export interface Order {
  id: string
  routeId?: string
  createdAt?: string
  sourceDemandId?: string
  sourceOrderId?: string
  replacementOrderId?: string
  routeName: string
  departureAt: string
  adults: number
  children: number
  largeLuggage: number
  smallLuggage: number
  businessType: '接机' | '送机'
  serviceType: '拼车' | '独享'
  amountPence: number
  settlementPence: number
  status: OrderStatus
  refundStatus?: '退款处理中' | '退款完成'
  cancelType?: OrderCancelType
  cancelReason?: string
  refundRecord?: OrderRefundRecord
  coupon?: {
    code: string
    name: string
    /** 下单时锁定的优惠券有效期范围快照。 */
    validityRange?: string
    carriedFromOrderId?: string
  }
  priceStatus: '未定' | '可变' | '封板'
  commissionRate?: number
  commissionSource?: '路线常规' | '特殊时段' | '手动调整'
  commissionAdjustmentReason?: string
  warningLevel: WarningLevel
  driverName?: string
  driverVehicle?: string
  passengers: OrderPassenger[]
  fees: {
    tripPence: number
    exitDepositPence?: number
    /** 下单时锁定的路线定金单价（便士/人）。 */
    depositUnitPence?: number
    /** 本单定金计费人数。 */
    depositPassengerCount?: number
    depositPence: number
    /** 价格锁定后仍需收取的尾款；定金覆盖应付时为 0。 */
    balancePence?: number
    /** 已付定金高于订单应付时自动退还的差额。 */
    depositRefundPence?: number
    addOnPence: number
    couponPence: number
    commissionPence: number
    driverPence: number
  }
  notes: OrderNote[]
  tags: string[]
  routeTelemetry?: OrderRouteTelemetry
  groupMessages?: OrderGroupMessage[]
}

export interface DriverCandidate {
  id: string
  name: string
  englishName: string
  phone: string
  email: string
  plate: string
  vehicle: string
  passengerCapacity: number
  largeLuggageCapacity: number
  smallLuggageCapacity: number
  rating: number
  onlineStatus: '在线' | '离线' | '行程中'
  complianceStatus: '合规' | '非合规'
  acceptingStatus: '正常' | '冻结接单'
  conflictingOrderIds: string[]
  creatorOrderIds: string[]
}

export type DriverCertificationStatus = '未认证' | '已驳回' | '未认证stripe' | '已认证'
export type DriverReviewStatus = '待审核' | '已通过' | '已驳回'

export interface DriverAudit {
  id: string
  userId: string
  driverId: string
  name: string
  englishName: string
  phone: string
  email: string
  gender: '男' | '女'
  plate: string
  vehicle: string
  applicationType: '首次认证' | '个人信息修改申请' | '车辆信息修改申请'
  reviewStatus: DriverReviewStatus
  certificationStatus: DriverCertificationStatus
  submittedAt: string
  changedFields: string[]
  credentials: Array<{
    name: string
    expiresAt?: string
    issuedAt?: string
    state: 'valid' | 'expiring' | 'expired'
  }>
}
