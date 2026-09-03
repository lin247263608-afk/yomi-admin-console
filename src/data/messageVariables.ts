export type MessageContext =
  | 'USER'
  | 'ORDER'
  | 'CARPOOL'
  | 'DRIVER'
  | 'PAYMENT'
  | 'COUPON'
  | 'SETTLEMENT'
  | 'CREDENTIAL'
  | 'AUDIT'
  | 'SYSTEM'

export const contextLabels: Record<MessageContext, string> = {
  USER: '接收人',
  ORDER: '订单',
  CARPOOL: '拼车团',
  DRIVER: '司机与车辆',
  PAYMENT: '支付退款',
  COUPON: '优惠券',
  SETTLEMENT: '结算',
  CREDENTIAL: '证件',
  AUDIT: '审核',
  SYSTEM: '平台',
}

export interface MessageVariable {
  key: string
  label: string
  context: MessageContext
  side: 'both' | 'passenger' | 'driver'
  sample: string
  required?: boolean
}

export const messageVariables: MessageVariable[] = [
  { key: 'orderNo', label: '订单号', context: 'ORDER', side: 'both', sample: 'YO-260903-11082', required: true },
  { key: 'originOrderNo', label: '原订单号', context: 'ORDER', side: 'passenger', sample: 'YO-260902-11061' },
  { key: 'serviceType', label: '服务类型', context: 'ORDER', side: 'both', sample: '接送机-拼车' },
  { key: 'departureAt', label: '出发时间', context: 'ORDER', side: 'both', sample: '2026-09-05 14:30' },
  { key: 'origin', label: '起点', context: 'ORDER', side: 'both', sample: '曼彻斯特机场 T2' },
  { key: 'destination', label: '终点', context: 'ORDER', side: 'both', sample: 'Oxford Road' },
  { key: 'originFull', label: '起点完整地址', context: 'ORDER', side: 'both', sample: 'Manchester Airport Terminal 2, M90 1QX' },
  { key: 'destinationFull', label: '终点完整地址', context: 'ORDER', side: 'both', sample: '128 Oxford Road, Manchester M1 7ED' },
  { key: 'passengerCount', label: '乘客人数', context: 'ORDER', side: 'both', sample: '3' },
  { key: 'luggageCount', label: '行李数', context: 'ORDER', side: 'both', sample: '4' },
  { key: 'valueAddedServices', label: '增值服务', context: 'ORDER', side: 'both', sample: '举接机牌、儿童座椅' },
  { key: 'orderAmount', label: '订单金额', context: 'ORDER', side: 'both', sample: '£128.00' },
  { key: 'depositAmount', label: '定金金额', context: 'ORDER', side: 'passenger', sample: '£30.00' },
  { key: 'balanceAmount', label: '尾款金额', context: 'ORDER', side: 'passenger', sample: '£98.00' },
  { key: 'passengerName', label: '乘客姓名', context: 'ORDER', side: 'driver', sample: '王明' },
  { key: 'passengerPhone', label: '乘客手机号', context: 'ORDER', side: 'driver', sample: '+44 7700 900 123' },
  { key: 'driverName', label: '司机名称', context: 'DRIVER', side: 'passenger', sample: '张远航' },
  { key: 'driverPhone', label: '司机手机号', context: 'DRIVER', side: 'passenger', sample: '+44 7700 901 182' },
  { key: 'plateNumber', label: '车牌号', context: 'DRIVER', side: 'passenger', sample: 'AB12 CDE' },
  { key: 'carModel', label: '车型', context: 'DRIVER', side: 'passenger', sample: '奔驰 V 级' },
  { key: 'carColor', label: '车辆颜色', context: 'DRIVER', side: 'passenger', sample: '黑色' },
  { key: 'groupNo', label: '拼车团号', context: 'CARPOOL', side: 'both', sample: 'CP-260903-208' },
  { key: 'memberCount', label: '当前成团人数', context: 'CARPOOL', side: 'passenger', sample: '3' },
  { key: 'deadlineAt', label: '截团时间', context: 'CARPOOL', side: 'passenger', sample: '2026-09-05 12:30' },
  { key: 'pricePerPerson', label: '当前人均价', context: 'CARPOOL', side: 'passenger', sample: '£42.67' },
  { key: 'payDeadline', label: '支付截止时间', context: 'PAYMENT', side: 'passenger', sample: '2026-09-03 15:45' },
  { key: 'refundAmount', label: '退款金额', context: 'PAYMENT', side: 'passenger', sample: '£30.00' },
  { key: 'couponName', label: '优惠券名称', context: 'COUPON', side: 'passenger', sample: '新客立减 £10' },
  { key: 'discountAmount', label: '优惠金额', context: 'COUPON', side: 'passenger', sample: '£10.00' },
  { key: 'expireAt', label: '到期时间', context: 'COUPON', side: 'both', sample: '2026-09-30' },
  { key: 'settleAmount', label: '结算金额', context: 'SETTLEMENT', side: 'driver', sample: '£102.00' },
  { key: 'settleAt', label: '到账时间', context: 'SETTLEMENT', side: 'driver', sample: '2026-09-06 10:00' },
  { key: 'documentName', label: '证件名称', context: 'CREDENTIAL', side: 'driver', sample: '行驶证' },
  { key: 'auditResult', label: '审核结果', context: 'AUDIT', side: 'driver', sample: '通过 / 驳回' },
  { key: 'rejectReason', label: '驳回原因', context: 'AUDIT', side: 'driver', sample: '行驶证照片不清晰' },
  { key: 'userName', label: '姓名', context: 'USER', side: 'both', sample: '王明' },
  { key: 'permissionStatus', label: '权限状态', context: 'USER', side: 'driver', sample: '已冻结 / 已解冻' },
  { key: 'platformName', label: '平台名称', context: 'SYSTEM', side: 'both', sample: '有米出行' },
  { key: 'servicePhone', label: '客服电话', context: 'SYSTEM', side: 'both', sample: '+44 20 3988 2001' },
]

export const nodeContexts: Record<string, MessageContext[]> = {
  注册成功: ['USER'],
  司机审核通过: ['USER', 'AUDIT'],
  司机审核驳回: ['USER', 'AUDIT'],
  定金支付成功: ['ORDER', 'PAYMENT', 'CARPOOL'],
  全款支付成功: ['ORDER', 'PAYMENT'],
  支付超时取消: ['ORDER', 'PAYMENT'],
  拼团成功: ['ORDER', 'CARPOOL'],
  截团前提醒: ['ORDER', 'CARPOOL'],
  拼团失败: ['ORDER', 'CARPOOL'],
  拼团已取消: ['ORDER', 'CARPOOL'],
  成员变动: ['ORDER', 'CARPOOL'],
  尾款待付: ['ORDER', 'PAYMENT', 'DRIVER'],
  尾款补款提醒: ['ORDER', 'PAYMENT', 'CARPOOL'],
  尾款差额退还: ['ORDER', 'PAYMENT'],
  司机已接单: ['ORDER', 'DRIVER'],
  司机已改派: ['ORDER', 'DRIVER'],
  司机已出发: ['ORDER', 'DRIVER'],
  司机已到达: ['ORDER', 'DRIVER'],
  行程已开始: ['ORDER', 'DRIVER'],
  行程已结束: ['ORDER', 'DRIVER'],
  退款已受理: ['ORDER', 'PAYMENT'],
  退款已到账: ['ORDER', 'PAYMENT'],
  优惠券到账: ['COUPON'],
  优惠券即将过期: ['COUPON'],
  资料审核通过: ['USER', 'AUDIT'],
  资料审核驳回: ['USER', 'AUDIT'],
  'Stripe 入驻提醒': ['USER'],
  'Stripe 认证通过': ['USER'],
  'Stripe 认证受限': ['USER'],
  信息修改审核结果: ['USER', 'AUDIT'],
  收到订单指派: ['ORDER'],
  指派已失效: ['ORDER'],
  抢单成功: ['ORDER'],
  订单被改派: ['ORDER'],
  订单已取消: ['ORDER'],
  订单信息变更: ['ORDER', 'CARPOOL'],
  行程即将开始: ['ORDER'],
  乘客尾款未付: ['ORDER'],
  结算已到账: ['ORDER', 'SETTLEMENT'],
  结算异常: ['ORDER', 'SETTLEMENT'],
  证件即将到期: ['CREDENTIAL'],
  证件已过期: ['CREDENTIAL'],
  接单权限变更: ['USER'],
  订单池权限变更: ['USER'],
  平台公告: ['SYSTEM'],
  意见反馈已处理: ['USER'],
}

const hiddenVariableNodes = new Set(['注册成功', '平台公告'])

export function availableVariablesForNode(node: string, endpoint: unknown) {
  if (hiddenVariableNodes.has(node)) return []
  const contexts = nodeContexts[node] ?? []
  const side = String(endpoint) === '司导端' ? 'driver' : 'passenger'
  return messageVariables.filter((variable) => {
    // 到期时间由优惠券与司机资质两个上下文共用，字段键保持一致。
    const contextAvailable = contexts.includes(variable.context)
      || (variable.key === 'expireAt' && (contexts.includes('COUPON') || contexts.includes('CREDENTIAL')))
    return contextAvailable && (variable.side === 'both' || variable.side === side)
  })
}

export function extractMessageVariableKeys(content: string) {
  return [...content.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((match) => match[1] ?? '')
}
