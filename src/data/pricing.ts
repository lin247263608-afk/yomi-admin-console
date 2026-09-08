import type { DriverCandidate, Order } from '@/types'

interface VehiclePrice {
  baseFarePence: number
  extraSeatPence: number
}

interface RoutePrice {
  commissionRate: number
  vehicles: Record<string, VehiclePrice>
}

const defaultVehiclePrices: Record<string, VehiclePrice> = {
  'Toyota Proace': { baseFarePence: 12_200, extraSeatPence: 1_900 },
  'Ford Tourneo': { baseFarePence: 11_800, extraSeatPence: 1_850 },
  'VW Sharan': { baseFarePence: 10_400, extraSeatPence: 1_600 },
  'Mercedes Vito': { baseFarePence: 13_600, extraSeatPence: 2_100 },
  'Peugeot Traveller': { baseFarePence: 11_500, extraSeatPence: 1_800 },
}

// 原型定价快照：正式接入时由“路线 + 车型”配置接口替换。
const routeVehiclePricing: Record<string, RoutePrice> = {
  '希思罗机场 → 伦敦一区': {
    commissionRate: 0.18,
    vehicles: {
      'Toyota Proace': { baseFarePence: 11_700, extraSeatPence: 1_800 },
      'Ford Tourneo': { baseFarePence: 11_400, extraSeatPence: 1_750 },
      'VW Sharan': { baseFarePence: 10_200, extraSeatPence: 1_550 },
      'Mercedes Vito': { baseFarePence: 12_800, extraSeatPence: 1_950 },
      'Peugeot Traveller': { baseFarePence: 11_100, extraSeatPence: 1_700 },
    },
  },
  '伦敦一区 → 盖特威克机场': {
    commissionRate: 0.17,
    vehicles: {
      'Toyota Proace': { baseFarePence: 9_800, extraSeatPence: 1_600 },
      'Ford Tourneo': { baseFarePence: 9_500, extraSeatPence: 1_550 },
      'VW Sharan': { baseFarePence: 8_700, extraSeatPence: 1_400 },
      'Mercedes Vito': { baseFarePence: 10_900, extraSeatPence: 1_750 },
      'Peugeot Traveller': { baseFarePence: 9_300, extraSeatPence: 1_500 },
    },
  },
}

function vehicleModel(vehicle: string) {
  return vehicle.split(' · ')[0]?.trim() ?? vehicle
}

function hoursUntil(iso: string) {
  return (new Date(iso).getTime() - Date.now()) / 3_600_000
}

function carpoolTripTotalPence(wholeVehicleFarePence: number, passengerCount: number) {
  // 金额以便士存储：先把单座价四舍五入到整数便士（即 GBP 两位小数），
  // 再汇总乘客实付。不得把尾差补到某位乘客；与整车价的差额由平台吸收。
  const seatFarePence = Math.round(wholeVehicleFarePence / passengerCount)
  return seatFarePence * passengerCount
}

export function lockOrderPrice(order: Order, driver: DriverCandidate) {
  const isFirstLock = order.priceStatus === '未定'
  const canRecalculate = isFirstLock || hoursUntil(order.departureAt) >= 48

  if (!canRecalculate) {
    order.priceStatus = '封板'
    return { recalculated: false, priceStatus: order.priceStatus }
  }

  const model = vehicleModel(driver.vehicle)
  const routePrice = routeVehiclePricing[order.routeName]
  const vehiclePrice = routePrice?.vehicles[model] ?? defaultVehiclePrices[model] ?? {
    baseFarePence: 11_000,
    extraSeatPence: 1_700,
  }
  const commissionRate = order.commissionRate !== undefined
    ? order.commissionRate / 100
    : routePrice?.commissionRate ?? 0.18
  const passengerCount = Math.max(1, order.adults + order.children)
  const wholeVehicleFare = vehiclePrice.baseFarePence
    + Math.max(0, passengerCount - 1) * vehiclePrice.extraSeatPence
  const tripPence = order.serviceType === '拼车'
    ? carpoolTripTotalPence(wholeVehicleFare, passengerCount)
    : wholeVehicleFare
  const splitBasePence = Math.max(0, tripPence + order.fees.addOnPence + (order.fees.exitDepositPence ?? 0))
  const commissionPence = Math.round(splitBasePence * commissionRate)
  const driverPence = splitBasePence - commissionPence

  order.fees.tripPence = tripPence
  order.fees.commissionPence = commissionPence
  order.fees.driverPence = driverPence
  order.amountPence = Math.max(0, tripPence + order.fees.addOnPence - order.fees.couponPence)
  const rawBalancePence = order.amountPence - order.fees.depositPence
  order.fees.balancePence = Math.max(0, rawBalancePence)
  order.fees.depositRefundPence = Math.max(0, -rawBalancePence)

  if (rawBalancePence <= 0) {
    order.passengers.forEach((passenger) => {
      passenger.paymentStatus = '已付尾款'
    })
  }
  if (rawBalancePence < 0) {
    order.refundStatus = '退款处理中'
    order.refundRecord = {
      amountPence: -rawBalancePence,
      status: '退款处理中',
      createdAt: new Date().toISOString(),
      fullRefund: false,
      includesValueAddedServices: false,
    }
    order.notes.unshift({
      id: `N-DEPOSIT-REFUND-${Date.now()}`,
      author: '系统',
      content: `已付定金总额高于订单应付，已自动发起 Stripe 退差额 £${(-rawBalancePence / 100).toFixed(2)}。`,
      createdAt: new Date().toISOString(),
    })
  }
  order.commissionRate = Math.round(commissionRate * 100)
  order.commissionSource = order.commissionSource ?? '路线常规'
  order.settlementPence = driverPence
  order.priceStatus = hoursUntil(order.departureAt) < 48 ? '封板' : '可变'

  return {
    recalculated: true,
    priceStatus: order.priceStatus,
    balancePence: order.fees.balancePence,
    depositRefundPence: order.fees.depositRefundPence,
  }
}
