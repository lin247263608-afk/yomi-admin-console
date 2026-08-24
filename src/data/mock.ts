import type {
  CarpoolDemand,
  DashboardPeriod,
  DashboardSnapshot,
  DriverAudit,
  DriverCandidate,
  Order,
} from '@/types'
import { businessConfig } from '@/data/businessConfig'

const isoFromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000).toISOString()

const isoDaysAgo = (days: number, hour = 10) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 20, 0, 0)
  return date.toISOString()
}

const valueAddedServicesForPassenger = (ownerId: string, passengerIndex: number) => {
  if (passengerIndex === 0) {
    return [
      { id: `${ownerId}-SIGN`, name: '举接机牌', pricePence: 500 },
      { id: `${ownerId}-CHILD-SEAT`, name: '儿童座椅', pricePence: 800 },
    ]
  }

  // 拼车团内故意保留“有增值服务”和“无增值服务”两类演示成员。
  return passengerIndex % 2 === 0
    ? [{ id: `${ownerId}-SIGN`, name: '举接机牌', pricePence: 500 }]
    : []
}

const orderPassengerProfiles = [
  { id: 'USR-10284', name: '林诗雨', phone: '+44 7402 518 093', email: 'shiyu.lin@example.co.uk' },
  { id: 'USR-11802', name: '沈佳宁', phone: '+44 7701 420 911', email: 'jianing.shen@example.co.uk' },
  { id: 'USR-09317', name: '周行远', phone: '+44 7721 996 420', email: 'xingyuan.zhou@example.co.uk' },
  { id: 'USR-06608', name: '高朗', phone: '+44 7802 100 449', email: 'leon.gao@example.co.uk' },
  { id: 'USR-11305', name: '陈予安', phone: '+44 7508 117 840', email: 'yuan.chen@example.co.uk' },
  { id: 'USR-12156', name: '王睿', phone: '+44 7988 302 662', email: 'rui.wang@example.co.uk' },
  { id: 'USR-12408', name: '许嘉怡', phone: '+44 7866 405 911', email: 'jiayi.xu@example.co.uk' },
  { id: 'USR-09142', name: '李程', phone: '+44 7428 680 301', email: 'cheng.li@example.co.uk' },
] as const

type OrderPassengerProfileId = typeof orderPassengerProfiles[number]['id']

// 每笔订单使用稳定的演示用户队列，避免用数组下标把所有订单都归到同一个用户。
// 0819 修改链路的原单与新单显式共用林诗雨，便于核对关联订单与优惠券沿用。
const orderPassengerProfileIds: Record<string, readonly OrderPassengerProfileId[]> = {
  'YO-260819-11241': ['USR-10284'],
  'YO-260819-11206': ['USR-10284'],
  'YO-260818-11082': ['USR-11802', 'USR-12156', 'USR-12408'],
  'YO-260818-11074': ['USR-09317', 'USR-09142', 'USR-11305'],
  'YO-260818-11031': ['USR-06608'],
  'YO-260818-10988': ['USR-11305', 'USR-11802', 'USR-12156'],
  'YO-260818-10946': ['USR-09317'],
  'YO-260817-10861': ['USR-06608', 'USR-12408', 'USR-09142'],
}

function distributeRoundRobin(total: number, groups: number, startOffset = 0) {
  const counts = Array.from({ length: groups }, () => 0)
  for (let index = 0; index < total; index += 1) {
    const target = (startOffset + index) % groups
    counts[target] = (counts[target] ?? 0) + 1
  }
  return counts
}

export const dashboardSnapshots: Record<DashboardPeriod, DashboardSnapshot> = {
  today: {
    totalOrders: 286,
    revenuePence: 1842650,
    activeUsers: 1842,
    paidOrders: 213,
    carpoolSuccessRate: 68.4,
    driverCompletionRate: 96.8,
    trend: [32, 38, 35, 47, 52, 61, 57, 72, 78, 81, 94, 102],
  },
  '3d': {
    totalOrders: 824,
    revenuePence: 5219440,
    activeUsers: 4186,
    paidOrders: 641,
    carpoolSuccessRate: 70.2,
    driverCompletionRate: 96.1,
    trend: [48, 54, 51, 62, 68, 66, 77, 81, 89, 94, 101, 108],
  },
  '7d': {
    totalOrders: 1896,
    revenuePence: 11984220,
    activeUsers: 8247,
    paidOrders: 1489,
    carpoolSuccessRate: 71.7,
    driverCompletionRate: 95.9,
    trend: [44, 52, 58, 61, 67, 71, 75, 82, 86, 91, 99, 106],
  },
  '30d': {
    totalOrders: 7284,
    revenuePence: 46286380,
    activeUsers: 23682,
    paidOrders: 5798,
    carpoolSuccessRate: 72.3,
    driverCompletionRate: 96.4,
    trend: [51, 54, 57, 63, 66, 71, 74, 79, 84, 88, 93, 101],
  },
  month: {
    totalOrders: 4381,
    revenuePence: 28459420,
    activeUsers: 17428,
    paidOrders: 3472,
    carpoolSuccessRate: 73.1,
    driverCompletionRate: 96.7,
    trend: [49, 53, 59, 61, 65, 70, 73, 81, 84, 89, 96, 104],
  },
  year: {
    totalOrders: 48620,
    revenuePence: 312648900,
    activeUsers: 88416,
    paidOrders: 39185,
    carpoolSuccessRate: 71.2,
    driverCompletionRate: 95.8,
    trend: [34, 41, 45, 51, 57, 63, 68, 73, 80, 86, 94, 108],
  },
}

export const realtimeDrivers = {
  total: 386,
  online: 290,
  offline: 96,
  onTrip: 42,
}

export const carpoolDemands: CarpoolDemand[] = [
  {
    id: 'CP-260818-0942',
    routeId: 'RT-LHR-Z1',
    passengerName: '林诗雨',
    phone: '+44 7402 518 093',
    email: 'shiyu.lin@example.co.uk',
    routeName: '希思罗机场 → 伦敦一区',
    origin: 'Heathrow T3',
    destination: 'King’s Cross, N1C',
    adults: 1,
    children: 0,
    largeLuggage: 1,
    smallLuggage: 1,
    departureAt: isoFromNow(560),
    orderedAt: isoDaysAgo(0, 8),
    paymentStatus: '已付定金',
    depositPence: 2_000,
    groupCount: 4,
    groupTarget: businessConfig.autoGroupPassengers,
    status: '拼团中',
    members: [],
  },
  {
    id: 'CP-260818-0936',
    routeId: 'RT-Z1-LGW',
    passengerName: '周行远',
    phone: '+44 7721 996 420',
    email: 'xingyuan.zhou@example.co.uk',
    routeName: '伦敦一区 → 盖特威克机场',
    origin: 'Canary Wharf, E14',
    destination: 'Gatwick South',
    adults: 2,
    children: 0,
    largeLuggage: 2,
    smallLuggage: 1,
    departureAt: isoFromNow(910),
    orderedAt: isoDaysAgo(0, 7),
    paymentStatus: '已付定金',
    depositPence: 2_000,
    groupCount: 2,
    groupTarget: businessConfig.autoGroupPassengers,
    status: '拼团中',
    members: [],
  },
  {
    id: 'CP-260818-0915',
    routeId: 'RT-LHR-CBG',
    passengerName: '王睿',
    phone: '+44 7988 302 662',
    email: 'rui.wang@example.co.uk',
    routeName: '希思罗机场 → 剑桥',
    origin: 'Heathrow T5',
    destination: 'Cambridge CB2',
    adults: 1,
    children: 0,
    largeLuggage: 0,
    smallLuggage: 1,
    departureAt: isoFromNow(1250),
    orderedAt: isoDaysAgo(1, 18),
    paymentStatus: '已付定金',
    depositPence: 2_500,
    groupCount: 1,
    groupTarget: businessConfig.autoGroupPassengers,
    status: '拼团中',
    members: [],
  },
  {
    id: 'CP-260817-0871',
    routeId: 'RT-MAN-CTR',
    passengerName: '陈予安',
    phone: '+44 7508 117 840',
    email: 'yuan.chen@example.co.uk',
    routeName: '曼彻斯特机场 → 市中心',
    origin: 'Manchester T2',
    destination: 'Deansgate, M3',
    adults: 1,
    children: 1,
    largeLuggage: 1,
    smallLuggage: 1,
    departureAt: isoFromNow(1680),
    orderedAt: isoDaysAgo(1, 11),
    paymentStatus: '已付尾款',
    depositPence: 1_500,
    groupCount: 5,
    groupTarget: businessConfig.autoGroupPassengers,
    status: '已成团',
    members: [],
  },
  {
    id: 'CP-260817-0854',
    routeId: 'RT-BHX-COV',
    passengerName: '许嘉怡',
    phone: '+44 7866 405 911',
    email: 'jiayi.xu@example.co.uk',
    routeName: '伯明翰机场 → 考文垂',
    origin: 'Birmingham Airport',
    destination: 'Coventry CV1',
    adults: 1,
    children: 0,
    largeLuggage: 0,
    smallLuggage: 1,
    departureAt: isoFromNow(1900),
    orderedAt: isoDaysAgo(1, 9),
    paymentStatus: '已付定金',
    depositPence: 1_500,
    groupCount: 3,
    groupTarget: businessConfig.autoGroupPassengers,
    status: '拼团中',
    members: [],
  },
  {
    id: 'CP-260816-0768',
    routeId: 'RT-LTN-Z1',
    passengerName: '李程',
    phone: '+44 7428 680 301',
    email: 'cheng.li@example.co.uk',
    routeName: '卢顿机场 → 伦敦一区',
    origin: 'Luton Airport',
    destination: 'Paddington, W2',
    adults: 1,
    children: 0,
    largeLuggage: 1,
    smallLuggage: 1,
    departureAt: isoFromNow(2320),
    orderedAt: isoDaysAgo(2, 13),
    paymentStatus: '已付定金',
    depositPence: 2_000,
    groupCount: 2,
    groupTarget: businessConfig.autoGroupPassengers,
    status: '已取消',
    members: [],
    cancellation: {
      reason: '机场临时交通管制，平台无法保障原计划发车。',
      refundStatus: '退款完成',
      notificationStatus: '已推送',
    },
  },
]

carpoolDemands.forEach((demand, index) => {
  const members: CarpoolDemand['members'] = []
  let remainingPassengers = demand.groupCount
  let memberIndex = 0

  while (remainingPassengers > 0) {
    const passengers = memberIndex === 0
      ? Math.min(demand.adults + demand.children, remainingPassengers)
      : 1
    members.push({
      id: `${demand.id}-P${memberIndex + 1}`,
      orderPassengerId: `${demand.id}-P${memberIndex + 1}`,
      name: memberIndex === 0 ? demand.passengerName : ['沈佳宁', '高朗', '赵清和', '苏予'][memberIndex - 1] ?? '同行乘客',
      phone: memberIndex === 0 ? demand.phone : `+44 77${index}${memberIndex} 42${index} 91${memberIndex}`,
      email: memberIndex === 0 ? demand.email : `member${index}${memberIndex}@example.co.uk`,
      routeName: demand.routeName,
      origin: demand.origin,
      destination: demand.destination,
      adults: memberIndex === 0 ? Math.min(demand.adults, passengers) : 1,
      children: memberIndex === 0 ? Math.max(0, passengers - Math.min(demand.adults, passengers)) : 0,
      largeLuggage: memberIndex === 0 ? demand.largeLuggage : 0,
      smallLuggage: memberIndex === 0 ? demand.smallLuggage : 1,
      departureAt: demand.departureAt,
      orderedAt: demand.orderedAt,
      paymentStatus: demand.paymentStatus,
      valueAddedServices: valueAddedServicesForPassenger(
        `${demand.id}-P${memberIndex + 1}`,
        memberIndex,
      ),
    })
    remainingPassengers -= passengers
    memberIndex += 1
  }

  demand.members = members
})

export const orders: Order[] = [
  {
    id: 'YO-260819-11241',
    createdAt: isoDaysAgo(0, 11),
    sourceOrderId: 'YO-260819-11206',
    routeName: '希思罗机场 → 牛津',
    departureAt: isoFromNow(2_040),
    adults: 2,
    children: 1,
    largeLuggage: 2,
    smallLuggage: 2,
    businessType: '接机',
    serviceType: '独享',
    amountPence: 20_700,
    settlementPence: 17_794,
    status: '待派单',
    priceStatus: '可变',
    commissionRate: 18,
    commissionSource: '路线常规',
    warningLevel: 'notice',
    passengers: [],
    coupon: {
      code: 'SUMMER10',
      name: '夏日出行立减 £10',
      validityRange: '2026-08-01 — 2026-09-30',
      carriedFromOrderId: 'YO-260819-11206',
    },
    fees: {
      tripPence: 20_400,
      depositPence: 0,
      addOnPence: 1_300,
      couponPence: 1_000,
      commissionPence: 3_906,
      driverPence: 17_794,
    },
    notes: [
      {
        id: 'N-11241-1',
        author: '系统',
        content: '乘客修改下单信息并全额支付成功，本单由原订单 YO-260819-11206 重新下单生成。',
        createdAt: isoDaysAgo(0, 11),
      },
    ],
    tags: ['修改重下'],
  },
  {
    id: 'YO-260819-11206',
    createdAt: isoDaysAgo(0, 9),
    replacementOrderId: 'YO-260819-11241',
    routeName: '希思罗机场 → 牛津',
    departureAt: isoFromNow(1_620),
    adults: 2,
    children: 1,
    largeLuggage: 2,
    smallLuggage: 1,
    businessType: '接机',
    serviceType: '独享',
    amountPence: 18_800,
    settlementPence: 0,
    status: '已取消',
    refundStatus: '退款完成',
    cancelType: '乘客修改下单信息',
    cancelReason: '乘客修改出发时间及行李数，新订单全额支付成功后系统自动取消原订单。',
    refundRecord: {
      amountPence: 18_800,
      status: '退款完成',
      createdAt: isoDaysAgo(0, 11),
      fullRefund: true,
      includesValueAddedServices: true,
    },
    coupon: {
      code: 'SUMMER10',
      name: '夏日出行立减 £10',
      validityRange: '2026-08-01 — 2026-09-30',
    },
    priceStatus: '封板',
    commissionRate: 18,
    commissionSource: '路线常规',
    warningLevel: 'none',
    passengers: [],
    fees: {
      tripPence: 18_500,
      depositPence: 0,
      addOnPence: 1_300,
      couponPence: 1_000,
      commissionPence: 0,
      driverPence: 0,
    },
    notes: [
      {
        id: 'N-11206-1',
        author: '系统',
        content: '替代订单 YO-260819-11241 支付成功，原单已全额退款（含增值服务费）。',
        createdAt: isoDaysAgo(0, 11),
      },
    ],
    tags: ['修改原单', '全额退款'],
  },
  {
    id: 'YO-260818-11082',
    createdAt: isoDaysAgo(0, 8),
    routeName: '希思罗机场 → 伦敦一区',
    departureAt: isoFromNow(24),
    adults: 3,
    children: 1,
    largeLuggage: 3,
    smallLuggage: 2,
    businessType: '接机',
    serviceType: '拼车',
    amountPence: 0,
    settlementPence: 0,
    status: '待派单',
    priceStatus: '未定',
    commissionRate: 18,
    commissionSource: '路线常规',
    warningLevel: 'critical',
    passengers: [],
    fees: {
      tripPence: 0,
      depositPence: 4000,
      addOnPence: 1840,
      couponPence: 0,
      commissionPence: 0,
      driverPence: 0,
    },
    notes: [
      { id: 'N-1', author: '调度 · Ava', content: '航班已提前落地，请优先处理。', createdAt: isoDaysAgo(0, 9) },
    ],
    tags: ['异常'],
  },
  {
    id: 'YO-260818-11074',
    createdAt: isoDaysAgo(0, 7),
    routeName: '伦敦一区 → 盖特威克机场',
    departureAt: isoFromNow(92),
    adults: 2,
    children: 1,
    largeLuggage: 2,
    smallLuggage: 2,
    businessType: '送机',
    serviceType: '拼车',
    amountPence: 0,
    settlementPence: 0,
    status: '待派单',
    priceStatus: '未定',
    commissionRate: 20,
    commissionSource: '特殊时段',
    warningLevel: 'warning',
    passengers: [],
    fees: {
      tripPence: 0,
      depositPence: 3000,
      addOnPence: 1350,
      couponPence: 0,
      commissionPence: 0,
      driverPence: 0,
    },
    notes: [],
    tags: [],
  },
  {
    id: 'YO-260818-11031',
    createdAt: isoDaysAgo(1, 16),
    routeName: '希思罗机场 → 牛津',
    departureAt: isoFromNow(430),
    adults: 2,
    children: 0,
    largeLuggage: 1,
    smallLuggage: 2,
    businessType: '接机',
    serviceType: '独享',
    amountPence: 16800,
    settlementPence: 13104,
    status: '待出行',
    priceStatus: '可变',
    commissionRate: 18,
    commissionSource: '路线常规',
    warningLevel: 'none',
    driverName: 'David Zhou',
    driverVehicle: 'Mercedes Vito · LN72 YOM',
    passengers: [],
    fees: {
      tripPence: 15800,
      depositPence: 0,
      addOnPence: 1500,
      couponPence: 500,
      commissionPence: 2696,
      driverPence: 13104,
    },
    notes: [],
    tags: ['乘客'],
  },
  {
    id: 'YO-260818-10988',
    createdAt: isoDaysAgo(1, 12),
    routeName: '曼彻斯特机场 → 利兹',
    departureAt: isoFromNow(-35),
    adults: 4,
    children: 1,
    largeLuggage: 3,
    smallLuggage: 3,
    businessType: '接机',
    serviceType: '拼车',
    amountPence: 14200,
    settlementPence: 10650,
    status: '接乘客',
    priceStatus: '封板',
    commissionRate: 15,
    commissionSource: '路线常规',
    warningLevel: 'none',
    driverName: '梁森',
    driverVehicle: 'Ford Tourneo · MA24 YMI',
    passengers: [],
    fees: {
      tripPence: 13600,
      depositPence: 5000,
      addOnPence: 1100,
      couponPence: 500,
      commissionPence: 2950,
      driverPence: 10650,
    },
    notes: [],
    tags: [],
  },
  {
    id: 'YO-260818-10946',
    createdAt: isoDaysAgo(2, 15),
    routeName: '爱丁堡机场 → 市中心',
    departureAt: isoFromNow(-78),
    adults: 2,
    children: 1,
    largeLuggage: 1,
    smallLuggage: 2,
    businessType: '接机',
    serviceType: '独享',
    amountPence: 9600,
    settlementPence: 7488,
    status: '送乘客',
    priceStatus: '封板',
    commissionRate: 20,
    commissionSource: '特殊时段',
    warningLevel: 'none',
    driverName: 'Ethan Lin',
    driverVehicle: 'VW Sharan · SJ21 YOM',
    passengers: [],
    fees: {
      tripPence: 9200,
      depositPence: 0,
      addOnPence: 900,
      couponPence: 500,
      commissionPence: 1712,
      driverPence: 7488,
    },
    notes: [],
    tags: [],
  },
  {
    id: 'YO-260817-10861',
    createdAt: isoDaysAgo(3, 11),
    routeName: '伯明翰机场 → 华威大学',
    departureAt: isoFromNow(-860),
    adults: 4,
    children: 0,
    largeLuggage: 2,
    smallLuggage: 2,
    businessType: '接机',
    serviceType: '拼车',
    amountPence: 11800,
    settlementPence: 8978,
    status: '已完成',
    priceStatus: '封板',
    commissionRate: 15,
    commissionSource: '路线常规',
    warningLevel: 'none',
    driverName: '周峻',
    driverVehicle: 'Toyota Proace · BK73 YOM',
    passengers: [],
    fees: {
      tripPence: 11300,
      depositPence: 4000,
      addOnPence: 1000,
      couponPence: 500,
      commissionPence: 2322,
      driverPence: 8978,
    },
    notes: [],
    tags: [],
  },
]

orders.forEach((order, orderIndex) => {
  const passengerTotal = order.adults + order.children
  const groupCount = order.serviceType === '拼车' ? Math.min(3, passengerTotal) : 1
  const adultsByGroup = distributeRoundRobin(order.adults, groupCount)
  const childrenByGroup = distributeRoundRobin(order.children, groupCount, order.adults % groupCount)
  const largeLuggageByGroup = distributeRoundRobin(order.largeLuggage, groupCount)
  const smallLuggageByGroup = distributeRoundRobin(order.smallLuggage, groupCount, order.largeLuggage % groupCount)
  order.passengers = Array.from(
    { length: groupCount },
    (_, passengerIndex) => {
      const preferredProfileId = orderPassengerProfileIds[order.id]?.[passengerIndex]
      const fallbackProfile = orderPassengerProfiles[
        (orderIndex + passengerIndex) % orderPassengerProfiles.length
      ]!
      const profile = orderPassengerProfiles.find((item) => item.id === preferredProfileId)
        ?? fallbackProfile
      return ({
        id: profile.id,
        orderPassengerId: `OP-${order.id}-${passengerIndex + 1}`,
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        origin: order.businessType === '接机' ? order.routeName.split(' → ')[0] : 'London Zone 1',
        destination: order.businessType === '接机' ? order.routeName.split(' → ')[1] : order.routeName.split(' → ')[1],
        adults: adultsByGroup[passengerIndex] ?? 0,
        children: childrenByGroup[passengerIndex] ?? 0,
        largeLuggage: largeLuggageByGroup[passengerIndex] ?? 0,
        smallLuggage: smallLuggageByGroup[passengerIndex] ?? 0,
        departureAt: order.departureAt,
        orderedAt: order.createdAt,
        paymentStatus: order.serviceType === '独享'
          ? '已付尾款'
          : order.status === '待派单' && order.priceStatus === '未定' ? '已付定金' : '已付尾款',
        valueAddedServices: valueAddedServicesForPassenger(
          `${order.id}-P${passengerIndex + 1}`,
          passengerIndex,
        ),
      })
    },
  )

  order.fees.addOnPence = order.passengers.reduce(
    (orderTotal, passenger) => orderTotal + passenger.valueAddedServices.reduce(
      (passengerTotal, service) => passengerTotal + service.pricePence,
      0,
    ),
    0,
  )

  if (order.priceStatus !== '未定') {
    order.amountPence = Math.max(
      0,
      order.fees.tripPence + order.fees.addOnPence - order.fees.couponPence,
    )

    if (order.status === '已取消') {
      order.fees.commissionPence = 0
      order.fees.driverPence = 0
      order.settlementPence = 0
    } else {
      const splitBasePence = order.fees.tripPence
        + order.fees.addOnPence
        + (order.fees.exitDepositPence ?? 0)
      order.fees.commissionPence = Math.round(
        splitBasePence * (order.commissionRate ?? 0) / 100,
      )
      order.fees.driverPence = splitBasePence - order.fees.commissionPence
      order.settlementPence = order.fees.driverPence
    }
  }

  if (order.refundRecord) {
    order.refundRecord.amountPence = order.amountPence
  }
})

export const driverCandidates: DriverCandidate[] = [
  {
    id: 'DR-00842',
    name: '周峻',
    englishName: 'Jun Zhou',
    phone: '+44 7728 206 315',
    email: 'jun.zhou@example.co.uk',
    plate: 'BK73 YOM',
    vehicle: 'Toyota Proace · 7座',
    passengerCapacity: 6,
    largeLuggageCapacity: 3,
    smallLuggageCapacity: 4,
    rating: 4.9,
    onlineStatus: '在线',
    complianceStatus: '合规',
    acceptingStatus: '正常',
    conflictingOrderIds: [],
    creatorOrderIds: ['YO-260818-11074'],
  },
  {
    id: 'DR-00617',
    name: '梁森',
    englishName: 'Sam Liang',
    phone: '+44 7455 891 226',
    email: 'sam.liang@example.co.uk',
    plate: 'MA24 YMI',
    vehicle: 'Ford Tourneo · 7座',
    passengerCapacity: 6,
    largeLuggageCapacity: 3,
    smallLuggageCapacity: 4,
    rating: 4.8,
    onlineStatus: '在线',
    complianceStatus: '合规',
    acceptingStatus: '正常',
    conflictingOrderIds: ['YO-260818-11082'],
    creatorOrderIds: [],
  },
  {
    id: 'DR-00903',
    name: '林一凡',
    englishName: 'Ethan Lin',
    phone: '+44 7911 472 860',
    email: 'ethan.lin@example.co.uk',
    plate: 'SJ21 YOM',
    vehicle: 'VW Sharan · 5座',
    passengerCapacity: 4,
    largeLuggageCapacity: 1,
    smallLuggageCapacity: 2,
    rating: 4.7,
    onlineStatus: '行程中',
    complianceStatus: '合规',
    acceptingStatus: '正常',
    conflictingOrderIds: [],
    creatorOrderIds: [],
  },
  {
    id: 'DR-00308',
    name: '高朗',
    englishName: 'Leon Gao',
    phone: '+44 7802 100 449',
    email: 'leon.gao@example.co.uk',
    plate: 'LN72 YOM',
    vehicle: 'Mercedes Vito · 7座',
    passengerCapacity: 6,
    largeLuggageCapacity: 3,
    smallLuggageCapacity: 4,
    rating: 4.9,
    onlineStatus: '在线',
    complianceStatus: '非合规',
    acceptingStatus: '正常',
    conflictingOrderIds: [],
    creatorOrderIds: [],
  },
  {
    id: 'DR-00591',
    name: '何野',
    englishName: 'Noah He',
    phone: '+44 7320 185 671',
    email: 'noah.he@example.co.uk',
    plate: 'LR23 YMI',
    vehicle: 'Peugeot Traveller · 7座',
    passengerCapacity: 6,
    largeLuggageCapacity: 3,
    smallLuggageCapacity: 4,
    rating: 4.6,
    onlineStatus: '在线',
    complianceStatus: '合规',
    acceptingStatus: '冻结接单',
    conflictingOrderIds: [],
    creatorOrderIds: [],
  },
]

export const driverAudits: DriverAudit[] = [
  {
    id: 'AUD-260818-042',
    userId: 'U-10842',
    name: '赵清和',
    englishName: 'Claire Zhao',
    phone: '+44 7531 818 420',
    email: 'claire.zhao@example.co.uk',
    gender: '女',
    plate: 'LD24 YOM',
    vehicle: 'Mercedes Vito',
    applicationType: '首次认证',
    reviewStatus: '待审核',
    certificationStatus: '未认证',
    submittedAt: isoDaysAgo(0, 9),
    changedFields: [],
    credentials: [
      { name: 'PH Driver License', expiresAt: isoFromNow(60 * 24 * 410), state: 'valid' },
      { name: 'PH Vehicle License', expiresAt: isoFromNow(60 * 24 * 42), state: 'expiring' },
      { name: 'Commercial Insurance', expiresAt: isoFromNow(60 * 24 * 180), state: 'valid' },
      { name: 'MOT', expiresAt: isoFromNow(60 * 24 * 95), state: 'valid' },
    ],
  },
  {
    id: 'AUD-260818-038',
    userId: 'U-09517',
    name: '沈佳宁',
    englishName: 'Nina Shen',
    phone: '+44 7811 304 822',
    email: 'nina.shen@example.co.uk',
    gender: '女',
    plate: 'LS22 YMI',
    vehicle: 'VW Sharan',
    applicationType: '车辆信息修改申请',
    reviewStatus: '待审核',
    certificationStatus: '已认证',
    submittedAt: isoDaysAgo(0, 8),
    changedFields: ['车牌号', '车辆颜色', 'V5C'],
    credentials: [
      { name: 'PH Driver License', expiresAt: isoFromNow(60 * 24 * 260), state: 'valid' },
      { name: 'PH Vehicle License', expiresAt: isoFromNow(60 * 24 * 175), state: 'valid' },
      { name: 'Commercial Insurance', expiresAt: isoFromNow(60 * 24 * 120), state: 'valid' },
      { name: 'MOT', expiresAt: isoFromNow(60 * 24 * 33), state: 'expiring' },
    ],
  },
  {
    id: 'AUD-260817-031',
    userId: 'U-08124',
    name: '高朗',
    englishName: 'Leon Gao',
    phone: '+44 7802 100 449',
    email: 'leon.gao@example.co.uk',
    gender: '男',
    plate: 'LN72 YOM',
    vehicle: 'Mercedes Vito',
    applicationType: '个人信息修改申请',
    reviewStatus: '已驳回',
    certificationStatus: '已认证',
    submittedAt: isoDaysAgo(1, 15),
    changedFields: ['手机号', '驾驶证'],
    credentials: [
      { name: 'PH Driver License', expiresAt: isoFromNow(-60 * 24 * 4), state: 'expired' },
      { name: 'PH Vehicle License', expiresAt: isoFromNow(60 * 24 * 86), state: 'valid' },
      { name: 'Commercial Insurance', expiresAt: isoFromNow(60 * 24 * 71), state: 'valid' },
      { name: 'MOT', expiresAt: isoFromNow(60 * 24 * 152), state: 'valid' },
    ],
  },
  {
    id: 'AUD-260817-029',
    userId: 'U-07811',
    name: '何野',
    englishName: 'Noah He',
    phone: '+44 7320 185 671',
    email: 'noah.he@example.co.uk',
    gender: '男',
    plate: 'LR23 YMI',
    vehicle: 'Peugeot Traveller',
    applicationType: '首次认证',
    reviewStatus: '已通过',
    certificationStatus: '未认证stripe',
    submittedAt: isoDaysAgo(1, 11),
    changedFields: [],
    credentials: [
      { name: 'PH Driver License', expiresAt: isoFromNow(60 * 24 * 300), state: 'valid' },
      { name: 'PH Vehicle License', expiresAt: isoFromNow(60 * 24 * 212), state: 'valid' },
      { name: 'Commercial Insurance', expiresAt: isoFromNow(60 * 24 * 190), state: 'valid' },
      { name: 'MOT', expiresAt: isoFromNow(60 * 24 * 120), state: 'valid' },
    ],
  },
]
