export interface BusinessConfigState {
  bookingHorizonDays: number
  carpoolCutoffHours: number
  exclusiveCutoffHours: number
  exceptionReportMinutes: number
  acceptanceToleranceMinutes: number
  autoGroupPassengers: number
  autoGroupLuggage: number
  minimumGroupPassengers: number
  autoGroupCutoffHours: number
  departureMatchWindowMinutes: number
  transferDelayMinutes: number
  payoutCycle: string
  minimumPayoutPounds: number
  payoutFeePounds: number
}

// 原型共享配置仓：页面保存配置后，后续新建的 mock 业务对象读取这里；既有对象保留创建时快照。
export const businessConfig: BusinessConfigState = {
  bookingHorizonDays: 30,
  carpoolCutoffHours: 48,
  exclusiveCutoffHours: 24,
  exceptionReportMinutes: 0,
  acceptanceToleranceMinutes: 30,
  autoGroupPassengers: 5,
  autoGroupLuggage: 5,
  minimumGroupPassengers: 3,
  autoGroupCutoffHours: 48,
  departureMatchWindowMinutes: 360,
  transferDelayMinutes: 30,
  payoutCycle: '每周一',
  minimumPayoutPounds: 50,
  payoutFeePounds: 1.5,
}
