<script setup lang="ts">
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  ImagePlus,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import DriverDetailDrawer from '@/components/drivers/DriverDetailDrawer.vue'
import BannerDetail from '@/components/modules/BannerDetail.vue'
import BannerEditor from '@/components/modules/BannerEditor.vue'
import CarpoolCopyDetail from '@/components/modules/CarpoolCopyDetail.vue'
import CarpoolCopyEditor from '@/components/modules/CarpoolCopyEditor.vue'
import NoticeDetail from '@/components/modules/NoticeDetail.vue'
import NoticeEditor from '@/components/modules/NoticeEditor.vue'
import SystemMessageDetail from '@/components/modules/SystemMessageDetail.vue'
import SystemMessageEditor from '@/components/modules/SystemMessageEditor.vue'
import GeofenceEditor from '@/components/modules/GeofenceEditor.vue'
import CharterRouteDetail from '@/components/modules/CharterRouteDetail.vue'
import CampaignDetail from '@/components/modules/CampaignDetail.vue'
import CampaignEditor from '@/components/modules/CampaignEditor.vue'
import CouponDetail from '@/components/modules/CouponDetail.vue'
import CouponEditor from '@/components/modules/CouponEditor.vue'
import CouponGrantDetail from '@/components/modules/CouponGrantDetail.vue'
import CouponGrantDialog from '@/components/modules/CouponGrantDialog.vue'
import DriverSettlementDetail from '@/components/modules/DriverSettlementDetail.vue'
import ExceptionOrderDetail from '@/components/modules/ExceptionOrderDetail.vue'
import ExceptionRefundDialog from '@/components/modules/ExceptionRefundDialog.vue'
import FeedbackDetail from '@/components/modules/FeedbackDetail.vue'
import RoutePricingDetail from '@/components/modules/RoutePricingDetail.vue'
import RoutePricingEditor from '@/components/modules/RoutePricingEditor.vue'
import ValueAddedServiceDetail from '@/components/modules/ValueAddedServiceDetail.vue'
import ValueAddedServiceEditor from '@/components/modules/ValueAddedServiceEditor.vue'
import DrawerShell from '@/components/overlay/DrawerShell.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import UserDetailDrawer from '@/components/users/UserDetailDrawer.vue'
import { businessConfig } from '@/data/businessConfig'
import { moduleCatalog } from '@/data/moduleCatalog'
import type { ModuleColumn, ModuleMetric, ModuleRow, ModuleSettingField } from '@/data/moduleCatalog.types'
import { moduleTitleBySlug } from '@/data/navigation'
import { useAppStore } from '@/stores/app'
import type { BadgeTone } from '@/types'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

const section = computed(() => typeof route.params.section === 'string' ? route.params.section : '')
const isFleetMonitoring = computed(() => section.value === 'fleet-dashboard' || section.value === 'fleet-list')
const isFinanceModule = computed(() => section.value === 'settlements' || section.value === 'driver-statements')
const pageMeta = computed(() => moduleTitleBySlug[section.value] ?? { group: '有米出行', title: '模块页面' })
const config = computed(() => moduleCatalog[section.value])

type UserSearchFields = {
  userId: string
  name: string
  englishName: string
  phone: string
  email: string
  registeredFrom: string
  registeredTo: string
  identity: string
  status: string
}

type DriverSearchFields = {
  driverId: string
  name: string
  phone: string
  plate: string
  email: string
  certifiedFrom: string
  certifiedTo: string
  vehicleType: string
  compliance: string
  status: string
}

type FleetSearchFields = {
  driverId: string
  name: string
  phone: string
  plate: string
  vehicleType: string
  onlineStatus: string
  status: string
}

type VehicleSearchFields = {
  name: string
  seats: string
  grade: string
  status: string
}

type GeofenceSearchFields = {
  name: string
  type: string
  status: string
}

type AirportRouteSearchFields = {
  routeId: string
  name: string
  business: string
  startFenceId: string
  endFenceId: string
  popular: string
  status: string
}

type CharterRouteSearchFields = {
  name: string
  status: string
}

type CouponSearchFields = {
  couponId: string
  name: string
  couponType: string
  service: string
  validFrom: string
  validTo: string
  status: string
}

type CouponGrantSearchFields = {
  couponId: string
  code: string
  couponName: string
  couponType: string
  service: string
  validFrom: string
  validTo: string
  status: string
  phone: string
  grantedFrom: string
  grantedTo: string
}

type CampaignSearchFields = {
  campaignId: string
  name: string
  validFrom: string
  validTo: string
  status: string
}

type ValueAddedServiceSearchFields = {
  name: string
  description: string
  status: string
}

type BannerSearchFields = {
  name: string
  channel: string
  status: string
  validFrom: string
  validTo: string
}

type NoticeSearchFields = {
  title: string
  channel: string
  status: string
  validFrom: string
  validTo: string
}

type MessageTemplateSearchFields = {
  content: string
  endpoint: string
  group: string
  node: string
  status: string
}

type SettlementSearchFields = {
  orderId: string
  driverPhone: string
  driverName: string
  settledFrom: string
  settledTo: string
  status: string
}

type DriverStatementSearchFields = {
  driverId: string
  driverPhone: string
  driverName: string
  lastSettledFrom: string
  lastSettledTo: string
}

type FeedbackSearchFields = {
  feedbackType: string
  content: string
  identity: string
  status: string
  submittedFrom: string
  submittedTo: string
}

type ExceptionOrderSearchFields = {
  orderId: string
  passengerName: string
  passengerPhone: string
  driverName: string
  reportedFrom: string
  reportedTo: string
  status: string
}

type SettlementStatsPeriod = '今日' | '近3天' | '近7天' | '近30天' | '本月' | '今年' | '自定义'

type SettingsHistoryRecord = {
  id: string
  operatedAt: string
  operator: string
  item: string
  before: string
  after: string
  scope: string
  ip: string
}

function createEmptyUserSearch(): UserSearchFields {
  return {
    userId: '',
    name: '',
    englishName: '',
    phone: '',
    email: '',
    registeredFrom: '',
    registeredTo: '',
    identity: '全部',
    status: '全部',
  }
}

function createEmptyDriverSearch(): DriverSearchFields {
  return {
    driverId: '',
    name: '',
    phone: '',
    plate: '',
    email: '',
    certifiedFrom: '',
    certifiedTo: '',
    vehicleType: '全部',
    compliance: '全部',
    status: '全部',
  }
}

function createEmptyFleetSearch(): FleetSearchFields {
  return {
    driverId: '',
    name: '',
    phone: '',
    plate: '',
    vehicleType: '全部',
    onlineStatus: '全部',
    status: '全部',
  }
}

function createEmptyVehicleSearch(): VehicleSearchFields {
  return { name: '', seats: '全部', grade: '全部', status: '全部' }
}

function createEmptyGeofenceSearch(): GeofenceSearchFields {
  return { name: '', type: '全部', status: '全部' }
}

function createEmptyAirportRouteSearch(): AirportRouteSearchFields {
  return {
    routeId: '',
    name: '',
    business: '全部',
    startFenceId: '全部',
    endFenceId: '全部',
    popular: '全部',
    status: '全部',
  }
}

function createEmptyCharterRouteSearch(): CharterRouteSearchFields {
  return { name: '', status: '全部' }
}

function createEmptyCouponSearch(): CouponSearchFields {
  return {
    couponId: '',
    name: '',
    couponType: '全部',
    service: '全部',
    validFrom: '',
    validTo: '',
    status: '全部',
  }
}

function createEmptyCouponGrantSearch(): CouponGrantSearchFields {
  return {
    couponId: '',
    code: '',
    couponName: '',
    couponType: '全部',
    service: '全部',
    validFrom: '',
    validTo: '',
    status: '全部',
    phone: '',
    grantedFrom: '',
    grantedTo: '',
  }
}

function createEmptyCampaignSearch(): CampaignSearchFields {
  return { campaignId: '', name: '', validFrom: '', validTo: '', status: '全部' }
}

function createEmptyValueAddedServiceSearch(): ValueAddedServiceSearchFields {
  return { name: '', description: '', status: '全部' }
}

function createEmptyBannerSearch(): BannerSearchFields {
  return { name: '', channel: '全部', status: '全部', validFrom: '', validTo: '' }
}

function createEmptyNoticeSearch(): NoticeSearchFields {
  return { title: '', channel: '全部', status: '全部', validFrom: '', validTo: '' }
}

function createEmptyMessageTemplateSearch(): MessageTemplateSearchFields {
  return { content: '', endpoint: '全部', group: '全部', node: '全部', status: '全部' }
}

function createEmptySettlementSearch(): SettlementSearchFields {
  return { orderId: '', driverPhone: '', driverName: '', settledFrom: '', settledTo: '', status: '全部' }
}

function createEmptyDriverStatementSearch(): DriverStatementSearchFields {
  return { driverId: '', driverPhone: '', driverName: '', lastSettledFrom: '', lastSettledTo: '' }
}

function createEmptyFeedbackSearch(): FeedbackSearchFields {
  return { feedbackType: '全部', content: '', identity: '全部', status: '全部', submittedFrom: '', submittedTo: '' }
}

function createEmptyExceptionOrderSearch(): ExceptionOrderSearchFields {
  return { orderId: '', passengerName: '', passengerPhone: '', driverName: '', reportedFrom: '', reportedTo: '', status: '全部' }
}

const rows = ref<ModuleRow[]>([])
const searchTerm = ref('')
const activeFilters = reactive<Record<string, string>>({})
const userSearchDraft = reactive<UserSearchFields>(createEmptyUserSearch())
const userSearchApplied = reactive<UserSearchFields>(createEmptyUserSearch())
const driverSearchDraft = reactive<DriverSearchFields>(createEmptyDriverSearch())
const driverSearchApplied = reactive<DriverSearchFields>(createEmptyDriverSearch())
const fleetSearchDraft = reactive<FleetSearchFields>(createEmptyFleetSearch())
const fleetSearchApplied = reactive<FleetSearchFields>(createEmptyFleetSearch())
const vehicleSearchDraft = reactive<VehicleSearchFields>(createEmptyVehicleSearch())
const vehicleSearchApplied = reactive<VehicleSearchFields>(createEmptyVehicleSearch())
const geofenceSearchDraft = reactive<GeofenceSearchFields>(createEmptyGeofenceSearch())
const geofenceSearchApplied = reactive<GeofenceSearchFields>(createEmptyGeofenceSearch())
const airportRouteSearchDraft = reactive<AirportRouteSearchFields>(createEmptyAirportRouteSearch())
const airportRouteSearchApplied = reactive<AirportRouteSearchFields>(createEmptyAirportRouteSearch())
const charterRouteSearchDraft = reactive<CharterRouteSearchFields>(createEmptyCharterRouteSearch())
const charterRouteSearchApplied = reactive<CharterRouteSearchFields>(createEmptyCharterRouteSearch())
const couponSearchDraft = reactive<CouponSearchFields>(createEmptyCouponSearch())
const couponSearchApplied = reactive<CouponSearchFields>(createEmptyCouponSearch())
const couponGrantSearchDraft = reactive<CouponGrantSearchFields>(createEmptyCouponGrantSearch())
const couponGrantSearchApplied = reactive<CouponGrantSearchFields>(createEmptyCouponGrantSearch())
const campaignSearchDraft = reactive<CampaignSearchFields>(createEmptyCampaignSearch())
const campaignSearchApplied = reactive<CampaignSearchFields>(createEmptyCampaignSearch())
const valueAddedServiceSearchDraft = reactive<ValueAddedServiceSearchFields>(createEmptyValueAddedServiceSearch())
const valueAddedServiceSearchApplied = reactive<ValueAddedServiceSearchFields>(createEmptyValueAddedServiceSearch())
const bannerSearchDraft = reactive<BannerSearchFields>(createEmptyBannerSearch())
const bannerSearchApplied = reactive<BannerSearchFields>(createEmptyBannerSearch())
const noticeSearchDraft = reactive<NoticeSearchFields>(createEmptyNoticeSearch())
const noticeSearchApplied = reactive<NoticeSearchFields>(createEmptyNoticeSearch())
const messageTemplateSearchDraft = reactive<MessageTemplateSearchFields>(createEmptyMessageTemplateSearch())
const messageTemplateSearchApplied = reactive<MessageTemplateSearchFields>(createEmptyMessageTemplateSearch())
const settlementSearchDraft = reactive<SettlementSearchFields>(createEmptySettlementSearch())
const settlementSearchApplied = reactive<SettlementSearchFields>(createEmptySettlementSearch())
const driverStatementSearchDraft = reactive<DriverStatementSearchFields>(createEmptyDriverStatementSearch())
const driverStatementSearchApplied = reactive<DriverStatementSearchFields>(createEmptyDriverStatementSearch())
const feedbackSearchDraft = reactive<FeedbackSearchFields>(createEmptyFeedbackSearch())
const feedbackSearchApplied = reactive<FeedbackSearchFields>(createEmptyFeedbackSearch())
const exceptionOrderSearchDraft = reactive<ExceptionOrderSearchFields>(createEmptyExceptionOrderSearch())
const exceptionOrderSearchApplied = reactive<ExceptionOrderSearchFields>(createEmptyExceptionOrderSearch())
const settlementStatsPeriod = ref<SettlementStatsPeriod>('本月')
const settlementStatsFrom = ref('2026-08-01')
const settlementStatsTo = ref('2026-08-31')
const settlementStatsAppliedFrom = ref('2026-08-01')
const settlementStatsAppliedTo = ref('2026-08-31')
const settlementStatsPeriods: SettlementStatsPeriod[] = ['今日', '近3天', '近7天', '近30天', '本月', '今年', '自定义']
const feedbackTypeOptions = [
  '下单与订单问题', '拼车匹配问题', '接送机服务问题', '旅行包车问题',
  '行程与接送问题', '支付、退款与费用', '优惠券与活动', '司机与车辆服务',
  '平台客服问题', '账号与安全问题', '功能建议与使用体验', '其他问题',
]
const currentPage = ref(1)
const pageSize = ref<20 | 50 | 100>(20)
const selectedRow = ref<ModuleRow | null>(null)
const driverDetailInitialTab = ref<'profile' | 'reviews'>('profile')
const editTarget = ref<ModuleRow | null>(null)
const editMode = ref<'create' | 'edit' | null>(null)
const editDraft = reactive<Record<string, string>>({})
const deleteTarget = ref<ModuleRow | null>(null)
const vehicleRoutesTarget = ref<ModuleRow | null>(null)
const geofenceRoutesTarget = ref<ModuleRow | null>(null)
const passengerPreviewOpen = ref(false)
const couponGrantOpen = ref(false)
const driverMarkTarget = ref<ModuleRow | null>(null)
const exceptionRefundTarget = ref<ModuleRow | null>(null)
const exceptionCancelTarget = ref<ModuleRow | null>(null)
const driverMarkDraft = reactive({
  acceptingTypes: [] as string[],
  compliance: '' as '合规' | '非合规' | '',
  vehicleType: '',
})
const driverAcceptingTypeOptions = ['接送机', '包车']
const driverComplianceOptions: Array<'合规' | '非合规'> = ['合规', '非合规']
const vehicleGradeOptions = ['经济型', '舒适型', '豪华型']
const vehicleSeatOptions = computed(() => [...new Set(rows.value
  .map((row) => Number(row.seats))
  .filter((value) => Number.isInteger(value) && value > 0))]
  .sort((a, b) => a - b)
  .map(String))
const enabledDriverVehicleTypes = computed(() => (moduleCatalog['vehicle-types']?.rows ?? [])
  .filter((row) => row.status === '启用')
  .map((row) => String(row.name ?? ''))
  .filter(Boolean))
const settingsDraft = reactive<Record<string, string | boolean>>({})
const settingsBaseline = ref<Record<string, string | boolean>>({})
const confirmSettingsSave = ref(false)
const settingsHistoryOpen = ref(false)
const settingsHistoryBySection = reactive<Record<string, SettingsHistoryRecord[]>>({
  'order-config': [
    { id: 'CFG-260818-0042', operatedAt: '2026-08-18 14:32', operator: '运营管理员 · Ava', item: '接单容忍范围', before: '20 分钟', after: '30 分钟', scope: '后续接单校验', ip: '81.2.69.142' },
    { id: 'CFG-260815-0036', operatedAt: '2026-08-15 09:18', operator: '超级管理员 · Ava', item: '拼车下单截止', before: '36 小时', after: '48 小时', scope: '新下单', ip: '81.2.69.142' },
  ],
  'carpool-config': [
    { id: 'CFG-260818-0039', operatedAt: '2026-08-18 11:06', operator: '运营管理员 · Ava', item: '出发时间匹配窗口 T', before: '240 分钟', after: '360 分钟', scope: '后续撮合', ip: '81.2.69.142' },
    { id: 'CFG-260812-0028', operatedAt: '2026-08-12 16:40', operator: '运营管理员 · Ava', item: '拼车自动截团行李数', before: '4 件', after: '5 件', scope: '新拼车团', ip: '81.2.69.142' },
  ],
  'payment-config': [
    { id: 'CFG-260817-0034', operatedAt: '2026-08-17 17:25', operator: '超级管理员 · Ava', item: '最低提现金额', before: '£30.00', after: '£50.00', scope: '新提现申请', ip: '81.2.69.142' },
    { id: 'CFG-260810-0019', operatedAt: '2026-08-10 10:12', operator: '超级管理员 · Ava', item: '延迟分账时间', before: '15 分钟', after: '30 分钟', scope: '新建分账任务', ip: '81.2.69.142' },
  ],
})
const savedAtBySection = reactive<Record<string, string>>({})
const lastSavedAt = ref('2026-08-18 14:32')
const lastRefreshAt = ref('刚刚')

function clearRecord(record: Record<string, unknown>) {
  Object.keys(record).forEach((key) => delete record[key])
}

function closeEditor() {
  editMode.value = null
  editTarget.value = null
  clearRecord(editDraft)
}

function resetUserSearchState() {
  Object.assign(userSearchDraft, createEmptyUserSearch())
  Object.assign(userSearchApplied, createEmptyUserSearch())
}

function resetDriverSearchState() {
  Object.assign(driverSearchDraft, createEmptyDriverSearch())
  Object.assign(driverSearchApplied, createEmptyDriverSearch())
}

function resetFleetSearchState() {
  Object.assign(fleetSearchDraft, createEmptyFleetSearch())
  Object.assign(fleetSearchApplied, createEmptyFleetSearch())
}

function resetVehicleSearchState() {
  Object.assign(vehicleSearchDraft, createEmptyVehicleSearch())
  Object.assign(vehicleSearchApplied, createEmptyVehicleSearch())
}

function resetGeofenceSearchState() {
  Object.assign(geofenceSearchDraft, createEmptyGeofenceSearch())
  Object.assign(geofenceSearchApplied, createEmptyGeofenceSearch())
}

function resetAirportRouteSearchState() {
  Object.assign(airportRouteSearchDraft, createEmptyAirportRouteSearch())
  Object.assign(airportRouteSearchApplied, createEmptyAirportRouteSearch())
}

function resetCharterRouteSearchState() {
  Object.assign(charterRouteSearchDraft, createEmptyCharterRouteSearch())
  Object.assign(charterRouteSearchApplied, createEmptyCharterRouteSearch())
}

function resetCouponSearchState() {
  Object.assign(couponSearchDraft, createEmptyCouponSearch())
  Object.assign(couponSearchApplied, createEmptyCouponSearch())
}

function resetCouponGrantSearchState() {
  Object.assign(couponGrantSearchDraft, createEmptyCouponGrantSearch())
  Object.assign(couponGrantSearchApplied, createEmptyCouponGrantSearch())
}

function resetCampaignSearchState() {
  Object.assign(campaignSearchDraft, createEmptyCampaignSearch())
  Object.assign(campaignSearchApplied, createEmptyCampaignSearch())
}

function resetValueAddedServiceSearchState() {
  Object.assign(valueAddedServiceSearchDraft, createEmptyValueAddedServiceSearch())
  Object.assign(valueAddedServiceSearchApplied, createEmptyValueAddedServiceSearch())
}

function resetBannerSearchState() {
  Object.assign(bannerSearchDraft, createEmptyBannerSearch())
  Object.assign(bannerSearchApplied, createEmptyBannerSearch())
}

function resetNoticeSearchState() {
  Object.assign(noticeSearchDraft, createEmptyNoticeSearch())
  Object.assign(noticeSearchApplied, createEmptyNoticeSearch())
}

function resetMessageTemplateSearchState() {
  Object.assign(messageTemplateSearchDraft, createEmptyMessageTemplateSearch())
  Object.assign(messageTemplateSearchApplied, createEmptyMessageTemplateSearch())
}

function resetSettlementSearchState() {
  Object.assign(settlementSearchDraft, createEmptySettlementSearch())
  Object.assign(settlementSearchApplied, createEmptySettlementSearch())
}

function resetDriverStatementSearchState() {
  Object.assign(driverStatementSearchDraft, createEmptyDriverStatementSearch())
  Object.assign(driverStatementSearchApplied, createEmptyDriverStatementSearch())
}

function resetFeedbackSearchState() {
  Object.assign(feedbackSearchDraft, createEmptyFeedbackSearch())
  Object.assign(feedbackSearchApplied, createEmptyFeedbackSearch())
}

function resetExceptionOrderSearchState() {
  Object.assign(exceptionOrderSearchDraft, createEmptyExceptionOrderSearch())
  Object.assign(exceptionOrderSearchApplied, createEmptyExceptionOrderSearch())
}

function initializeModule() {
  rows.value = (config.value?.rows ?? []).map((row) => ({ ...row }))
  searchTerm.value = ''
  resetUserSearchState()
  resetDriverSearchState()
  resetFleetSearchState()
  resetVehicleSearchState()
  resetGeofenceSearchState()
  resetAirportRouteSearchState()
  resetCharterRouteSearchState()
  resetCouponSearchState()
  resetCouponGrantSearchState()
  resetCampaignSearchState()
  resetValueAddedServiceSearchState()
  resetBannerSearchState()
  resetNoticeSearchState()
  resetMessageTemplateSearchState()
  resetSettlementSearchState()
  resetDriverStatementSearchState()
  resetFeedbackSearchState()
  resetExceptionOrderSearchState()
  settlementStatsPeriod.value = '本月'
  settlementStatsFrom.value = '2026-08-01'
  settlementStatsTo.value = '2026-08-31'
  settlementStatsAppliedFrom.value = settlementStatsFrom.value
  settlementStatsAppliedTo.value = settlementStatsTo.value
  clearRecord(activeFilters)
  config.value?.filters?.forEach((filter) => {
    activeFilters[filter.key] = '全部'
  })
  currentPage.value = 1
  selectedRow.value = null
  deleteTarget.value = null
  vehicleRoutesTarget.value = null
  geofenceRoutesTarget.value = null
  passengerPreviewOpen.value = false
  couponGrantOpen.value = false
  driverMarkTarget.value = null
  exceptionRefundTarget.value = null
  exceptionCancelTarget.value = null
  driverDetailInitialTab.value = 'profile'
  closeEditor()
  clearRecord(settingsDraft)

  const initialSettings: Record<string, string | boolean> = {}
  config.value?.settings?.forEach((settingSection) => {
    settingSection.fields.forEach((field) => {
      const value = runtimeSettingValue(field)
      initialSettings[field.key] = value
      settingsDraft[field.key] = value
    })
  })
  settingsBaseline.value = { ...initialSettings }
  confirmSettingsSave.value = false
  settingsHistoryOpen.value = false
  lastSavedAt.value = savedAtBySection[section.value] ?? '2026-08-18 14:32'
  lastRefreshAt.value = '刚刚'
}

watch(section, initializeModule, { immediate: true })

const visibleColumns = computed(() => config.value?.columns ?? [])
const draftColumns = computed(() => {
  if (section.value === 'vehicle-types') {
    return visibleColumns.value.filter((column) => ['image', 'name', 'description', 'grade', 'seats', 'largeLuggageCapacity', 'smallLuggageCapacity'].includes(column.key))
  }
  if (section.value === 'geofences') return visibleColumns.value
  if (section.value === 'charter-routes') {
    const columns = [...visibleColumns.value]
    const nameIndex = columns.findIndex((column) => column.key === 'name')
    columns.splice(nameIndex + 1, 0, { key: 'intro', label: '路线介绍', kind: 'plain', width: '240px' })
    return columns
  }
  return visibleColumns.value.slice(0, 8)
})
const routeFences = computed(() => {
  section.value
  return moduleCatalog.geofences?.rows ?? []
})
const routeVehicles = computed(() => {
  section.value
  return moduleCatalog['vehicle-types']?.rows ?? []
})
const couponUsers = computed(() => moduleCatalog.users?.rows ?? [])
const campaignCoupons = computed(() => moduleCatalog.coupons?.rows ?? [])
const linkedRoutesForVehicle = computed(() => {
  if (!vehicleRoutesTarget.value) return []
  return (moduleCatalog['airport-routes']?.rows ?? []).filter((routeRow) => {
    const pricing = Array.isArray(routeRow.vehiclePricing) ? routeRow.vehiclePricing as Array<{ vehicleId?: string }> : []
    return pricing.some((item) => item.vehicleId === vehicleRoutesTarget.value?.id)
  })
})
const linkedRoutesForGeofence = computed(() => {
  if (!geofenceRoutesTarget.value) return []
  return (moduleCatalog['airport-routes']?.rows ?? []).filter((routeRow) => routeRow.startFenceId === geofenceRoutesTarget.value?.id || routeRow.endFenceId === geofenceRoutesTarget.value?.id)
})
const vehicleDeleteUsage = computed(() => {
  if (!deleteTarget.value || section.value !== 'vehicle-types') return { routes: 0, drivers: 0 }
  const routes = Number(deleteTarget.value.routeCount ?? 0)
  const drivers = (moduleCatalog.drivers?.rows ?? []).filter((driver) => driver.vehicleType === deleteTarget.value?.name).length
  return { routes, drivers }
})
const filteredRows = computed(() => {
  if (section.value === 'users') {
    const query = userSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())

    return rows.value.filter((row) => {
      const registeredDate = String(row.registeredAt ?? '').slice(0, 10)
      const matchesDateFrom = !query.registeredFrom || registeredDate >= query.registeredFrom
      const matchesDateTo = !query.registeredTo || registeredDate <= query.registeredTo
      const matchesIdentity = query.identity === '全部' || String(row.identity ?? '').includes(query.identity)
      const matchesStatus = query.status === '全部' || String(row.status ?? '').includes(query.status)
      return matchesDateFrom
        && matchesDateTo
        && matchesIdentity
        && matchesStatus
        && textMatches(row.id, query.userId)
        && textMatches(row.name, query.name)
        && textMatches(row.englishName, query.englishName)
        && textMatches(row.phone, query.phone)
        && textMatches(row.email, query.email)
    })
  }

  if (section.value === 'drivers') {
    const query = driverSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())

    return rows.value.filter((row) => {
      const certifiedDate = String(row.certifiedAt ?? '').slice(0, 10)
      const matchesDateFrom = !query.certifiedFrom || certifiedDate >= query.certifiedFrom
      const matchesDateTo = !query.certifiedTo || certifiedDate <= query.certifiedTo
      const matchesVehicleType = query.vehicleType === '全部' || row.vehicleType === query.vehicleType
      const matchesCompliance = query.compliance === '全部' || row.compliance === query.compliance
      const matchesStatus = query.status === '全部' || row.status === query.status
      return matchesDateFrom
        && matchesDateTo
        && matchesVehicleType
        && matchesCompliance
        && matchesStatus
        && textMatches(row.driverId, query.driverId)
        && textMatches(row.name, query.name)
        && textMatches(row.phone, query.phone)
        && textMatches(row.plate, query.plate)
        && textMatches(row.email, query.email)
    })
  }

  if (isFleetMonitoring.value) {
    const query = fleetSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())

    return rows.value.filter((row) => {
      const matchesVehicleType = query.vehicleType === '全部' || row.vehicleType === query.vehicleType
      const matchesOnlineStatus = query.onlineStatus === '全部' || row.onlineStatus === query.onlineStatus
      const matchesStatus = query.status === '全部' || row.status === query.status
      return matchesVehicleType
        && matchesOnlineStatus
        && matchesStatus
        && textMatches(row.id, query.driverId)
        && textMatches(row.name, query.name)
        && textMatches(row.phone, query.phone)
        && textMatches(row.plate, query.plate)
    })
  }

  if (section.value === 'vehicle-types') {
    const query = vehicleSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
    return rows.value.filter((row) => (query.status === '全部' || row.status === query.status)
      && (query.seats === '全部' || String(row.seats ?? '') === query.seats)
      && (query.grade === '全部' || row.grade === query.grade)
      && textMatches(row.name, query.name))
  }

  if (section.value === 'geofences') {
    const query = geofenceSearchApplied
    return rows.value.filter((row) => {
      const matchesText = !query.name.trim() || String(row.name ?? '').toLowerCase().includes(query.name.trim().toLowerCase())
      const matchesType = query.type === '全部' || row.type === query.type
      const matchesStatus = query.status === '全部' || row.status === query.status
      return matchesText && matchesType && matchesStatus
    })
  }

  if (section.value === 'airport-routes') {
    const query = airportRouteSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
    return rows.value.filter((row) => textMatches(row.id, query.routeId)
      && textMatches(row.name, query.name)
      && (query.business === '全部' || row.business === query.business)
      && (query.startFenceId === '全部' || row.startFenceId === query.startFenceId)
      && (query.endFenceId === '全部' || row.endFenceId === query.endFenceId)
      && (query.popular === '全部' || row.popular === query.popular)
      && (query.status === '全部' || row.status === query.status))
  }

  if (section.value === 'charter-routes') {
    const query = charterRouteSearchApplied
    return rows.value.filter((row) => {
      const rowMatchesName = !query.name.trim()
        || String(row.name ?? '').toLowerCase().includes(query.name.trim().toLowerCase())
      return rowMatchesName && (query.status === '全部' || row.status === query.status)
    })
  }

  if (section.value === 'coupons') {
    const query = couponSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
    return rows.value.filter((row) => {
      const rowValidFrom = String(row.validFrom ?? '')
      const rowValidTo = String(row.validTo ?? '')
      const overlapsFrom = !query.validFrom || !rowValidTo || rowValidTo >= query.validFrom
      const overlapsTo = !query.validTo || !rowValidFrom || rowValidFrom <= query.validTo
      return textMatches(row.id, query.couponId)
        && textMatches(row.name, query.name)
        && (query.couponType === '全部' || row.couponType === query.couponType)
        && (query.service === '全部' || row.service === query.service)
        && overlapsFrom
        && overlapsTo
        && (query.status === '全部' || row.status === query.status)
    })
  }

  if (section.value === 'coupon-grants') {
    const query = couponGrantSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
    return rows.value.filter((row) => {
      const rowValidFrom = String(row.validFrom ?? String(row.validity ?? '').slice(0, 10))
      const rowValidTo = String(row.validTo ?? String(row.validity ?? '').slice(-10))
      const grantedDate = String(row.grantedDate ?? row.grantedAt ?? '').slice(0, 10)
      return textMatches(row.couponId, query.couponId)
        && textMatches(row.code, query.code)
        && textMatches(row.couponName, query.couponName)
        && textMatches(row.phone, query.phone)
        && (query.couponType === '全部' || row.couponType === query.couponType)
        && (query.service === '全部' || row.service === query.service)
        && (!query.validFrom || !rowValidTo || rowValidTo >= query.validFrom)
        && (!query.validTo || !rowValidFrom || rowValidFrom <= query.validTo)
        && (!query.grantedFrom || grantedDate >= query.grantedFrom)
        && (!query.grantedTo || grantedDate <= query.grantedTo)
        && (query.status === '全部' || row.status === query.status)
    })
  }

  if (section.value === 'campaigns') {
    const query = campaignSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
    return rows.value.filter((row) => {
      const rowValidFrom = String(row.validFrom ?? String(row.validity ?? '').slice(0, 10))
      const rowValidTo = String(row.validTo ?? String(row.validity ?? '').slice(-10))
      return textMatches(row.id, query.campaignId)
        && textMatches(row.name, query.name)
        && (!query.validFrom || !rowValidTo || rowValidTo >= query.validFrom)
        && (!query.validTo || !rowValidFrom || rowValidFrom <= query.validTo)
        && (query.status === '全部' || row.status === query.status)
    })
  }

  if (section.value === 'value-added-services') {
    const query = valueAddedServiceSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
    return rows.value.filter((row) => textMatches(row.name, query.name)
      && textMatches(row.description, query.description)
      && (query.status === '全部' || row.status === query.status))
  }

  if (section.value === 'banners') {
    const query = bannerSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
    return rows.value.filter((row) => {
      const rowValidFrom = String(row.validFrom ?? String(row.validity ?? '').slice(0, 10))
      const rowValidTo = String(row.validTo ?? String(row.validity ?? '').slice(-10))
      return textMatches(row.name, query.name)
        && (query.channel === '全部' || String(row.channel ?? '').includes(query.channel))
        && (query.status === '全部' || row.status === query.status)
        && (!query.validFrom || !rowValidTo || rowValidTo >= query.validFrom)
        && (!query.validTo || !rowValidFrom || rowValidFrom <= query.validTo)
    })
  }

  if (section.value === 'notices') {
    const query = noticeSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
    return rows.value.filter((row) => {
      const rowValidFrom = String(row.validFrom ?? String(row.validity ?? '').slice(0, 10))
      const rowValidTo = String(row.validTo ?? String(row.validity ?? '').slice(-10))
      return textMatches(row.title, query.title)
        && (query.channel === '全部' || String(row.channel ?? '').includes(query.channel))
        && (query.status === '全部' || row.status === query.status)
        && (!query.validFrom || !rowValidTo || rowValidTo >= query.validFrom)
        && (!query.validTo || !rowValidFrom || rowValidFrom <= query.validTo)
    })
  }

  if (section.value === 'carpool-copy' || section.value === 'system-messages') {
    const query = messageTemplateSearchApplied
    return rows.value.filter((row) => {
      const matchesContent = !query.content.trim()
        || String(row.content ?? '').toLowerCase().includes(query.content.trim().toLowerCase())
      const matchesEndpoint = query.endpoint === '全部' || row.endpoint === query.endpoint
      const matchesGroup = section.value === 'carpool-copy' || query.group === '全部' || row.group === query.group
      const matchesNode = query.node === '全部' || row.node === query.node
      const matchesStatus = query.status === '全部' || row.status === query.status
      return matchesContent && matchesEndpoint && matchesGroup && matchesNode && matchesStatus
    })
  }

  if (section.value === 'settlements') {
    const query = settlementSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
    return rows.value.filter((row) => {
      const settledDate = String(row.settledAt ?? '').slice(0, 10)
      return textMatches(row.id, query.orderId)
        && textMatches(row.phone, query.driverPhone)
        && textMatches(row.driver, query.driverName)
        && (!query.settledFrom || settledDate >= query.settledFrom)
        && (!query.settledTo || settledDate <= query.settledTo)
        && (query.status === '全部' || row.status === query.status)
    })
  }

  if (section.value === 'driver-statements') {
    const query = driverStatementSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
    return rows.value.filter((row) => {
      const settledDate = String(row.lastSettledAt ?? '').slice(0, 10)
      return textMatches(row.id, query.driverId)
        && textMatches(row.phone, query.driverPhone)
        && textMatches(row.driver, query.driverName)
        && (!query.lastSettledFrom || settledDate >= query.lastSettledFrom)
        && (!query.lastSettledTo || settledDate <= query.lastSettledTo)
    })
  }

  if (section.value === 'feedback') {
    const query = feedbackSearchApplied
    const contentKeyword = query.content.trim().toLowerCase()
    return rows.value.filter((row) => {
      const submittedDate = String(row.submittedAt ?? '').slice(0, 10)
      return (query.feedbackType === '全部' || row.feedbackType === query.feedbackType)
        && (!contentKeyword || String(row.content ?? '').toLowerCase().includes(contentKeyword))
        && (query.identity === '全部' || row.identity === query.identity)
        && (query.status === '全部' || row.status === query.status)
        && (!query.submittedFrom || submittedDate >= query.submittedFrom)
        && (!query.submittedTo || submittedDate <= query.submittedTo)
    })
  }

  if (section.value === 'exception-orders') {
    const query = exceptionOrderSearchApplied
    const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
      || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
    return rows.value.filter((row) => {
      const reportedDate = String(row.reportedAt ?? '').slice(0, 10)
      return textMatches(row.id, query.orderId)
        && textMatches(row.passenger, query.passengerName)
        && textMatches(row.phone, query.passengerPhone)
        && textMatches(row.driver, query.driverName)
        && (!query.reportedFrom || reportedDate >= query.reportedFrom)
        && (!query.reportedTo || reportedDate <= query.reportedTo)
        && (query.status === '全部' || row.status === query.status)
    })
  }

  const term = searchTerm.value.trim().toLowerCase()
  const filters = config.value?.filters ?? []

  return rows.value.filter((row) => {
    const matchesTerm = !term || Object.values(row)
      .some((value) => String(value ?? '').toLowerCase().includes(term))
    const matchesFilters = filters.every((filter) => {
      const selected = activeFilters[filter.key]
      return !selected || selected === '全部' || String(row[filter.key] ?? '').includes(selected)
    })
    return matchesTerm && matchesFilters
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})
const overviewMetrics = computed(() => {
  const metrics = config.value?.metrics ?? []
  if (isFinanceModule.value) {
    const rangeStart = new Date(`${settlementStatsAppliedFrom.value}T00:00:00`)
    const rangeEnd = new Date(`${settlementStatsAppliedTo.value}T00:00:00`)
    const rangeDays = Number.isFinite(rangeStart.getTime()) && Number.isFinite(rangeEnd.getTime())
      ? Math.max(1, Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1)
      : 30
    const periodDays: Record<SettlementStatsPeriod, number> = {
      今日: 1,
      近3天: 3,
      近7天: 7,
      近30天: 30,
      本月: 30,
      今年: 365,
      自定义: rangeDays,
    }
    const days = periodDays[settlementStatsPeriod.value]
    const periodNote = settlementStatsPeriod.value === '自定义'
      ? `${settlementStatsAppliedFrom.value} 至 ${settlementStatsAppliedTo.value}`
      : settlementStatsPeriod.value

    if (section.value === 'driver-statements') {
      const baseValues: Record<string, number> = {
        统计司机: 86,
        完成订单: 1452,
        订单金额: 92684,
        实发金额: 72906,
      }
      return metrics.map((metric) => {
        const baseValue = baseValues[metric.label]
        if (baseValue === undefined) return metric
        const value = baseValue * days / 30
        const isCurrency = metric.label === '订单金额' || metric.label === '实发金额'
        return {
          ...metric,
          value: isCurrency
            ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value)
            : new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value),
          note: periodNote,
        }
      })
    }

    const baseValues: Record<string, number> = {
      订单总额: 184265,
      平台抽成: 29482.4,
      结算中金额: 12486.2,
      结算失败: 2418.8,
    }
    return metrics.map((metric) => {
      const baseValue = baseValues[metric.label]
      if (baseValue === undefined) return metric
      const value = baseValue * days / 30
      return {
        ...metric,
        value: new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value),
        note: periodNote,
      }
    })
  }
  if (section.value === 'vehicle-types') {
    const enabledCount = rows.value.filter((row) => row.status === '启用').length
    const disabledCount = rows.value.filter((row) => row.status === '禁用').length
    const routeCount = rows.value.reduce((sum, row) => sum + Number(row.routeCount ?? 0), 0)
    return metrics.map((metric) => {
      if (metric.label === '车型总数') return { ...metric, value: String(rows.value.length) }
      if (metric.label === '启用车型') return { ...metric, value: String(enabledCount) }
      if (metric.label === '禁用车型') return { ...metric, value: String(disabledCount) }
      if (metric.label === '路线关联') return { ...metric, value: String(routeCount) }
      return metric
    })
  }
  if (section.value === 'geofences') {
    const airportCount = rows.value.filter((row) => row.type === '机场').length
    const cityCount = rows.value.filter((row) => row.type === '城市').length
    const enabledCount = rows.value.filter((row) => row.status === '启用').length
    return metrics.map((metric) => {
      if (metric.label === '围栏总数') return { ...metric, value: String(rows.value.length) }
      if (metric.label === '机场围栏') return { ...metric, value: String(airportCount) }
      if (metric.label === '城市围栏') return { ...metric, value: String(cityCount) }
      if (metric.label === '已启用') return { ...metric, value: String(enabledCount) }
      return metric
    })
  }
  if (section.value === 'airport-routes') {
    const enabledCount = rows.value.filter((row) => row.status === '启用').length
    const popularCount = rows.value.filter((row) => row.popular === '热门').length
    const pickupCount = rows.value.filter((row) => row.business === '接机').length
    return metrics.map((metric) => {
      if (metric.label === '路线总数') return { ...metric, value: String(rows.value.length) }
      if (metric.label === '启用路线') return { ...metric, value: String(enabledCount) }
      if (metric.label === '热门路线') return { ...metric, value: String(popularCount) }
      if (metric.label === '接机路线') return { ...metric, value: String(pickupCount) }
      return metric
    })
  }
  if (section.value === 'carpool-copy') {
    const enabledCount = rows.value.filter((row) => row.status === '启用').length
    const passengerCount = rows.value.filter((row) => row.endpoint === '乘客端').length
    const driverCount = rows.value.filter((row) => row.endpoint === '司导端').length
    return metrics.map((metric) => {
      if (metric.label === '模板总数') return { ...metric, value: String(rows.value.length), note: `启用 ${enabledCount} 条` }
      if (metric.label === '乘客端') return { ...metric, value: String(passengerCount) }
      if (metric.label === '司导端') return { ...metric, value: String(driverCount) }
      return metric
    })
  }
  if (section.value === 'system-messages') {
    const passengerCount = rows.value.filter((row) => row.endpoint === '乘客端').length
    const driverCount = rows.value.filter((row) => row.endpoint === '司导端').length
    return metrics.map((metric) => {
      if (metric.label === '消息模板') return { ...metric, value: String(rows.value.length) }
      if (metric.label === '乘客端') return { ...metric, value: String(passengerCount), note: `启用 ${rows.value.filter((row) => row.endpoint === '乘客端' && row.status === '启用').length} 个` }
      if (metric.label === '司导端') return { ...metric, value: String(driverCount), note: `启用 ${rows.value.filter((row) => row.endpoint === '司导端' && row.status === '启用').length} 个` }
      return metric
    })
  }
  if (section.value !== 'charter-routes') return metrics
  const enabledCount = rows.value.filter((row) => row.status === '启用').length
  const disabledCount = rows.value.filter((row) => row.status === '禁用').length
  return metrics.map((metric) => {
    if (metric.label === '包车路线') return { ...metric, value: String(rows.value.length) }
    if (metric.label === '已启用') return { ...metric, value: String(enabledCount) }
    if (metric.label === '已禁用') return { ...metric, value: String(disabledCount) }
    return metric
  })
})
const charterPreviewRows = computed(() => rows.value.filter((row) => row.status === '启用'))
const maxTrendValue = computed(() => Math.max(...(config.value?.trendPanel?.values ?? [1]), 1))
const fleetMetricGroups = computed(() => [
  { key: 'total', label: '总量' },
  { key: 'connection', label: '连接状态' },
  { key: 'permission', label: '权限状态' },
].map((group) => ({
  ...group,
  metrics: config.value?.metrics.filter((metric) => metric.group === group.key) ?? [],
})))
const settingsDirty = computed(() => Object.keys(settingsBaseline.value)
  .some((key) => settingsBaseline.value[key] !== settingsDraft[key]))
const currentSettingsHistory = computed(() => settingsHistoryBySection[section.value] ?? [])

watch([filteredRows, pageSize], () => {
  currentPage.value = 1
})

function statusTone(value: unknown): BadgeTone {
  const label = String(value ?? '')
  if (/失败|冻结|禁用|下架|异常|过期|已取消|高风险|缺口|非合规/.test(label)) return 'danger'
  if (/待|处理中|紧张|即将|临近|中风险|未核销|结算中/.test(label)) return 'warning'
  if (/启用|正常|成功|已认证|在线|行程中|已发布|进行中|已生效|已核销|已结算|已处理|已完结|充足|低风险|合规/.test(label)) return 'success'
  if (/草稿|离线|关闭|已结束|只读/.test(label)) return 'neutral'
  return 'info'
}

function formatCell(value: unknown, column: ModuleColumn) {
  if (value === undefined || value === null || value === '') return '—'
  if (column.kind === 'currency' && typeof value === 'number') {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)
  }
  if (typeof value === 'boolean') return value ? '是' : '否'
  return String(value)
}

function progressWidth(value: unknown) {
  const label = String(value ?? '').trim()
  if (/^\d+(?:\.\d+)?%$/.test(label)) return label
  const ratio = label.match(/^([\d,.]+)\s*\/\s*([\d,.]+)$/)
  if (!ratio) return '0%'
  const current = Number(ratio[1]?.replaceAll(',', ''))
  const total = Number(ratio[2]?.replaceAll(',', ''))
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) return '0%'
  return `${Math.min(100, Math.max(0, current / total * 100))}%`
}

function applyMetricFilter(metric: ModuleMetric) {
  if (!metric.filter) return
  if (section.value === 'settlements' && metric.filter.key === 'status') {
    settlementSearchDraft.status = metric.filter.value
    applySettlementSearch()
    return
  }
  if (section.value === 'users' && (metric.filter.key === 'identity' || metric.filter.key === 'status')) {
    userSearchDraft[metric.filter.key] = metric.filter.value
    applyUserSearch()
    return
  }
  if (section.value === 'feedback' && metric.filter.key === 'status') {
    feedbackSearchDraft.status = metric.filter.value
    applyFeedbackSearch()
    return
  }
  if (section.value === 'exception-orders' && metric.filter.key === 'status') {
    exceptionOrderSearchDraft.status = metric.filter.value
    applyExceptionOrderSearch()
    return
  }
  if (section.value === 'charter-routes' && metric.filter.key === 'status') {
    charterRouteSearchDraft.status = metric.filter.value
    applyCharterRouteSearch()
    return
  }
  if (section.value === 'drivers' && (metric.filter.key === 'compliance' || metric.filter.key === 'status')) {
    driverSearchDraft[metric.filter.key] = metric.filter.value
    applyDriverSearch()
    return
  }
  if (isFleetMonitoring.value && (metric.filter.key === 'onlineStatus' || metric.filter.key === 'status')) {
    fleetSearchDraft[metric.filter.key] = metric.filter.value
    applyFleetSearch()
    return
  }
  if (section.value === 'geofences' && (metric.filter.key === 'type' || metric.filter.key === 'status')) {
    geofenceSearchDraft[metric.filter.key] = metric.filter.value
    applyGeofenceSearch()
    return
  }
  if (section.value === 'airport-routes') {
    if (metric.filter.key === 'business') airportRouteSearchDraft.business = metric.filter.value
    else if (metric.filter.key === 'popular') airportRouteSearchDraft.popular = metric.filter.value
    else if (metric.filter.key === 'status') airportRouteSearchDraft.status = metric.filter.value
    else return
    applyAirportRouteSearch()
    return
  }
  if (section.value === 'charter-routes') {
    resetCharterRouteSearchState()
    currentPage.value = 1
    return
  }
  activeFilters[metric.filter.key] = metric.filter.value
  currentPage.value = 1
}

function openRowDetail(row: ModuleRow, initialTab: 'profile' | 'reviews' = 'profile') {
  driverDetailInitialTab.value = initialTab
  selectedRow.value = row
}

function closeRowDetail() {
  selectedRow.value = null
  driverDetailInitialTab.value = 'profile'
}

function openGeofenceRoutes(row: ModuleRow) {
  geofenceRoutesTarget.value = row
}

function resetFilters() {
  if (section.value === 'users') {
    resetUserSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'drivers') {
    resetDriverSearchState()
    currentPage.value = 1
    return
  }
  if (isFleetMonitoring.value) {
    resetFleetSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'vehicle-types') {
    resetVehicleSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'geofences') {
    resetGeofenceSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'airport-routes') {
    resetAirportRouteSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'charter-routes') {
    resetCharterRouteSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'coupons') {
    resetCouponSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'coupon-grants') {
    resetCouponGrantSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'campaigns') {
    resetCampaignSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'value-added-services') {
    resetValueAddedServiceSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'banners') {
    resetBannerSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'notices') {
    resetNoticeSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'carpool-copy' || section.value === 'system-messages') {
    resetMessageTemplateSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'settlements') {
    resetSettlementSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'driver-statements') {
    resetDriverStatementSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'feedback') {
    resetFeedbackSearchState()
    currentPage.value = 1
    return
  }
  if (section.value === 'exception-orders') {
    resetExceptionOrderSearchState()
    currentPage.value = 1
    return
  }
  searchTerm.value = ''
  Object.keys(activeFilters).forEach((key) => {
    activeFilters[key] = '全部'
  })
}

function applyUserSearch() {
  if (userSearchDraft.registeredFrom && userSearchDraft.registeredTo
    && userSearchDraft.registeredFrom > userSearchDraft.registeredTo) {
    appStore.notify('搜索条件有误', '注册开始日期不能晚于注册结束日期。', 'danger')
    return
  }
  Object.assign(userSearchApplied, userSearchDraft)
  currentPage.value = 1
}

function applyDriverSearch() {
  if (driverSearchDraft.certifiedFrom && driverSearchDraft.certifiedTo
    && driverSearchDraft.certifiedFrom > driverSearchDraft.certifiedTo) {
    appStore.notify('搜索条件有误', '认证开始日期不能晚于认证结束日期。', 'danger')
    return
  }
  Object.assign(driverSearchApplied, driverSearchDraft)
  currentPage.value = 1
}

function applyFleetSearch() {
  Object.assign(fleetSearchApplied, fleetSearchDraft)
  currentPage.value = 1
}

function applyVehicleSearch() {
  Object.assign(vehicleSearchApplied, vehicleSearchDraft)
  currentPage.value = 1
}

function applyGeofenceSearch() {
  Object.assign(geofenceSearchApplied, geofenceSearchDraft)
  currentPage.value = 1
}

function applyAirportRouteSearch() {
  Object.assign(airportRouteSearchApplied, airportRouteSearchDraft)
  currentPage.value = 1
}

function applyCharterRouteSearch() {
  Object.assign(charterRouteSearchApplied, charterRouteSearchDraft)
  currentPage.value = 1
}

function applyCouponSearch() {
  if (couponSearchDraft.validFrom && couponSearchDraft.validTo
    && couponSearchDraft.validFrom > couponSearchDraft.validTo) {
    appStore.notify('搜索条件有误', '有效期开始日期不能晚于结束日期。', 'danger')
    return
  }
  Object.assign(couponSearchApplied, couponSearchDraft)
  currentPage.value = 1
}

function applyCouponGrantSearch() {
  if (couponGrantSearchDraft.validFrom && couponGrantSearchDraft.validTo
    && couponGrantSearchDraft.validFrom > couponGrantSearchDraft.validTo) {
    appStore.notify('搜索条件有误', '有效期开始日期不能晚于结束日期。', 'danger')
    return
  }
  if (couponGrantSearchDraft.grantedFrom && couponGrantSearchDraft.grantedTo
    && couponGrantSearchDraft.grantedFrom > couponGrantSearchDraft.grantedTo) {
    appStore.notify('搜索条件有误', '发放开始日期不能晚于结束日期。', 'danger')
    return
  }
  Object.assign(couponGrantSearchApplied, couponGrantSearchDraft)
  currentPage.value = 1
}

function applyCampaignSearch() {
  if (campaignSearchDraft.validFrom && campaignSearchDraft.validTo
    && campaignSearchDraft.validFrom > campaignSearchDraft.validTo) {
    appStore.notify('搜索条件有误', '有效期开始日期不能晚于结束日期。', 'danger')
    return
  }
  Object.assign(campaignSearchApplied, campaignSearchDraft)
  currentPage.value = 1
}

function applyValueAddedServiceSearch() {
  Object.assign(valueAddedServiceSearchApplied, valueAddedServiceSearchDraft)
  currentPage.value = 1
}

function applyBannerSearch() {
  if (bannerSearchDraft.validFrom && bannerSearchDraft.validTo
    && bannerSearchDraft.validFrom > bannerSearchDraft.validTo) {
    appStore.notify('搜索条件有误', '生效开始日期不能晚于结束日期。', 'danger')
    return
  }
  Object.assign(bannerSearchApplied, bannerSearchDraft)
  currentPage.value = 1
}

function applyNoticeSearch() {
  if (noticeSearchDraft.validFrom && noticeSearchDraft.validTo
    && noticeSearchDraft.validFrom > noticeSearchDraft.validTo) {
    appStore.notify('搜索条件有误', '生效开始日期不能晚于结束日期。', 'danger')
    return
  }
  Object.assign(noticeSearchApplied, noticeSearchDraft)
  currentPage.value = 1
}

function applyMessageTemplateSearch() {
  Object.assign(messageTemplateSearchApplied, messageTemplateSearchDraft)
  currentPage.value = 1
}

function applySettlementSearch() {
  if (settlementSearchDraft.settledFrom && settlementSearchDraft.settledTo
    && settlementSearchDraft.settledFrom > settlementSearchDraft.settledTo) {
    appStore.notify('搜索条件有误', '结算开始时间不能晚于结算结束时间。', 'danger')
    return
  }
  Object.assign(settlementSearchApplied, settlementSearchDraft)
  currentPage.value = 1
}

function applyDriverStatementSearch() {
  if (driverStatementSearchDraft.lastSettledFrom && driverStatementSearchDraft.lastSettledTo
    && driverStatementSearchDraft.lastSettledFrom > driverStatementSearchDraft.lastSettledTo) {
    appStore.notify('搜索条件有误', '最近结算开始时间不能晚于结束时间。', 'danger')
    return
  }
  Object.assign(driverStatementSearchApplied, driverStatementSearchDraft)
  currentPage.value = 1
}

function applyFeedbackSearch() {
  if (feedbackSearchDraft.submittedFrom && feedbackSearchDraft.submittedTo
    && feedbackSearchDraft.submittedFrom > feedbackSearchDraft.submittedTo) {
    appStore.notify('搜索条件有误', '提交开始日期不能晚于结束日期。', 'danger')
    return
  }
  Object.assign(feedbackSearchApplied, feedbackSearchDraft)
  currentPage.value = 1
}

function applyExceptionOrderSearch() {
  if (exceptionOrderSearchDraft.reportedFrom && exceptionOrderSearchDraft.reportedTo
    && exceptionOrderSearchDraft.reportedFrom > exceptionOrderSearchDraft.reportedTo) {
    appStore.notify('搜索条件有误', '上报开始日期不能晚于结束日期。', 'danger')
    return
  }
  Object.assign(exceptionOrderSearchApplied, exceptionOrderSearchDraft)
  currentPage.value = 1
}

function selectSettlementStatsPeriod(period: SettlementStatsPeriod) {
  settlementStatsPeriod.value = period
}

function applySettlementStatsRange() {
  if (!settlementStatsFrom.value || !settlementStatsTo.value) {
    appStore.notify('请选择统计日期', '自定义统计需要同时选择开始日期和结束日期。', 'warning')
    return
  }
  if (settlementStatsFrom.value > settlementStatsTo.value) {
    appStore.notify('统计范围有误', '统计开始日期不能晚于统计结束日期。', 'danger')
    return
  }
  settlementStatsAppliedFrom.value = settlementStatsFrom.value
  settlementStatsAppliedTo.value = settlementStatsTo.value
  settlementStatsPeriod.value = '自定义'
  appStore.notify('统计口径已更新', `${settlementStatsAppliedFrom.value} 至 ${settlementStatsAppliedTo.value}，仅更新顶部统计数据。`, 'success')
}

function refreshModule() {
  lastRefreshAt.value = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date())
  appStore.notify('数据已刷新', `${pageMeta.value.title}的页面数据已更新。`, 'success')
}

function exportRows() {
  const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  const csv = [
    visibleColumns.value.map((column) => csvCell(column.label)).join(','),
    ...filteredRows.value.map((row) => visibleColumns.value
      .map((column) => csvCell(formatCell(row[column.key], column))).join(',')),
  ].join('\n')
  const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `yomi-${section.value}.csv`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
  appStore.notify('数据已导出', `已导出 ${filteredRows.value.length} 条筛选结果。`, 'success')
}

function handlePrimaryAction() {
  if (!config.value) return
  if (config.value.kind === 'settings') {
    const validationMessage = validateSettings()
    if (validationMessage) {
      appStore.notify('配置校验未通过', validationMessage, 'danger')
      return
    }
    confirmSettingsSave.value = true
    return
  }
  if (config.value.kind === 'dashboard') {
    refreshModule()
    return
  }
  if (config.value.canCreate === false) {
    refreshModule()
    return
  }
  openCreate()
}

function handleSecondaryAction() {
  if (!config.value) return
  if (section.value === 'coupons') {
    couponGrantOpen.value = true
    return
  }
  if (section.value === 'charter-routes') {
    passengerPreviewOpen.value = true
    return
  }
  if (config.value.kind === 'settings') {
    const action = config.value.secondaryAction ?? '查看修改记录'
    if (action.includes('撤销')) resetSettings()
    else if (action.includes('修改记录')) settingsHistoryOpen.value = true
    else appStore.notify(`${action}已打开`, '该入口已接入当前原型的操作与权限反馈。', 'info')
    return
  }
  if (config.value.kind === 'dashboard') {
    refreshModule()
    return
  }
  if (!config.value.secondaryAction || config.value.secondaryAction.includes('导出')) {
    exportRows()
    return
  }
  appStore.notify(`${config.value.secondaryAction}已打开`, '当前原型已完成操作入口与权限反馈。', 'info')
}

function validateSettings() {
  const numberValue = (key: string) => Number(settingsDraft[key])
  const outOfRange = (key: string, minimum: number, maximum: number) => {
    const value = numberValue(key)
    return !Number.isFinite(value) || value < minimum || value > maximum
  }
  if (section.value === 'order-config') {
    const carpoolCutoff = numberValue('carpoolCutoff')
    const exclusiveCutoff = numberValue('exclusiveCutoff')
    if (outOfRange('bookingHorizon', 1, 180)) return '下单截止时间必须在 1–180 天之间。'
    if (outOfRange('carpoolCutoff', 24, 168)) return '拼车下单截止必须在 24–168 小时之间。'
    if (outOfRange('exclusiveCutoff', 1, 72)) return '独享下单截止必须在 1–72 小时之间。'
    if (outOfRange('exceptionReportTime', 0, 180)) return '异常上报时间必须在 0–180 分钟之间。'
    if (outOfRange('acceptanceTolerance', 0, 120)) return '接单容忍范围必须在 0–120 分钟之间。'
    if (carpoolCutoff < exclusiveCutoff) return '拼车下单截止不能早于独享下单截止。'
    if (carpoolCutoff < businessConfig.autoGroupCutoffHours) return `拼车下单截止不能早于当前拼车自动截团时间（${businessConfig.autoGroupCutoffHours} 小时）。`
  }
  if (section.value === 'carpool-config') {
    if (outOfRange('autoGroupPassengers', 2, 8)) return '拼车自动截团人数必须在 2–8 人之间。'
    if (outOfRange('autoGroupLuggage', 2, 10)) return '拼车自动截团行李数必须在 2–10 件之间。'
    if (outOfRange('minimumGroupPassengers', 1, 5)) return '拼车保底成团人数必须在 1–5 人之间。'
    if (outOfRange('autoGroupCutoff', 12, 96)) return '拼车自动截团时间必须在 12–96 小时之间。'
    if (outOfRange('departureMatchWindow', 15, 720)) return '出发时间匹配窗口必须在 15–720 分钟之间。'
    if (numberValue('autoGroupPassengers') <= numberValue('minimumGroupPassengers')) {
      return '自动截团人数必须大于保底成团人数。'
    }
    if (numberValue('autoGroupCutoff') > businessConfig.carpoolCutoffHours) return `自动截团时间不能晚于订单配置中的拼车下单截止（${businessConfig.carpoolCutoffHours} 小时）。`
  }
  if (section.value === 'payment-config') {
    if (outOfRange('transferDelay', 0, 1440)) return '延迟分账时间必须在 0–1440 分钟之间。'
    if (outOfRange('minimumPayout', 0, 1000)) return '最低提现金额必须在 £0–£1000 之间。'
    if (outOfRange('payoutFee', 0, 50)) return '每笔提现手续费必须在 £0–£50 之间。'
    if (numberValue('minimumPayout') <= numberValue('payoutFee')) return '最低提现金额必须大于每笔提现手续费。'
  }
  return ''
}

function optionsForColumn(column: ModuleColumn) {
  if (section.value === 'geofences' && column.key === 'geometryRelation') {
    return ['正常', '包含关系（小围栏优先）', '部分交叠（仅警示）']
  }
  if (section.value === 'vehicle-types') {
    if (column.key === 'grade') return vehicleGradeOptions
    if (column.key === 'seats') return []
  }
  return (config.value?.filters?.find((filter) => filter.key === column.key)?.options ?? [])
    .filter((option) => option !== '全部')
}

function isDraftFieldRequired(column: ModuleColumn) {
  if (section.value === 'vehicle-types') return ['image', 'name', 'description', 'grade', 'seats', 'largeLuggageCapacity', 'smallLuggageCapacity'].includes(column.key)
  return section.value === 'charter-routes' && ['name', 'intro', 'description', 'referenceAmount', 'phone', 'sort'].includes(column.key)
}

function handleVehicleImageUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    appStore.notify('图片格式不支持', '请上传 JPG、PNG、WebP 或其他常见图片格式。', 'danger')
    input.value = ''
    return
  }
  if (file.size > 3 * 1024 * 1024) {
    appStore.notify('图片文件过大', '车型图片不能超过 3 MB，请压缩后重新上传。', 'danger')
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    editDraft.image = String(reader.result ?? '')
    input.value = ''
  }
  reader.onerror = () => appStore.notify('图片读取失败', '无法读取该图片，请更换文件后重试。', 'danger')
  reader.readAsDataURL(file)
}

function openCreate() {
  clearRecord(editDraft)
  draftColumns.value.forEach((column) => {
    editDraft[column.key] = optionsForColumn(column)[0] ?? ''
  })
  if (section.value === 'geofences') {
    editDraft.vertexCount = '3'
    editDraft.geometryRelation = '正常'
  }
  editTarget.value = null
  editMode.value = 'create'
}

function openEdit(row: ModuleRow) {
  if (section.value === 'campaigns' && row.status !== '下架') {
    appStore.notify('活动不可编辑', '已上架活动不支持编辑，请先执行下架操作。', 'warning')
    return
  }
  clearRecord(editDraft)
  draftColumns.value.forEach((column) => {
    editDraft[column.key] = String(row[column.key] ?? '')
  })
  editTarget.value = row
  editMode.value = 'edit'
}

function editRowDisabled(row: ModuleRow) {
  return (section.value === 'airport-routes' && row.status === '启用')
    || (section.value === 'campaigns' && row.status !== '下架')
}

function editRowTitle(row: ModuleRow) {
  if (section.value === 'airport-routes' && row.status === '启用') return '请先禁用路线后再编辑价格配置'
  if (section.value === 'campaigns' && row.status !== '下架') return '已上架活动不支持编辑，请先下架'
  return '编辑记录'
}

function openDriverMarkEditor(row: ModuleRow) {
  driverMarkTarget.value = row
  driverMarkDraft.acceptingTypes = String(row.acceptingType ?? '').split('、').filter(Boolean)
  driverMarkDraft.compliance = String(row.compliance ?? '') as '合规' | '非合规' | ''
  const currentVehicleType = String(row.vehicleType ?? '')
  driverMarkDraft.vehicleType = enabledDriverVehicleTypes.value.includes(currentVehicleType) ? currentVehicleType : ''
}

function closeDriverMarkEditor() {
  driverMarkTarget.value = null
}

function toggleDriverAcceptingType(type: string) {
  const index = driverMarkDraft.acceptingTypes.indexOf(type)
  if (index >= 0) driverMarkDraft.acceptingTypes.splice(index, 1)
  else driverMarkDraft.acceptingTypes.push(type)
}

function selectDriverCompliance(type: '合规' | '非合规') {
  driverMarkDraft.compliance = type
}

function saveDriverMark() {
  if (!driverMarkTarget.value) return
  if (!driverMarkDraft.acceptingTypes.length) {
    appStore.notify('服务类型校验未通过', '接送机与包车至少选择一项。', 'danger')
    return
  }
  if (!driverMarkDraft.compliance || !driverMarkDraft.vehicleType) return
  const index = rows.value.findIndex((row) => row.id === driverMarkTarget.value?.id)
  if (index < 0) return
  const current = rows.value[index]
  if (!current) return
  const before = {
    acceptingType: String(current.acceptingType ?? '—'),
    compliance: String(current.compliance ?? '—'),
    vehicleType: String(current.vehicleType ?? '—'),
  }
  const after = {
    acceptingType: driverMarkDraft.acceptingTypes.join('、'),
    compliance: driverMarkDraft.compliance,
    vehicleType: driverMarkDraft.vehicleType,
  }
  rows.value[index] = { ...current, ...after }
  if (config.value) config.value.rows = rows.value.map((row) => ({ ...row }))
  appStore.notify(
    '司机标记已保存',
    `服务类型 ${before.acceptingType} → ${after.acceptingType}；合规类型 ${before.compliance} → ${after.compliance}；服务车型 ${before.vehicleType} → ${after.vehicleType}。车型仅对新订单生效，操作日志已记录。`,
    'success',
  )
  closeDriverMarkEditor()
}

function saveRow() {
  const values = Object.fromEntries(draftColumns.value.map((column) => {
    const draftValue = editDraft[column.key] ?? ''
    return [column.key, column.kind === 'currency' ? Number(draftValue) : draftValue]
  }))
  if (section.value === 'vehicle-types') {
    const image = String(editDraft.image ?? '').trim()
    const name = String(editDraft.name ?? '').trim()
    const description = String(editDraft.description ?? '').trim()
    const grade = String(editDraft.grade ?? '').trim()
    const seats = Number(editDraft.seats)
    const largeLuggage = Number(editDraft.largeLuggageCapacity)
    const smallLuggage = Number(editDraft.smallLuggageCapacity)
    if (!image || !name || !description || !grade) {
      appStore.notify('车型校验未通过', '车型图片、车型名称、车型描述和车型等级均为必填项。', 'danger')
      return
    }
    if (!vehicleGradeOptions.includes(grade)) {
      appStore.notify('车型等级校验未通过', '车型等级仅支持经济型、舒适型或豪华型。', 'danger')
      return
    }
    const duplicated = rows.value.some((row) => row.id !== editTarget.value?.id && String(row.name).trim().toLowerCase() === name.toLowerCase())
    if (duplicated) {
      appStore.notify('车型名称已存在', '车型名称必须唯一，请修改后再保存。', 'danger')
      return
    }
    if (!Number.isInteger(seats) || seats < 2 || seats > 20) {
      appStore.notify('座位数校验未通过', '座位数必须是 2–20 之间的整数，并包含司机位。', 'danger')
      return
    }
    if (![largeLuggage, smallLuggage].every((value) => Number.isInteger(value) && value >= 0 && value <= 30)) {
      appStore.notify('行李容量校验未通过', '大、小行李容量必须是 0–30 之间的整数。', 'danger')
      return
    }
    Object.assign(values, {
      image,
      name,
      description,
      grade,
      seats,
      passengerCapacity: seats - 1,
      largeLuggageCapacity: largeLuggage,
      smallLuggageCapacity: smallLuggage,
      updatedAt: new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replaceAll('/', '-'),
    })
  }
  if (section.value === 'charter-routes') {
    const requiredFields: Array<[string, string]> = [
      ['name', '路线名称'],
      ['intro', '路线介绍'],
      ['description', '路线描述'],
      ['phone', '联系电话'],
    ]
    const missingField = requiredFields.find(([key]) => !String(editDraft[key] ?? '').trim())
    if (missingField) {
      appStore.notify('包车路线校验未通过', `${missingField[1]}为必填项，请补充后再保存。`, 'danger')
      return
    }
    // `input[type=number]` 的 v-model 在运行时可能返回 number，先统一转成字符串再校验。
    const amountDraft = String(editDraft.referenceAmount ?? '').trim()
    const amount = Number(amountDraft)
    if (!amountDraft || !Number.isFinite(amount) || amount <= 0) {
      appStore.notify('参考金额校验未通过', '参考金额必须大于 £0，请输入有效的 GBP 金额。该金额仅用于展示，但不能为 0 或负数。', 'danger')
      return
    }
    const sortDraft = String(editDraft.sort ?? '').trim()
    const sort = Number(sortDraft)
    if (!sortDraft || !Number.isInteger(sort) || sort < 0) {
      appStore.notify('排序校验未通过', '排序必须是大于或等于 0 的整数。', 'danger')
      return
    }
    Object.assign(values, { referenceAmount: amount, sort })
  }
  if (section.value === 'geofences') {
    const vertexCount = Number(values.vertexCount)
    if (!Number.isInteger(vertexCount) || vertexCount < 3) {
      appStore.notify('围栏校验未通过', '每个围栏至少需要 3 个顶点，请补全多边形后再保存。', 'danger')
      return
    }
  }
  if (editMode.value === 'edit' && editTarget.value) {
    const index = rows.value.findIndex((row) => row.id === editTarget.value?.id)
    if (index >= 0) {
      const id = editDraft.id?.trim() || editTarget.value.id
      const status = String(values.status || rows.value[index]?.status || '') || undefined
      rows.value[index] = { ...rows.value[index], ...values, id, status }
      selectedRow.value = rows.value[index] ?? null
    }
    appStore.notify('修改已保存', `${pageMeta.value.title}记录已更新。`, 'success')
  } else {
    const generatedId = section.value === 'vehicle-types'
      ? `VT-${String(rows.value.length + 1).padStart(3, '0')}`
      : `${section.value.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-6)}`
    const id = editDraft.id?.trim() || generatedId
    rows.value.unshift({ ...values, id, routeCount: section.value === 'vehicle-types' ? 0 : values.routeCount, status: String(values.status || '启用') })
    appStore.notify('记录已创建', `新${pageMeta.value.title}记录已加入列表。`, 'success')
  }
  if (section.value === 'geofences') {
    const relation = String(values.geometryRelation ?? '')
    if (relation.includes('包含')) {
      appStore.notify('围栏已保存 · 包含关系提示', '检测到完全包含关系；位置同时命中时，小围栏优先。', 'info')
    } else if (relation.includes('交叠')) {
      appStore.notify('围栏已保存 · 交叠警示', '检测到部分交叠，已允许保存；请确认边界位置的业务匹配结果。', 'warning')
    }
  }
  if (config.value) config.value.rows = rows.value.map((row) => ({ ...row }))
  if (section.value === 'charter-routes') {
    rows.value.sort((left, right) => Number(left.sort ?? 0) - Number(right.sort ?? 0))
    if (config.value) config.value.rows = rows.value.map((row) => ({ ...row }))
  }
  closeEditor()
}

function requestDelete(row: ModuleRow) {
  if (!['charter-routes', 'vehicle-types', 'geofences', 'coupons', 'campaigns', 'value-added-services', 'banners', 'notices', 'carpool-copy'].includes(section.value)) return
  if (section.value === 'campaigns' && row.status !== '下架') {
    appStore.notify('活动不可删除', '仅下架状态的活动可以删除。', 'warning')
    return
  }
  if (section.value === 'value-added-services' && row.businessLinked === true) {
    appStore.notify('服务不可删除', '儿童座椅已与下单业务关联，可编辑或禁用，但不能删除。', 'warning')
    return
  }
  deleteTarget.value = row
}

function confirmDelete() {
  if (!['charter-routes', 'vehicle-types', 'geofences', 'coupons', 'campaigns', 'value-added-services', 'banners', 'notices', 'carpool-copy'].includes(section.value) || !deleteTarget.value) return
  if (section.value === 'vehicle-types' && (vehicleDeleteUsage.value.routes > 0 || vehicleDeleteUsage.value.drivers > 0)) return
  if (section.value === 'geofences' && Number(deleteTarget.value.routeCount ?? 0) > 0) return
  if (section.value === 'coupons' && Number(deleteTarget.value.issuedQuantity ?? 0) > 0) return
  if (section.value === 'campaigns' && deleteTarget.value.status !== '下架') return
  if (section.value === 'value-added-services' && deleteTarget.value.businessLinked === true) return
  const deletedRow = deleteTarget.value
  rows.value = rows.value.filter((row) => row.id !== deletedRow.id)
  if (config.value) config.value.rows = rows.value.map((row) => ({ ...row }))
  if (selectedRow.value?.id === deletedRow.id) selectedRow.value = null
  deleteTarget.value = null
  const deletedLabel = section.value === 'vehicle-types'
    ? '车型已删除'
    : section.value === 'geofences'
      ? '围栏已删除'
      : section.value === 'coupons'
        ? '优惠券已删除'
        : section.value === 'campaigns'
          ? '活动已删除'
          : section.value === 'value-added-services'
            ? '增值服务已删除'
            : section.value === 'banners'
              ? 'Banner 已删除'
              : section.value === 'notices'
                ? '公告已删除'
                : section.value === 'carpool-copy'
                  ? '默认语已删除'
                  : '包车路线已删除'
  appStore.notify(deletedLabel, `${deletedRow.id} · ${String(deletedRow.name ?? deletedRow.title ?? deletedRow.node ?? '')} 已从当前列表中移除。`, 'success')
}

function formatReferencePrice(value: unknown) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '—'
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount)
}

function saveRoute(row: ModuleRow, warnings: string[]) {
  const existingIndex = rows.value.findIndex((item) => item.id === (editTarget.value?.id ?? row.id))
  if (existingIndex >= 0) {
    rows.value[existingIndex] = row
    selectedRow.value = row
  } else {
    rows.value.unshift(row)
  }
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  closeEditor()
  if (warnings.length) appStore.notify('路线已保存 · 请复核定金', warnings.join('；'), 'warning')
  else appStore.notify(existingIndex >= 0 ? '路线配置已更新' : '路线配置已创建', `${row.name ?? row.id} 已写入当前原型列表。`, 'success')
}

function saveCoupon(row: ModuleRow) {
  const existingIndex = rows.value.findIndex((item) => item.id === (editTarget.value?.id ?? row.id))
  if (existingIndex >= 0) {
    rows.value[existingIndex] = row
    selectedRow.value = row
  } else {
    rows.value.unshift(row)
  }
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  closeEditor()
  appStore.notify(existingIndex >= 0 ? '优惠券已更新' : '优惠券已创建', `${row.id} · ${String(row.name ?? '')} 已保存。`, 'success')
}

function saveCampaign(row: ModuleRow) {
  const existingIndex = rows.value.findIndex((item) => item.id === (editTarget.value?.id ?? row.id))
  if (existingIndex >= 0) {
    if (rows.value[existingIndex]?.status !== '下架') {
      appStore.notify('活动不可编辑', '该活动当前已上架，不能保存修改。', 'danger')
      return
    }
    rows.value[existingIndex] = row
    selectedRow.value = row
  } else {
    rows.value.unshift({ ...row, status: '下架' })
  }
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  closeEditor()
  appStore.notify(
    existingIndex >= 0 ? '活动已更新' : '活动已创建',
    existingIndex >= 0 ? `${row.id} · ${String(row.name ?? '')} 已保存。` : `${row.id} · ${String(row.name ?? '')} 已创建并保持下架，确认配置后可执行上架。`,
    'success',
  )
}

function saveValueAddedService(row: ModuleRow) {
  const existingIndex = rows.value.findIndex((item) => item.id === (editTarget.value?.id ?? row.id))
  if (existingIndex >= 0) {
    rows.value[existingIndex] = row
    selectedRow.value = row
  } else {
    rows.value.push({ ...row, businessLinked: false, serviceMode: '线下服务', status: '启用' })
  }
  rows.value.sort((left, right) => Number(left.sort ?? 0) - Number(right.sort ?? 0))
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  closeEditor()
  appStore.notify(
    existingIndex >= 0 ? '增值服务已更新' : '增值服务已创建',
    `${row.id} · ${String(row.name ?? '')} 已保存，排序 ${String(row.sort ?? '—')}。`,
    'success',
  )
}

function saveBanner(row: ModuleRow) {
  const existingIndex = rows.value.findIndex((item) => item.id === (editTarget.value?.id ?? row.id))
  if (existingIndex >= 0) {
    rows.value[existingIndex] = row
    selectedRow.value = row
  } else {
    rows.value.push({ ...row, status: '禁用' })
  }
  rows.value.sort((left, right) => Number(left.sort ?? 0) - Number(right.sort ?? 0))
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  closeEditor()
  appStore.notify(
    existingIndex >= 0 ? 'Banner 已更新' : 'Banner 已创建',
    existingIndex >= 0 ? `${row.id} · ${String(row.name ?? '')} 已保存。` : `${row.id} · ${String(row.name ?? '')} 已创建并保持禁用，可在列表中启用。`,
    'success',
  )
}

function saveNotice(row: ModuleRow) {
  const existingIndex = rows.value.findIndex((item) => item.id === (editTarget.value?.id ?? row.id))
  if (existingIndex >= 0) {
    rows.value[existingIndex] = row
    selectedRow.value = row
  } else {
    rows.value.push({ ...row, status: '禁用' })
  }
  rows.value.sort((left, right) => Number(left.sort ?? 0) - Number(right.sort ?? 0))
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  closeEditor()
  appStore.notify(
    existingIndex >= 0 ? '公告已更新' : '公告已创建',
    existingIndex >= 0 ? `${row.id} · ${String(row.title ?? '')} 已保存。` : `${row.id} · ${String(row.title ?? '')} 已创建并保持禁用，可在列表中启用。`,
    'success',
  )
}

function saveCarpoolCopy(row: ModuleRow) {
  const existingIndex = rows.value.findIndex((item) => item.id === (editTarget.value?.id ?? row.id))
  if (existingIndex >= 0) rows.value[existingIndex] = row
  else rows.value.push({ ...row, status: '禁用' })
  rows.value.sort((left, right) => {
    const scope = `${String(left.endpoint)}-${String(left.node)}`.localeCompare(`${String(right.endpoint)}-${String(right.node)}`, 'zh-CN')
    return scope || Number(left.sort ?? 0) - Number(right.sort ?? 0)
  })
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  closeEditor()
  appStore.notify(existingIndex >= 0 ? '默认语已更新' : '默认语已创建', existingIndex >= 0 ? `${row.id} 的模板内容已保存。` : `${row.id} 已创建并保持禁用，可在列表中启用。`, 'success')
}

function saveSystemMessage(row: ModuleRow) {
  const existingIndex = rows.value.findIndex((item) => item.id === row.id)
  if (existingIndex < 0) return
  rows.value[existingIndex] = row
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  selectedRow.value = row
  closeEditor()
  appStore.notify('系统消息已更新', `${row.id} · ${String(row.node ?? '')} 的文案已保存。`, 'success')
}

function completeCouponGrant(payload: { couponId: string; userIds: string[]; quantity: number }) {
  const couponIndex = rows.value.findIndex((row) => row.id === payload.couponId)
  const coupon = rows.value[couponIndex]
  if (!coupon || coupon.status !== '启用') {
    appStore.notify('发放失败', '该优惠券不存在或已禁用，请重新选择。', 'danger')
    return
  }
  const totalGrant = payload.userIds.length * payload.quantity
  const totalQuantity = Number(coupon.totalQuantity ?? 0)
  const issuedQuantity = Number(coupon.issuedQuantity ?? 0)
  const remaining = Math.max(0, totalQuantity - issuedQuantity)
  if (!payload.userIds.length || !Number.isInteger(payload.quantity) || payload.quantity < 1 || totalGrant > remaining) {
    appStore.notify('发放校验未通过', `本次需要发放 ${totalGrant} 张，当前最多可发 ${remaining} 张。`, 'danger')
    return
  }

  const updatedIssued = issuedQuantity + totalGrant
  const redeemedQuantity = Number(coupon.redeemedQuantity ?? 0)
  rows.value[couponIndex] = {
    ...coupon,
    issuedQuantity: updatedIssued,
    redemption: `${redeemedQuantity.toLocaleString('en-GB')} / ${updatedIssued.toLocaleString('en-GB')}`,
  }
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))

  const recordConfig = moduleCatalog['coupon-grants']
  if (recordConfig) {
    const now = new Date()
    const timestamp = now.getTime()
    const grantedDate = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now)
    const grantedAt = new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(now).replaceAll('/', '-')
    const users = couponUsers.value.filter((user) => payload.userIds.includes(user.id))
    const newRecords: ModuleRow[] = []
    users.forEach((user, userIndex) => {
      for (let copyIndex = 0; copyIndex < payload.quantity; copyIndex += 1) {
        const serial = String(userIndex * payload.quantity + copyIndex + 1).padStart(3, '0')
        newRecords.push({
          id: `GR-${timestamp}-${serial}`,
          code: `C${String(timestamp).slice(-10)}${serial}`,
          couponId: coupon.id,
          couponName: coupon.name ?? coupon.id,
          couponType: coupon.couponType ?? '—',
          content: coupon.content ?? '—',
          service: coupon.service ?? '—',
          validFrom: coupon.validFrom ?? '',
          validTo: coupon.validTo ?? '',
          validity: coupon.validity ?? '—',
          holder: `${user.id} · ${String(user.name ?? '—')}`,
          phone: user.phone ?? '—',
          source: '系统',
          grantedDate,
          grantedAt,
          orderId: '—',
          status: '未核销',
        })
      }
    })
    recordConfig.rows = [...newRecords, ...(recordConfig.rows ?? [])]
  }

  couponGrantOpen.value = false
  appStore.notify('定向发放成功', `已向 ${payload.userIds.length} 名用户发放 ${totalGrant} 张「${String(coupon.name ?? coupon.id)}」，推送通知已发送。`, 'success')
}

function saveGeofence(row: ModuleRow, warnings: Array<{ type: 'contains' | 'overlap'; name: string }>) {
  const nextRow: ModuleRow = { ...row, id: row.id || `GF-${Date.now().toString().slice(-6)}` }
  const existingIndex = rows.value.findIndex((item) => item.id === nextRow.id)
  if (existingIndex >= 0) {
    rows.value[existingIndex] = nextRow
    selectedRow.value = nextRow
    appStore.notify('围栏修改已保存', `${String(nextRow.name)}的边界已更新，仅影响新订单的路线匹配。`, 'success')
  } else {
    rows.value.unshift(nextRow)
    appStore.notify('围栏已创建', `${String(nextRow.name)}已加入围栏列表，默认状态为启用。`, 'success')
  }
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  const overlapNames = warnings.filter((warning) => warning.type === 'overlap').map((warning) => warning.name)
  const containedNames = warnings.filter((warning) => warning.type === 'contains').map((warning) => warning.name)
  if (overlapNames.length) {
    appStore.notify('围栏部分交叠警示', `与「${overlapNames.join('、')}」存在部分交叠，已允许保存；建议核对边界。`, 'warning')
  } else if (containedNames.length) {
    appStore.notify('围栏包含关系提示', `与「${containedNames.join('、')}」存在包含关系；下单匹配时以更小围栏优先。`, 'info')
  }
  closeEditor()
}

function geofencePolygonPoints(row: ModuleRow | null) {
  if (!row || !Array.isArray(row.polygon)) return ''
  return row.polygon.map((point) => `${Number(point.x)},${Number(point.y)}`).join(' ')
}

function rowActionLabel(row: ModuleRow) {
  const action = config.value?.rowAction
  if (!action) return ''
  if (section.value === 'campaigns') return row.status === '下架' ? '上架' : '下架'
  if (section.value === 'banners' || section.value === 'notices') return row.status === '启用' || row.status === '待生效' ? '转为禁用' : '转为启用'
  if (section.value === 'feedback') {
    const flow = ['待处理', '已接收', '处理中', '已完结']
    const next = flow[flow.indexOf(String(row.status)) + 1]
    return next ? `标记${next}` : '已完结'
  }
  if (action.mode === 'toggle') {
    if (section.value === 'drivers' || isFleetMonitoring.value) {
      return row.status === action.activeStatus ? '冻结接单' : '解冻接单'
    }
    return row.status === action.activeStatus ? `转为${action.inactiveStatus}` : `转为${action.activeStatus}`
  }
  if (action.mode === 'advance' && row.status === action.nextStatus) return action.completedLabel ?? '已处理'
  return action.label
}

function rowActionDisabled(row: ModuleRow) {
  const action = config.value?.rowAction
  if (section.value === 'feedback') return row.status === '已完结'
  return action?.mode === 'advance' && row.status === action.nextStatus
}

function toggleDriverPool(row: ModuleRow) {
  if (section.value !== 'drivers' && !isFleetMonitoring.value) return
  const nextState = String(row.poolState ?? '开启') === '开启' ? '关闭' : '开启'
  row.poolState = nextState
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  appStore.notify(
    nextState === '开启' ? '订单池已开启' : '订单池已关闭',
    nextState === '开启' ? `${row.name ?? row.id} 可继续接收司机抢单。` : `${row.name ?? row.id} 将不再接收新的抢单，已接订单不受影响。`,
    nextState === '开启' ? 'success' : 'warning',
  )
}

function toggleRoutePopular(row: ModuleRow) {
  if (section.value !== 'airport-routes') return
  const nextState = row.popular === '热门' ? '非热门' : '热门'
  row.popular = nextState
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  appStore.notify(
    nextState === '热门' ? '已标记热门路线' : '已取消热门路线',
    `${row.id} · ${String(row.name ?? '')} 已更新热门标记。`,
    nextState === '热门' ? 'success' : 'info',
  )
}

function openExceptionRefund(row: ModuleRow) {
  if (row.status === '已处理') return
  exceptionRefundTarget.value = row
}

function advanceSelectedFeedback() {
  if (!selectedRow.value) return
  performRowAction(selectedRow.value)
}

function refundSelectedException(row: ModuleRow) {
  selectedRow.value = null
  openExceptionRefund(row)
}

function cancelSelectedException(row: ModuleRow) {
  selectedRow.value = null
  exceptionCancelTarget.value = row
}

function completeExceptionRefund(payload: { amount: number; reason: string; note: string }) {
  const target = exceptionRefundTarget.value
  if (!target) return
  const row = rows.value.find((item) => item.id === target.id && item.passenger === target.passenger)
  if (!row) return
  row.status = '已处理'
  row.resolution = '人工退款'
  row.refundAmount = payload.amount
  row.refundReason = payload.reason
  row.refundNote = payload.note
  row.handledAt = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date()).replaceAll('/', '-')
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  exceptionRefundTarget.value = null
  appStore.notify('人工退款已提交', `${row.id} · ${String(row.passenger)} 已退款 ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(payload.amount)}，乘客通知已推送；司机原分账不受影响。`, 'success')
}

function confirmExceptionCancel() {
  const target = exceptionCancelTarget.value
  if (!target) return
  const row = rows.value.find((item) => item.id === target.id && item.passenger === target.passenger)
  if (!row) return
  row.status = '已处理'
  row.resolution = '取消退款'
  row.refundAmount = 0
  row.handledAt = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date()).replaceAll('/', '-')
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  exceptionCancelTarget.value = null
  appStore.notify('已取消退款', `${row.id} · ${String(row.passenger)} 不获得退款，订单将按履约阶段执行后续分账。`, 'warning')
}

function performRowAction(row: ModuleRow) {
  const action = config.value?.rowAction
  if (!action) return
  if (section.value === 'driver-statements') {
    selectedRow.value = row
    return
  }
  const actionLabel = rowActionLabel(row)
  if (section.value === 'campaigns') {
    if (row.status === '下架') {
      const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
      const validFrom = String(row.validFrom ?? '')
      const validTo = String(row.validTo ?? '')
      row.status = validFrom && today < validFrom ? '待开始' : validTo && today > validTo ? '已结束' : '进行中'
      appStore.notify('活动已上架', `${row.id} · ${String(row.name ?? '')} 当前状态为“${row.status}”，状态将随有效期自动更新。`, 'success')
    } else {
      row.status = '下架'
      appStore.notify('活动已下架', `${row.id} · ${String(row.name ?? '')} 已停止触发发券，现在可以编辑或删除。`, 'warning')
    }
    if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
    return
  }
  if (section.value === 'banners') {
    if (row.status === '启用' || row.status === '待生效') {
      row.status = '禁用'
      appStore.notify('Banner 已禁用', `${row.id} · ${String(row.name ?? '')} 已停止投放。`, 'warning')
    } else {
      const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
      row.status = String(row.validFrom ?? '') > today ? '待生效' : '启用'
      appStore.notify('Banner 已启用', `${row.id} · ${String(row.name ?? '')} 当前状态为“${row.status}”。`, 'success')
    }
    if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
    return
  }
  if (section.value === 'notices') {
    if (row.status === '启用' || row.status === '待生效') {
      row.status = '禁用'
      appStore.notify('公告已禁用', `${row.id} · ${String(row.title ?? '')} 已停止展示。`, 'warning')
    } else {
      const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
      row.status = String(row.validFrom ?? '') > today ? '待生效' : '启用'
      appStore.notify('公告已启用', `${row.id} · ${String(row.title ?? '')} 当前状态为“${row.status}”。`, 'success')
    }
    if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
    return
  }
  if (section.value === 'system-messages') {
    const disabling = row.status === action.activeStatus
    row.status = disabling ? action.inactiveStatus : action.activeStatus
    if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
    const isRiskNode = ['支付', '退款', '结算', '认证'].includes(String(row.group ?? ''))
    appStore.notify(
      disabling && isRiskNode ? '重要系统消息已禁用' : disabling ? '系统消息已禁用' : '系统消息已启用',
      `${row.id} · ${String(row.node ?? '')} ${disabling ? '已停止触发' : '已恢复触发'}，本次操作已写入操作日志。`,
      disabling ? 'warning' : 'success',
    )
    return
  }
  if (section.value === 'feedback') {
    const flow = ['待处理', '已接收', '处理中', '已完结']
    const next = flow[flow.indexOf(String(row.status)) + 1]
    if (!next) return
    row.status = next
    if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
    appStore.notify(
      next === '已完结' ? '反馈已完结' : `反馈已标记${next}`,
      next === '已完结'
        ? `${row.id} 已归档，并已向${String(row.identity)}端推送“意见反馈已处理”系统消息。`
        : `${row.id} 的处理状态已更新为“${next}”。`,
      next === '已完结' ? 'success' : 'info',
    )
    return
  } else if (action.mode === 'toggle') {
    row.status = row.status === action.activeStatus ? action.inactiveStatus : action.activeStatus
  } else if (action.mode === 'advance' && action.nextStatus) {
    row.status = action.nextStatus
  }
  if (config.value) config.value.rows = rows.value.map((item) => ({ ...item }))
  appStore.notify('操作已完成', `${row.id} 已执行“${actionLabel}”。`, action.tone === 'danger' ? 'warning' : 'success')
}

function updateSetting(field: ModuleSettingField, event: Event) {
  const target = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  settingsDraft[field.key] = target.value
}

function toggleSetting(field: ModuleSettingField) {
  settingsDraft[field.key] = !Boolean(settingsDraft[field.key])
}

function resetSettings() {
  Object.entries(settingsBaseline.value).forEach(([key, value]) => {
    settingsDraft[key] = value
  })
  appStore.notify('未保存修改已撤销', `${pageMeta.value.title}已恢复到最近保存版本。`, 'info')
}

function runtimeSettingValue(field: ModuleSettingField): string | boolean {
  const values: Record<string, string | number> = {
    bookingHorizon: businessConfig.bookingHorizonDays,
    carpoolCutoff: businessConfig.carpoolCutoffHours,
    exclusiveCutoff: businessConfig.exclusiveCutoffHours,
    exceptionReportTime: businessConfig.exceptionReportMinutes,
    acceptanceTolerance: businessConfig.acceptanceToleranceMinutes,
    autoGroupPassengers: businessConfig.autoGroupPassengers,
    autoGroupLuggage: businessConfig.autoGroupLuggage,
    minimumGroupPassengers: businessConfig.minimumGroupPassengers,
    autoGroupCutoff: businessConfig.autoGroupCutoffHours,
    departureMatchWindow: businessConfig.departureMatchWindowMinutes,
    transferDelay: businessConfig.transferDelayMinutes,
    payoutCycle: businessConfig.payoutCycle,
    minimumPayout: businessConfig.minimumPayoutPounds,
    payoutFee: businessConfig.payoutFeePounds,
  }
  const value = values[field.key]
  return value === undefined ? field.value : String(value)
}

function syncBusinessConfig() {
  const numberValue = (key: string) => Number(settingsDraft[key])
  const updateMetric = (label: string, value: string) => {
    const metric = config.value?.metrics.find((item) => item.label === label)
    if (metric) metric.value = value
  }
  if (section.value === 'order-config') {
    businessConfig.bookingHorizonDays = numberValue('bookingHorizon')
    businessConfig.carpoolCutoffHours = numberValue('carpoolCutoff')
    businessConfig.exclusiveCutoffHours = numberValue('exclusiveCutoff')
    businessConfig.exceptionReportMinutes = numberValue('exceptionReportTime')
    businessConfig.acceptanceToleranceMinutes = numberValue('acceptanceTolerance')
    updateMetric('最远预订', `${businessConfig.bookingHorizonDays} 天`)
    updateMetric('拼车截止', `${businessConfig.carpoolCutoffHours} 小时`)
    updateMetric('独享截止', `${businessConfig.exclusiveCutoffHours} 小时`)
    updateMetric('冲突缓冲', `前后 ${businessConfig.acceptanceToleranceMinutes} 分钟`)
  } else if (section.value === 'carpool-config') {
    businessConfig.autoGroupPassengers = numberValue('autoGroupPassengers')
    businessConfig.autoGroupLuggage = numberValue('autoGroupLuggage')
    businessConfig.minimumGroupPassengers = numberValue('minimumGroupPassengers')
    businessConfig.autoGroupCutoffHours = numberValue('autoGroupCutoff')
    businessConfig.departureMatchWindowMinutes = numberValue('departureMatchWindow')
    updateMetric('自动截团', `${businessConfig.autoGroupPassengers} 人`)
    updateMetric('行李截团', `${businessConfig.autoGroupLuggage} 件`)
    updateMetric('保底成团', `${businessConfig.minimumGroupPassengers} 人`)
    updateMetric('匹配窗口', `${businessConfig.departureMatchWindowMinutes} 分钟`)
  } else if (section.value === 'payment-config') {
    businessConfig.transferDelayMinutes = numberValue('transferDelay')
    businessConfig.payoutCycle = String(settingsDraft.payoutCycle ?? businessConfig.payoutCycle)
    businessConfig.minimumPayoutPounds = numberValue('minimumPayout')
    businessConfig.payoutFeePounds = numberValue('payoutFee')
    updateMetric('延迟分账', `${businessConfig.transferDelayMinutes} 分钟`)
    updateMetric('最低提现', `£${businessConfig.minimumPayoutPounds.toFixed(2)}`)
    updateMetric('单笔手续费', `£${businessConfig.payoutFeePounds.toFixed(2)}`)
  }
}

function settingsValueLabel(field: ModuleSettingField, value: string | boolean | undefined) {
  if (typeof value === 'boolean') return value ? '开启' : '关闭'
  if (field.unit === '£') {
    const amount = Number(value)
    return Number.isFinite(amount) ? `£${amount.toFixed(2)}` : String(value ?? '—')
  }
  return `${String(value ?? '—')}${field.unit ? ` ${field.unit}` : ''}`
}

function settingsEffectiveScope(key: string) {
  const scopes: Record<string, string> = {
    bookingHorizon: '新下单', carpoolCutoff: '新下单', exclusiveCutoff: '新下单',
    exceptionReportTime: '全部进行中订单', acceptanceTolerance: '后续接单校验',
    autoGroupPassengers: '新拼车团', autoGroupLuggage: '新拼车团', minimumGroupPassengers: '新拼车团',
    autoGroupCutoff: '新拼车团', departureMatchWindow: '后续撮合',
    transferDelay: '新建分账任务', payoutCycle: '下一提现周期', minimumPayout: '新提现申请', payoutFee: '新提现申请',
  }
  return scopes[key] ?? '按配置说明生效'
}

function saveSettings() {
  const changedFields = (config.value?.settings ?? [])
    .flatMap((settingSection) => settingSection.fields)
    .filter((field) => settingsBaseline.value[field.key] !== settingsDraft[field.key])
  const savedAt = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date()).replaceAll('/', '-')

  syncBusinessConfig()
  if (changedFields.length) {
    const history = settingsHistoryBySection[section.value] ?? []
    settingsHistoryBySection[section.value] = history
    const timestampId = Date.now().toString().slice(-8)
    history.unshift(...changedFields.map((field, index) => ({
      id: `CFG-${timestampId}-${String(index + 1).padStart(2, '0')}`,
      operatedAt: savedAt,
      operator: '超级管理员 · Ava',
      item: field.label,
      before: settingsValueLabel(field, settingsBaseline.value[field.key]),
      after: settingsValueLabel(field, settingsDraft[field.key]),
      scope: settingsEffectiveScope(field.key),
      ip: '81.2.69.142',
    })))
  }
  settingsBaseline.value = { ...settingsDraft }
  lastSavedAt.value = savedAt
  savedAtBySection[section.value] = lastSavedAt.value
  confirmSettingsSave.value = false
  appStore.notify('配置已保存', `${pageMeta.value.title}将在约定范围内生效，变更已写入操作日志。`, 'success')
}
</script>

<template>
  <div v-if="config" class="module-page">
    <header class="page-header">
      <div>
        <div class="page-header__eyebrow">{{ config.eyebrow }}</div>
        <h1>{{ pageMeta.title }}</h1>
        <p v-if="config.showDescription !== false" class="page-header__description">{{ config.description }}</p>
      </div>
      <div v-if="isFinanceModule || config.showSecondaryAction !== false || config.primaryAction" class="page-header__actions">
        <div v-if="isFinanceModule" class="settlement-stat-filter">
          <div class="settlement-stat-filter__periods">
            <button v-for="period in settlementStatsPeriods" :key="period" type="button" :class="{ 'is-active': settlementStatsPeriod === period }" @click="selectSettlementStatsPeriod(period)">{{ period }}</button>
          </div>
          <div v-if="settlementStatsPeriod === '自定义'" class="settlement-stat-filter__range">
            <input v-model="settlementStatsFrom" type="date" aria-label="统计开始日期" />
            <i>至</i>
            <input v-model="settlementStatsTo" type="date" aria-label="统计结束日期" />
            <button type="button" @click="applySettlementStatsRange">应用</button>
          </div>
        </div>
        <button v-if="config.showSecondaryAction !== false" class="btn" :class="config.kind === 'dashboard' ? 'btn--refresh' : 'btn--secondary'" type="button" @click="handleSecondaryAction">
          <Plus v-if="config.kind === 'settings' && config.secondaryAction?.includes('新增')" :size="15" />
          <Eye v-else-if="config.kind === 'settings' || section === 'charter-routes'" :size="15" />
          <RefreshCw v-else-if="config.kind === 'dashboard'" :size="15" />
          <Download v-else :size="15" />
          {{ config.secondaryAction ?? (config.kind === 'settings' ? '撤销修改' : config.kind === 'dashboard' ? '立即刷新' : '导出数据') }}
        </button>
        <button v-if="config.primaryAction" class="btn btn--brand" type="button" :disabled="config.kind === 'settings' && !settingsDirty" @click="handlePrimaryAction">
          <Save v-if="config.kind === 'settings'" :size="15" />
          <RefreshCw v-else-if="config.kind === 'dashboard'" :size="15" />
          <Plus v-else :size="15" />
          {{ config.primaryAction }}
        </button>
      </div>
    </header>

    <section
      v-if="config.showOverview !== false"
      class="module-overview dark-panel stats-banner stats-banner--dark"
      :class="[
        { 'module-overview--fleet': isFleetMonitoring },
        { 'module-overview--without-insight': config.showInsight === false },
      ]"
    >
      <div v-if="config.showInsight !== false" class="module-overview__insight">
        <span><Sparkles :size="12" />{{ config.insight.label }}</span>
        <h2>{{ config.insight.title }}</h2>
        <p>{{ config.insight.description }}</p>
        <small v-if="config.kind === 'dashboard'">最后刷新：{{ lastRefreshAt }}</small>
      </div>
      <div v-if="isFleetMonitoring" class="fleet-metric-groups">
        <section v-for="group in fleetMetricGroups" :key="group.key" class="fleet-metric-group">
          <span class="fleet-metric-group__title">{{ group.label }}</span>
          <div class="fleet-metric-group__items">
            <button
              v-for="metric in group.metrics"
              :key="metric.label"
              type="button"
              class="module-metric"
              :class="[`module-metric--${metric.tone ?? 'default'}`, { 'is-clickable': metric.filter }]"
              :disabled="!metric.filter"
              @click="applyMetricFilter(metric)"
            >
              <span>{{ metric.label }}</span><strong>{{ metric.value }}</strong><small>{{ metric.note }}</small>
            </button>
          </div>
        </section>
      </div>
      <div v-else class="module-metrics">
        <button
          v-for="metric in overviewMetrics"
          :key="metric.label"
          type="button"
          class="module-metric"
          :class="[`module-metric--${metric.tone ?? 'default'}`, { 'is-clickable': metric.filter }]"
          :disabled="!metric.filter"
          @click="applyMetricFilter(metric)"
        >
          <span>{{ metric.label }}</span><strong>{{ metric.value }}</strong><small>{{ metric.note }}</small>
        </button>
      </div>
    </section>

    <template v-if="config.kind === 'dashboard' && config.trendPanel">
      <section class="dashboard-grid">
        <article class="surface-panel trend-panel">
          <header class="panel-heading">
            <div><span>LIVE CAPACITY</span><h3>{{ config.trendPanel.title }}</h3></div>
            <small>{{ config.trendPanel.caption }}</small>
          </header>
          <div class="trend-chart">
            <div v-for="(value, index) in config.trendPanel.values" :key="config.trendPanel.labels[index]" class="trend-chart__item">
              <span>{{ value }}{{ config.trendPanel.unit }}</span>
              <div><i :style="{ height: `${Math.max(8, value / maxTrendValue * 100)}%` }"></i></div>
              <small>{{ config.trendPanel.labels[index] }}</small>
            </div>
          </div>
        </article>
        <aside class="capacity-breakdown">
          <article v-for="item in config.trendPanel.breakdowns" :key="item.label" class="surface-panel" :class="`capacity-breakdown--${item.tone ?? 'default'}`">
            <span>{{ item.label }}</span><strong>{{ item.value }}</strong><small>{{ item.note }}</small>
          </article>
        </aside>
      </section>
    </template>

    <template v-if="config.kind === 'settings'">
      <section class="settings-meta surface-panel">
        <div><span>当前版本</span><strong>运营配置 v1.8</strong></div>
        <div><span>最后修改人</span><strong>运营管理员 · Ava</strong></div>
        <div><span>最后保存时间</span><strong>{{ lastSavedAt }}</strong></div>
        <StatusBadge :label="settingsDirty ? '存在未保存修改' : '配置已同步'" :tone="settingsDirty ? 'warning' : 'success'" dot />
        <button v-if="settingsDirty" class="btn btn--ghost settings-reset" type="button" @click="resetSettings"><RotateCcw :size="13" />撤销修改</button>
      </section>

      <div class="settings-sections">
        <section v-for="settingSection in config.settings" :key="settingSection.title" class="surface-panel settings-card">
          <header class="settings-card__header">
            <div><span>CONFIGURATION</span><h3>{{ settingSection.title }}</h3><p>{{ settingSection.description }}</p></div>
            <SlidersHorizontal :size="19" />
          </header>
          <div class="settings-card__fields">
            <label v-for="field in settingSection.fields" :key="field.key" class="setting-field" :class="{ 'setting-field--wide': field.type === 'textarea' }">
              <span>{{ field.label }}</span>
              <button v-if="field.type === 'switch'" type="button" class="setting-switch" :class="{ 'is-on': settingsDraft[field.key] }" role="switch" :aria-checked="Boolean(settingsDraft[field.key])" @click="toggleSetting(field)"><i></i><em>{{ settingsDraft[field.key] ? '已开启' : '已关闭' }}</em></button>
              <select v-else-if="field.type === 'select'" class="field-control setting-control" :value="String(settingsDraft[field.key] ?? '')" @change="updateSetting(field, $event)">
                <option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
              </select>
              <textarea v-else-if="field.type === 'textarea'" class="form-textarea" :value="String(settingsDraft[field.key] ?? '')" @input="updateSetting(field, $event)"></textarea>
              <div v-else class="setting-input">
                <input :type="field.type === 'number' ? 'number' : 'text'" :value="String(settingsDraft[field.key] ?? '')" @input="updateSetting(field, $event)" />
                <b v-if="field.unit">{{ field.unit }}</b>
              </div>
              <small v-if="field.help">{{ field.help }}</small>
            </label>
          </div>
        </section>
      </div>
    </template>

    <template v-else-if="config.kind === 'table' || isFleetMonitoring">
      <section v-if="section === 'settlements'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applySettlementSearch">
        <div class="advanced-filter-grid advanced-filter-grid--finance">
          <label class="filter-field"><span>订单ID</span><input v-model="settlementSearchDraft.orderId" class="field-control" type="search" placeholder="请输入订单ID" /></label>
          <label class="filter-field"><span>司机手机号</span><input v-model="settlementSearchDraft.driverPhone" class="field-control" type="search" placeholder="请输入司机手机号" /></label>
          <label class="filter-field"><span>司机名称</span><input v-model="settlementSearchDraft.driverName" class="field-control" type="search" placeholder="请输入司机名称" /></label>
          <label class="filter-field"><span>状态</span><select v-model="settlementSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="结算中">结算中</option><option value="已结算">已结算</option><option value="失败">失败</option></select></label>
          <label class="filter-field filter-field--range"><span>结算时间范围</span><div><input v-model="settlementSearchDraft.settledFrom" class="field-control" type="date" aria-label="结算开始日期" /><i>至</i><input v-model="settlementSearchDraft.settledTo" class="field-control" type="date" aria-label="结算结束日期" /></div></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applySettlementSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div><span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'driver-statements'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyDriverStatementSearch">
        <div class="advanced-filter-grid advanced-filter-grid--finance">
          <label class="filter-field"><span>司机ID</span><input v-model="driverStatementSearchDraft.driverId" class="field-control" type="search" placeholder="请输入司机ID" /></label>
          <label class="filter-field"><span>司机手机号</span><input v-model="driverStatementSearchDraft.driverPhone" class="field-control" type="search" placeholder="请输入司机手机号" /></label>
          <label class="filter-field"><span>司机名称</span><input v-model="driverStatementSearchDraft.driverName" class="field-control" type="search" placeholder="请输入司机名称" /></label>
          <label class="filter-field filter-field--range"><span>最近结算时间范围</span><div><input v-model="driverStatementSearchDraft.lastSettledFrom" class="field-control" type="date" aria-label="最近结算开始日期" /><i>至</i><input v-model="driverStatementSearchDraft.lastSettledTo" class="field-control" type="date" aria-label="最近结算结束日期" /></div></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyDriverStatementSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div><span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'users'" class="filter-bar module-filter-bar module-filter-bar--advanced">
        <div class="advanced-filter-grid">
          <label class="filter-field">
            <span>用户ID</span>
            <input v-model="userSearchDraft.userId" class="field-control" type="search" placeholder="请输入用户ID" />
          </label>
          <label class="filter-field">
            <span>姓名</span>
            <input v-model="userSearchDraft.name" class="field-control" type="search" placeholder="请输入姓名" />
          </label>
          <label class="filter-field">
            <span>英文名</span>
            <input v-model="userSearchDraft.englishName" class="field-control" type="search" placeholder="请输入英文名" />
          </label>
          <label class="filter-field">
            <span>手机号</span>
            <input v-model="userSearchDraft.phone" class="field-control" type="search" placeholder="请输入手机号" />
          </label>
          <label class="filter-field">
            <span>邮箱</span>
            <input v-model="userSearchDraft.email" class="field-control" type="search" placeholder="请输入邮箱" />
          </label>
          <label class="filter-field">
            <span>注册开始日期</span>
            <input v-model="userSearchDraft.registeredFrom" class="field-control" type="date" aria-label="注册开始日期" />
          </label>
          <label class="filter-field">
            <span>注册结束日期</span>
            <input v-model="userSearchDraft.registeredTo" class="field-control" type="date" aria-label="注册结束日期" />
          </label>
          <label class="filter-field">
            <span>身份</span>
            <select v-model="userSearchDraft.identity" class="field-control">
              <option value="全部">身份：全部</option>
              <option value="乘客">乘客</option>
              <option value="司机">司机</option>
              <option value="乘客、司机">乘客、司机</option>
            </select>
          </label>
          <label class="filter-field">
            <span>状态</span>
            <select v-model="userSearchDraft.status" class="field-control">
              <option value="全部">状态：全部</option>
              <option value="正常">正常</option>
              <option value="冻结">冻结</option>
            </select>
          </label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyUserSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div>
          <span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'drivers'" class="filter-bar module-filter-bar module-filter-bar--advanced">
        <div class="advanced-filter-grid">
          <label class="filter-field">
            <span>司机ID</span>
            <input v-model="driverSearchDraft.driverId" class="field-control" type="search" placeholder="请输入司机ID" />
          </label>
          <label class="filter-field">
            <span>姓名</span>
            <input v-model="driverSearchDraft.name" class="field-control" type="search" placeholder="请输入姓名" />
          </label>
          <label class="filter-field">
            <span>手机号</span>
            <input v-model="driverSearchDraft.phone" class="field-control" type="search" placeholder="请输入手机号" />
          </label>
          <label class="filter-field">
            <span>车牌号</span>
            <input v-model="driverSearchDraft.plate" class="field-control" type="search" placeholder="请输入车牌号" />
          </label>
          <label class="filter-field">
            <span>邮箱</span>
            <input v-model="driverSearchDraft.email" class="field-control" type="search" placeholder="请输入邮箱" />
          </label>
          <label class="filter-field">
            <span>认证开始日期</span>
            <input v-model="driverSearchDraft.certifiedFrom" class="field-control" type="date" aria-label="认证开始日期" />
          </label>
          <label class="filter-field">
            <span>认证结束日期</span>
            <input v-model="driverSearchDraft.certifiedTo" class="field-control" type="date" aria-label="认证结束日期" />
          </label>
          <label class="filter-field">
            <span>车型</span>
            <select v-model="driverSearchDraft.vehicleType" class="field-control">
              <option value="全部">车型：全部</option>
              <option value="经济5座">经济5座</option>
              <option value="豪华5座">豪华5座</option>
              <option value="经济7座">经济7座</option>
              <option value="商务7座">商务7座</option>
              <option value="豪华7座">豪华7座</option>
            </select>
          </label>
          <label class="filter-field">
            <span>合规状态</span>
            <select v-model="driverSearchDraft.compliance" class="field-control">
              <option value="全部">合规状态：全部</option>
              <option value="合规">合规</option>
              <option value="非合规">非合规</option>
            </select>
          </label>
          <label class="filter-field">
            <span>接单状态</span>
            <select v-model="driverSearchDraft.status" class="field-control">
              <option value="全部">接单状态：全部</option>
              <option value="正常">正常</option>
              <option value="冻结">冻结</option>
            </select>
          </label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyDriverSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div>
          <span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="isFleetMonitoring" class="filter-bar module-filter-bar module-filter-bar--advanced">
        <div class="advanced-filter-grid">
          <label class="filter-field"><span>车主ID</span><input v-model="fleetSearchDraft.driverId" class="field-control" type="search" placeholder="请输入车主ID" /></label>
          <label class="filter-field"><span>姓名</span><input v-model="fleetSearchDraft.name" class="field-control" type="search" placeholder="请输入姓名" /></label>
          <label class="filter-field"><span>手机号</span><input v-model="fleetSearchDraft.phone" class="field-control" type="search" placeholder="请输入手机号" /></label>
          <label class="filter-field"><span>车牌号</span><input v-model="fleetSearchDraft.plate" class="field-control" type="search" placeholder="请输入车牌号" /></label>
          <label class="filter-field"><span>车型</span><select v-model="fleetSearchDraft.vehicleType" class="field-control"><option value="全部">车型：全部</option><option value="经济5座">经济5座</option><option value="豪华5座">豪华5座</option><option value="经济7座">经济7座</option><option value="商务7座">商务7座</option><option value="豪华7座">豪华7座</option></select></label>
          <label class="filter-field"><span>在线状态</span><select v-model="fleetSearchDraft.onlineStatus" class="field-control"><option value="全部">在线状态：全部</option><option value="在线">在线</option><option value="离线">离线</option><option value="行程中">行程中</option></select></label>
          <label class="filter-field"><span>接单状态</span><select v-model="fleetSearchDraft.status" class="field-control"><option value="全部">接单状态：全部</option><option value="正常">正常</option><option value="冻结">冻结</option></select></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyFleetSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div>
          <span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'vehicle-types'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyVehicleSearch">
        <div class="advanced-filter-grid advanced-filter-grid--compact">
          <label class="filter-field"><span>车型名称</span><input v-model="vehicleSearchDraft.name" class="field-control" type="search" placeholder="请输入车型名称" /></label>
          <label class="filter-field"><span>座位数</span><select v-model="vehicleSearchDraft.seats" class="field-control"><option value="全部">座位数：全部</option><option v-for="seat in vehicleSeatOptions" :key="seat" :value="seat">{{ seat }} 座</option></select></label>
          <label class="filter-field"><span>车型等级</span><select v-model="vehicleSearchDraft.grade" class="field-control"><option value="全部">车型等级：全部</option><option v-for="grade in vehicleGradeOptions" :key="grade" :value="grade">{{ grade }}</option></select></label>
          <label class="filter-field"><span>状态</span><select v-model="vehicleSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="启用">启用</option><option value="禁用">禁用</option></select></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyVehicleSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div>
          <span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'geofences'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyGeofenceSearch">
        <div class="advanced-filter-grid advanced-filter-grid--geofence">
          <label class="filter-field"><span>围栏名称</span><input v-model="geofenceSearchDraft.name" class="field-control" type="search" placeholder="请输入围栏名称" /></label>
          <label class="filter-field"><span>围栏类型</span><select v-model="geofenceSearchDraft.type" class="field-control"><option value="全部">围栏类型：全部</option><option value="机场">机场</option><option value="城市">城市</option></select></label>
          <label class="filter-field"><span>状态</span><select v-model="geofenceSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="启用">启用</option><option value="禁用">禁用</option></select></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyGeofenceSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div>
          <span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'airport-routes'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyAirportRouteSearch">
        <div class="advanced-filter-grid advanced-filter-grid--route">
          <label class="filter-field"><span>路线ID</span><input v-model="airportRouteSearchDraft.routeId" class="field-control" type="search" placeholder="请输入路线ID" /></label>
          <label class="filter-field"><span>路线名称</span><input v-model="airportRouteSearchDraft.name" class="field-control" type="search" placeholder="请输入路线名称" /></label>
          <label class="filter-field"><span>业务</span><select v-model="airportRouteSearchDraft.business" class="field-control"><option value="全部">业务：全部</option><option value="接机">接机</option><option value="送机">送机</option></select></label>
          <label class="filter-field"><span>起点围栏</span><select v-model="airportRouteSearchDraft.startFenceId" class="field-control"><option value="全部">起点围栏：全部</option><option v-for="fence in routeFences" :key="`start-${fence.id}`" :value="fence.id">{{ fence.name }} · {{ fence.id }}</option></select></label>
          <label class="filter-field"><span>终点围栏</span><select v-model="airportRouteSearchDraft.endFenceId" class="field-control"><option value="全部">终点围栏：全部</option><option v-for="fence in routeFences" :key="`end-${fence.id}`" :value="fence.id">{{ fence.name }} · {{ fence.id }}</option></select></label>
          <label class="filter-field"><span>是否热门</span><select v-model="airportRouteSearchDraft.popular" class="field-control"><option value="全部">是否热门：全部</option><option value="热门">热门</option><option value="非热门">非热门</option></select></label>
          <label class="filter-field"><span>状态</span><select v-model="airportRouteSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="启用">启用</option><option value="禁用">禁用</option></select></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyAirportRouteSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div>
          <span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'charter-routes'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyCharterRouteSearch">
        <div class="advanced-filter-grid advanced-filter-grid--charter">
          <label class="filter-field"><span>路线名称</span><input v-model="charterRouteSearchDraft.name" class="field-control" type="search" placeholder="请输入路线名称" /></label>
          <label class="filter-field"><span>状态</span><select v-model="charterRouteSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="启用">启用</option><option value="禁用">禁用</option></select></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyCharterRouteSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div>
          <span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'coupons'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyCouponSearch">
        <div class="advanced-filter-grid advanced-filter-grid--coupon">
          <label class="filter-field"><span>券ID</span><input v-model="couponSearchDraft.couponId" class="field-control" type="search" placeholder="请输入券ID" /></label>
          <label class="filter-field"><span>券名</span><input v-model="couponSearchDraft.name" class="field-control" type="search" placeholder="请输入券名" /></label>
          <label class="filter-field"><span>券类型</span><select v-model="couponSearchDraft.couponType" class="field-control"><option value="全部">券类型：全部</option><option value="满减">满减</option><option value="折扣">折扣</option></select></label>
          <label class="filter-field"><span>使用服务</span><select v-model="couponSearchDraft.service" class="field-control"><option value="全部">使用服务：全部</option><option value="拼车">拼车</option><option value="独享">独享</option></select></label>
          <label class="filter-field"><span>有效期开始</span><input v-model="couponSearchDraft.validFrom" class="field-control" type="date" /></label>
          <label class="filter-field"><span>有效期结束</span><input v-model="couponSearchDraft.validTo" class="field-control" type="date" /></label>
          <label class="filter-field"><span>状态</span><select v-model="couponSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="启用">启用</option><option value="禁用">禁用</option></select></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyCouponSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div>
          <span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'coupon-grants'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyCouponGrantSearch">
        <div class="advanced-filter-grid advanced-filter-grid--coupon-grant">
          <label class="filter-field"><span>券ID</span><input v-model="couponGrantSearchDraft.couponId" class="field-control" type="search" placeholder="请输入券ID" /></label>
          <label class="filter-field"><span>券码</span><input v-model="couponGrantSearchDraft.code" class="field-control" type="search" placeholder="请输入单张券码" /></label>
          <label class="filter-field"><span>券名</span><input v-model="couponGrantSearchDraft.couponName" class="field-control" type="search" placeholder="请输入券名" /></label>
          <label class="filter-field"><span>券类型</span><select v-model="couponGrantSearchDraft.couponType" class="field-control"><option value="全部">券类型：全部</option><option value="满减">满减</option><option value="折扣">折扣</option></select></label>
          <label class="filter-field"><span>使用服务</span><select v-model="couponGrantSearchDraft.service" class="field-control"><option value="全部">使用服务：全部</option><option value="拼车">拼车</option><option value="独享">独享</option></select></label>
          <label class="filter-field filter-field--range"><span>有效期范围</span><div><input v-model="couponGrantSearchDraft.validFrom" class="field-control" type="date" aria-label="有效期开始" /><i>至</i><input v-model="couponGrantSearchDraft.validTo" class="field-control" type="date" aria-label="有效期结束" /></div></label>
          <label class="filter-field"><span>状态</span><select v-model="couponGrantSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="未核销">未核销</option><option value="已核销">已核销</option><option value="已过期">已过期</option></select></label>
          <label class="filter-field"><span>持有用户手机号</span><input v-model="couponGrantSearchDraft.phone" class="field-control" type="search" placeholder="请输入持有用户手机号" /></label>
          <label class="filter-field filter-field--range"><span>发放时间范围</span><div><input v-model="couponGrantSearchDraft.grantedFrom" class="field-control" type="date" aria-label="发放开始" /><i>至</i><input v-model="couponGrantSearchDraft.grantedTo" class="field-control" type="date" aria-label="发放结束" /></div></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyCouponGrantSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div>
          <span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'campaigns'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyCampaignSearch">
        <div class="advanced-filter-grid advanced-filter-grid--campaign">
          <label class="filter-field"><span>活动ID</span><input v-model="campaignSearchDraft.campaignId" class="field-control" type="search" placeholder="请输入活动ID" /></label>
          <label class="filter-field"><span>活动名</span><input v-model="campaignSearchDraft.name" class="field-control" type="search" placeholder="请输入活动名" /></label>
          <label class="filter-field filter-field--range"><span>有效期范围</span><div><input v-model="campaignSearchDraft.validFrom" class="field-control" type="date" aria-label="活动有效期开始" /><i>至</i><input v-model="campaignSearchDraft.validTo" class="field-control" type="date" aria-label="活动有效期结束" /></div></label>
          <label class="filter-field"><span>状态</span><select v-model="campaignSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="下架">下架</option><option value="待开始">待开始</option><option value="进行中">进行中</option><option value="已结束">已结束</option></select></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyCampaignSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div>
          <span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'value-added-services'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyValueAddedServiceSearch">
        <div class="advanced-filter-grid advanced-filter-grid--value-added-service">
          <label class="filter-field"><span>服务名称</span><input v-model="valueAddedServiceSearchDraft.name" class="field-control" type="search" placeholder="请输入服务名称" /></label>
          <label class="filter-field"><span>服务描述</span><input v-model="valueAddedServiceSearchDraft.description" class="field-control" type="search" placeholder="请输入描述关键词" /></label>
          <label class="filter-field"><span>状态</span><select v-model="valueAddedServiceSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="启用">启用</option><option value="禁用">禁用</option></select></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyValueAddedServiceSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div>
          <span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'banners'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyBannerSearch">
        <div class="advanced-filter-grid advanced-filter-grid--banner">
          <label class="filter-field"><span>Banner 名称</span><input v-model="bannerSearchDraft.name" class="field-control" type="search" placeholder="请输入 Banner 名称" /></label>
          <label class="filter-field"><span>发布端</span><select v-model="bannerSearchDraft.channel" class="field-control"><option value="全部">发布端：全部</option><option value="小程序">小程序</option><option value="APP">APP</option></select></label>
          <label class="filter-field"><span>状态</span><select v-model="bannerSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="启用">启用</option><option value="待生效">待生效</option><option value="禁用">禁用</option></select></label>
          <label class="filter-field filter-field--range"><span>生效时间范围</span><div><input v-model="bannerSearchDraft.validFrom" class="field-control" type="date" aria-label="Banner 生效开始" /><i>至</i><input v-model="bannerSearchDraft.validTo" class="field-control" type="date" aria-label="Banner 生效结束" /></div></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyBannerSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div><span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'notices'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyNoticeSearch">
        <div class="advanced-filter-grid advanced-filter-grid--notice">
          <label class="filter-field"><span>公告标题</span><input v-model="noticeSearchDraft.title" class="field-control" type="search" placeholder="请输入公告标题" /></label>
          <label class="filter-field"><span>发布端</span><select v-model="noticeSearchDraft.channel" class="field-control"><option value="全部">发布端：全部</option><option value="小程序">小程序</option><option value="乘客">乘客</option><option value="司导">司导</option></select></label>
          <label class="filter-field"><span>状态</span><select v-model="noticeSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="启用">启用</option><option value="待生效">待生效</option><option value="禁用">禁用</option></select></label>
          <label class="filter-field filter-field--range"><span>生效时间范围</span><div><input v-model="noticeSearchDraft.validFrom" class="field-control" type="date" aria-label="公告生效开始" /><i>至</i><input v-model="noticeSearchDraft.validTo" class="field-control" type="date" aria-label="公告生效结束" /></div></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyNoticeSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div><span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'carpool-copy' || section === 'system-messages'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyMessageTemplateSearch">
        <div class="advanced-filter-grid advanced-filter-grid--message-template">
          <label class="filter-field"><span>内容</span><input v-model="messageTemplateSearchDraft.content" class="field-control" type="search" :placeholder="section === 'carpool-copy' ? '请输入默认语内容' : '请输入系统消息内容'" /></label>
          <label class="filter-field"><span>{{ section === 'carpool-copy' ? '生效端' : '发布端' }}</span><select v-model="messageTemplateSearchDraft.endpoint" class="field-control"><option value="全部">{{ section === 'carpool-copy' ? '生效端' : '发布端' }}：全部</option><option value="乘客端">乘客端</option><option value="司导端">司导端</option></select></label>
          <label v-if="section === 'system-messages'" class="filter-field"><span>节点分组</span><select v-model="messageTemplateSearchDraft.group" class="field-control"><option value="全部">节点分组：全部</option><option v-for="item in ['账号', '支付', '拼车', '派单', '行程', '退款', '营销', '认证', '订单', '结算', '资质', '账户', '运营']" :key="item" :value="item">{{ item }}</option></select></label>
          <label class="filter-field"><span>{{ section === 'carpool-copy' ? '节点' : '发送节点' }}</span><select v-model="messageTemplateSearchDraft.node" class="field-control"><option value="全部">{{ section === 'carpool-copy' ? '节点' : '发送节点' }}：全部</option><option v-for="item in config.filters?.find((filter) => filter.key === 'node')?.options.filter((item) => item !== '全部')" :key="item" :value="item">{{ item }}</option></select></label>
          <label class="filter-field"><span>状态</span><select v-model="messageTemplateSearchDraft.status" class="field-control"><option value="全部">状态：全部</option><option value="启用">启用</option><option value="禁用">禁用</option></select></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyMessageTemplateSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div><span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'feedback'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyFeedbackSearch">
        <div class="advanced-filter-grid advanced-filter-grid--service-ticket">
          <label class="filter-field"><span>反馈类型</span><select v-model="feedbackSearchDraft.feedbackType" class="field-control"><option value="全部">反馈类型：全部</option><option v-for="item in feedbackTypeOptions" :key="item" :value="item">{{ item }}</option></select></label>
          <label class="filter-field"><span>反馈内容</span><input v-model="feedbackSearchDraft.content" class="field-control" type="search" placeholder="请输入内容关键词" /></label>
          <label class="filter-field"><span>提交人身份</span><select v-model="feedbackSearchDraft.identity" class="field-control"><option value="全部">提交人身份：全部</option><option value="乘客">乘客</option><option value="司导">司导</option></select></label>
          <label class="filter-field"><span>处理状态</span><select v-model="feedbackSearchDraft.status" class="field-control"><option value="全部">处理状态：全部</option><option value="待处理">待处理</option><option value="已接收">已接收</option><option value="处理中">处理中</option><option value="已完结">已完结</option></select></label>
          <label class="filter-field filter-field--range"><span>提交日期范围</span><div><input v-model="feedbackSearchDraft.submittedFrom" class="field-control" type="date" aria-label="提交开始日期" /><i>至</i><input v-model="feedbackSearchDraft.submittedTo" class="field-control" type="date" aria-label="提交结束日期" /></div></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyFeedbackSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div><span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else-if="section === 'exception-orders'" class="filter-bar module-filter-bar module-filter-bar--advanced" @keyup.enter="applyExceptionOrderSearch">
        <div class="advanced-filter-grid advanced-filter-grid--service-ticket">
          <label class="filter-field"><span>订单号</span><input v-model="exceptionOrderSearchDraft.orderId" class="field-control" type="search" placeholder="请输入订单号" /></label>
          <label class="filter-field"><span>乘客姓名</span><input v-model="exceptionOrderSearchDraft.passengerName" class="field-control" type="search" placeholder="请输入乘客姓名" /></label>
          <label class="filter-field"><span>乘客手机号</span><input v-model="exceptionOrderSearchDraft.passengerPhone" class="field-control" type="search" placeholder="请输入乘客手机号" /></label>
          <label class="filter-field"><span>司机姓名</span><input v-model="exceptionOrderSearchDraft.driverName" class="field-control" type="search" placeholder="请输入司机姓名" /></label>
          <label class="filter-field"><span>处理状态</span><select v-model="exceptionOrderSearchDraft.status" class="field-control"><option value="全部">处理状态：全部</option><option value="待处理">待处理</option><option value="已处理">已处理</option></select></label>
          <label class="filter-field filter-field--range"><span>上报日期范围</span><div><input v-model="exceptionOrderSearchDraft.reportedFrom" class="field-control" type="date" aria-label="上报开始日期" /><i>至</i><input v-model="exceptionOrderSearchDraft.reportedTo" class="field-control" type="date" aria-label="上报结束日期" /></div></label>
        </div>
        <div class="advanced-filter-actions">
          <button class="btn btn--brand" type="button" @click="applyExceptionOrderSearch"><Search :size="14" />搜索</button>
          <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
          <div class="filter-bar__spacer"></div><span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
        </div>
      </section>
      <section v-else class="filter-bar module-filter-bar">
        <label class="filter-bar__search">
          <Search :size="15" /><input v-model="searchTerm" type="search" :placeholder="config.searchPlaceholder ?? `搜索${pageMeta.title}`" />
        </label>
        <select v-for="filter in config.filters" :key="filter.key" v-model="activeFilters[filter.key]" class="field-control">
          <option value="全部">{{ filter.label }}：全部</option>
          <option v-for="option in filter.options.filter((item) => item !== '全部')" :key="option" :value="option">{{ option }}</option>
        </select>
        <button class="btn btn--ghost" type="button" @click="resetFilters"><RotateCcw :size="14" />重置</button>
        <div class="filter-bar__spacer"></div><span class="result-count">找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
      </section>

      <section class="table-shell">
        <div class="table-scroll">
          <table class="data-table module-data-table" :class="{ 'module-data-table--vehicle': section === 'vehicle-types', 'module-data-table--geofence': section === 'geofences', 'module-data-table--route': section === 'airport-routes', 'module-data-table--exception': section === 'exception-orders' }">
            <thead><tr><th v-for="column in visibleColumns" :key="column.key" :style="{ minWidth: column.width }">{{ column.label }}</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="row in pagedRows" :key="row.id">
                <td v-for="column in visibleColumns" :key="column.key">
                  <img v-if="column.kind === 'image'" class="table-thumbnail" :src="String(row[column.key] ?? '')" :alt="`${String(row.name ?? '车型')}图片`" />
                  <div v-else-if="column.kind === 'primary'" class="table-primary-cell">
                    <strong>{{ formatCell(row[column.key], column) }}</strong><small v-if="column.secondaryKey">{{ formatCell(row[column.secondaryKey], column) }}</small>
                  </div>
                  <StatusBadge v-else-if="column.kind === 'status'" :label="formatCell(row[column.key], column)" :tone="statusTone(row[column.key])" dot />
                  <div v-else-if="column.kind === 'progress'" class="progress-cell">
                    <span><i :style="{ width: progressWidth(row[column.key]) }"></i></span><strong>{{ formatCell(row[column.key], column) }}</strong>
                  </div>
                  <button v-else-if="isFleetMonitoring && column.key === 'rating'" class="rating-link" type="button" title="查看评价详情" @click="openRowDetail(row, 'reviews')">{{ formatCell(row[column.key], column) }} ★</button>
                  <button v-else-if="section === 'vehicle-types' && column.key === 'routeCount'" class="relation-link" type="button" @click="vehicleRoutesTarget = row">{{ formatCell(row[column.key], column) }} 条</button>
                  <button v-else-if="section === 'geofences' && column.key === 'routeCount'" class="relation-link" type="button" @click="openGeofenceRoutes(row)">{{ formatCell(row[column.key], column) }} 条</button>
                  <span v-else-if="section === 'vehicle-types' && column.key === 'grade'" class="vehicle-grade">{{ formatCell(row[column.key], column) }}</span>
                  <span v-else-if="section === 'vehicle-types' && column.key === 'description'" class="table-description" :title="formatCell(row[column.key], column)">{{ formatCell(row[column.key], column) }}</span>
                  <span v-else-if="['notices', 'carpool-copy', 'system-messages'].includes(section) && column.key === 'content'" class="table-description" :title="formatCell(row[column.key], column)">{{ formatCell(row[column.key], column) }}</span>
                  <span v-else :class="{ mono: column.kind === 'mono' || column.kind === 'currency' }">{{ formatCell(row[column.key], column) }}</span>
                </td>
                <td>
                  <div class="table-actions">
                    <button v-if="section !== 'settlements'" class="table-action" type="button" @click="openRowDetail(row)"><Eye :size="13" />查看</button>
                    <button
                      v-if="config.canEdit !== false"
                      class="table-action"
                      type="button"
                      :disabled="editRowDisabled(row)"
                      :title="editRowTitle(row)"
                      @click="openEdit(row)"
                    ><Pencil :size="13" />编辑</button>
                    <button v-if="section === 'airport-routes'" class="table-action" type="button" @click="toggleRoutePopular(row)">{{ row.popular === '热门' ? '取消热门' : '标记热门' }}</button>
                    <button v-if="section === 'drivers'" class="table-action" type="button" @click="openDriverMarkEditor(row)">修改司机标记</button>
                    <button
                      v-if="section === 'drivers' || isFleetMonitoring"
                      class="table-action"
                      :class="{ 'table-action--danger': row.poolState === '开启' }"
                      type="button"
                      @click="toggleDriverPool(row)"
                    >{{ row.poolState === '开启' ? '关闭订单池' : '开启订单池' }}</button>
                    <button v-if="config.rowAction" class="table-action" :class="{ 'table-action--danger': config.rowAction.tone === 'danger' || (section === 'campaigns' && row.status !== '下架') }" type="button" :disabled="rowActionDisabled(row)" @click="performRowAction(row)">{{ rowActionLabel(row) }}</button>
                    <button v-if="section === 'exception-orders'" class="table-action" type="button" :disabled="row.status === '已处理'" @click="openExceptionRefund(row)">人工退款</button>
                    <button v-if="section === 'exception-orders'" class="table-action table-action--danger" type="button" :disabled="row.status === '已处理'" @click="exceptionCancelTarget = row">取消退款</button>
                    <button
                      v-if="section === 'charter-routes' || section === 'vehicle-types' || section === 'geofences' || section === 'coupons' || section === 'campaigns' || section === 'value-added-services' || section === 'banners' || section === 'notices' || section === 'carpool-copy'"
                      class="table-action table-action--danger"
                      type="button"
                      :disabled="(section === 'campaigns' && row.status !== '下架') || (section === 'value-added-services' && row.businessLinked === true)"
                      :title="section === 'campaigns' && row.status !== '下架' ? '仅下架活动可删除' : section === 'value-added-services' && row.businessLinked === true ? '儿童座椅与业务关联，不可删除' : '删除记录'"
                      @click="requestDelete(row)"
                    ><Trash2 :size="13" />删除</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="filteredRows.length === 0" class="empty-state">
          <span class="empty-state__icon"><Search :size="20" /></span><strong>没有匹配记录</strong><p>调整关键词或筛选条件后再试。</p>
        </div>
        <footer v-else class="table-footer">
          <div>第 {{ currentPage }} / {{ totalPages }} 页 · 共 {{ filteredRows.length }} 条</div>
          <div class="table-pagination-controls">
            <select v-model="pageSize" class="page-size-select"><option :value="20">20 条/页</option><option :value="50">50 条/页</option><option :value="100">100 条/页</option></select>
            <div class="pagination">
              <button type="button" :disabled="currentPage <= 1" @click="currentPage--"><ChevronLeft :size="14" /></button>
              <button class="is-active" type="button">{{ currentPage }}</button>
              <button type="button" :disabled="currentPage >= totalPages" @click="currentPage++"><ChevronRight :size="14" /></button>
            </div>
          </div>
        </footer>
      </section>
    </template>

    <UserDetailDrawer
      v-if="selectedRow && section === 'users'"
      :user="selectedRow"
      @close="selectedRow = null"
    />

    <DriverDetailDrawer
      v-else-if="selectedRow && (section === 'drivers' || isFleetMonitoring)"
      :driver="selectedRow"
      :initial-tab="driverDetailInitialTab"
      @close="closeRowDetail"
    />

    <RoutePricingDetail
      v-else-if="selectedRow && section === 'airport-routes'"
      :row="selectedRow"
      :fences="routeFences"
      :vehicles="routeVehicles"
      @close="selectedRow = null"
      @edit="openEdit(selectedRow); selectedRow = null"
    />

    <CharterRouteDetail
      v-else-if="selectedRow && section === 'charter-routes'"
      :row="selectedRow"
      @close="selectedRow = null"
      @edit="openEdit(selectedRow); selectedRow = null"
    />

    <CouponDetail
      v-else-if="selectedRow && section === 'coupons'"
      :row="selectedRow"
      @close="selectedRow = null"
      @edit="openEdit(selectedRow); selectedRow = null"
    />

    <CouponGrantDetail
      v-else-if="selectedRow && section === 'coupon-grants'"
      :row="selectedRow"
      @close="selectedRow = null"
    />

    <CampaignDetail
      v-else-if="selectedRow && section === 'campaigns'"
      :row="selectedRow"
      @close="selectedRow = null"
      @edit="openEdit(selectedRow); selectedRow = null"
    />

    <ValueAddedServiceDetail
      v-else-if="selectedRow && section === 'value-added-services'"
      :row="selectedRow"
      @close="selectedRow = null"
      @edit="openEdit(selectedRow); selectedRow = null"
    />

    <BannerDetail
      v-else-if="selectedRow && section === 'banners'"
      :row="selectedRow"
      @close="selectedRow = null"
      @edit="openEdit(selectedRow); selectedRow = null"
    />

    <NoticeDetail
      v-else-if="selectedRow && section === 'notices'"
      :row="selectedRow"
      @close="selectedRow = null"
      @edit="openEdit(selectedRow); selectedRow = null"
    />

    <CarpoolCopyDetail
      v-else-if="selectedRow && section === 'carpool-copy'"
      :row="selectedRow"
      @close="selectedRow = null"
      @edit="openEdit(selectedRow); selectedRow = null"
    />

    <SystemMessageDetail
      v-else-if="selectedRow && section === 'system-messages'"
      :row="selectedRow"
      @close="selectedRow = null"
      @edit="openEdit(selectedRow); selectedRow = null"
    />

    <FeedbackDetail
      v-else-if="selectedRow && section === 'feedback'"
      :row="selectedRow"
      @close="selectedRow = null"
      @advance="advanceSelectedFeedback"
    />

    <ExceptionOrderDetail
      v-else-if="selectedRow && section === 'exception-orders'"
      :row="selectedRow"
      @close="selectedRow = null"
      @refund="refundSelectedException(selectedRow)"
      @cancel-refund="cancelSelectedException(selectedRow)"
    />

    <DriverSettlementDetail
      v-else-if="selectedRow && section === 'driver-statements'"
      :row="selectedRow"
      @close="selectedRow = null"
    />

    <DrawerShell v-else-if="selectedRow" :title="`${pageMeta.title}详情`" :eyebrow="`${config.eyebrow} / DETAIL`" @close="selectedRow = null">
      <div class="detail-hero">
        <span>{{ selectedRow.id.slice(0, 2) }}</span>
        <div><small>RECORD ID</small><h3>{{ selectedRow.id }}</h3><p>该记录来自当前原型业务数据仓，操作结果会在本次会话中保留。</p></div>
        <StatusBadge v-if="selectedRow.status" :label="selectedRow.status" :tone="statusTone(selectedRow.status)" dot />
      </div>
      <section v-if="section === 'geofences'" class="geofence-detail-map">
        <header><div><span>POLYGON PREVIEW</span><strong>{{ selectedRow.name }} · {{ selectedRow.type }}</strong></div><small>{{ selectedRow.vertexCount }} 个顶点</small></header>
        <svg viewBox="0 0 100 100" aria-label="围栏边界预览">
          <defs><pattern id="detail-geofence-grid" width="7" height="7" patternUnits="userSpaceOnUse"><path d="M 7 0 L 0 0 0 7" fill="none" stroke="#d7e2e9" stroke-width=".4" /></pattern></defs>
          <rect width="100" height="100" fill="#edf3f6" /><rect width="100" height="100" fill="url(#detail-geofence-grid)" />
          <path d="M3 85 C23 72 35 64 49 52 S73 28 98 16" />
          <path d="M10 3 C16 24 28 39 46 49 S74 68 93 98" />
          <polygon :points="geofencePolygonPoints(selectedRow)" />
        </svg>
        <div class="geofence-detail-map__relation"><StatusBadge :label="String(selectedRow.geometryRelation ?? '正常')" :tone="String(selectedRow.geometryRelation ?? '').includes('交叠') ? 'warning' : 'info'" dot /><span v-if="selectedRow.relatedFence">关联围栏：{{ selectedRow.relatedFence }}</span><span v-else>未检测到与其他围栏相交</span></div>
      </section>
      <div class="detail-grid">
        <div v-for="column in visibleColumns" :key="column.key">
          <template v-if="column.kind === 'image'"><span>{{ column.label }}</span><img class="detail-vehicle-image" :src="String(selectedRow[column.key] ?? '')" :alt="`${String(selectedRow.name ?? '车型')}图片`" /></template>
          <template v-else-if="column.kind === 'status'"><span>{{ column.label }}</span><StatusBadge :label="formatCell(selectedRow[column.key], column)" :tone="statusTone(selectedRow[column.key])" dot /></template>
          <template v-else><span>{{ column.label }}</span><strong>{{ formatCell(selectedRow[column.key], column) }}</strong></template>
        </div>
      </div>
      <section class="detail-note"><Sparkles :size="16" /><div><strong>业务操作提示</strong><p>{{ config.insight.description }}</p></div></section>
      <template #footer>
        <button class="btn btn--secondary" type="button" @click="selectedRow = null">关闭</button>
        <button v-if="config.canEdit !== false" class="btn btn--brand" type="button" @click="openEdit(selectedRow); selectedRow = null"><Pencil :size="14" />编辑记录</button>
      </template>
    </DrawerShell>

    <RoutePricingEditor
      v-if="editMode && section === 'airport-routes'"
      :row="editTarget"
      :rows="rows"
      :fences="routeFences"
      :vehicles="routeVehicles"
      @close="closeEditor"
      @save="saveRoute"
    />

    <GeofenceEditor
      v-else-if="editMode && section === 'geofences'"
      :row="editTarget"
      :rows="rows"
      @close="closeEditor"
      @save="saveGeofence"
    />

    <CouponEditor
      v-else-if="editMode && section === 'coupons'"
      :row="editTarget"
      :rows="rows"
      @close="closeEditor"
      @save="saveCoupon"
    />

    <CampaignEditor
      v-else-if="editMode && section === 'campaigns'"
      :row="editTarget"
      :rows="rows"
      :coupons="campaignCoupons"
      @close="closeEditor"
      @save="saveCampaign"
    />

    <ValueAddedServiceEditor
      v-else-if="editMode && section === 'value-added-services'"
      :row="editTarget"
      :rows="rows"
      @close="closeEditor"
      @save="saveValueAddedService"
    />

    <BannerEditor
      v-else-if="editMode && section === 'banners'"
      :row="editTarget"
      :rows="rows"
      @close="closeEditor"
      @save="saveBanner"
    />

    <NoticeEditor
      v-else-if="editMode && section === 'notices'"
      :row="editTarget"
      :rows="rows"
      @close="closeEditor"
      @save="saveNotice"
    />

    <CarpoolCopyEditor
      v-else-if="editMode && section === 'carpool-copy'"
      :row="editTarget"
      :rows="rows"
      @close="closeEditor"
      @save="saveCarpoolCopy"
    />

    <SystemMessageEditor
      v-else-if="editMode && section === 'system-messages' && editTarget"
      :row="editTarget"
      @close="closeEditor"
      @save="saveSystemMessage"
    />

    <ModalDialog v-else-if="editMode" :title="editMode === 'create' ? `新增${pageMeta.title}` : `编辑${pageMeta.title}`" eyebrow="FORM EDITOR" :size="section === 'charter-routes' ? 'wide' : 'default'" @close="closeEditor">
      <div class="editor-grid">
        <label v-for="column in draftColumns" :key="column.key" class="editor-field" :class="{ 'editor-field--wide': section === 'vehicle-types' && ['image', 'description'].includes(column.key) }">
          <span>{{ column.label }}<em v-if="isDraftFieldRequired(column)" class="required-mark" aria-hidden="true"> *</em></span>
          <span v-if="section === 'vehicle-types' && column.key === 'image'" class="vehicle-image-uploader">
            <img v-if="editDraft.image" :src="editDraft.image" alt="车型图片预览" />
            <span v-else class="vehicle-image-uploader__empty"><ImagePlus :size="22" /><b>上传车型图片</b><small>支持 JPG、PNG、WebP，文件不超过 3 MB</small></span>
            <span v-if="editDraft.image" class="vehicle-image-uploader__replace"><ImagePlus :size="14" />点击更换图片</span>
            <input type="file" accept="image/*" @change="handleVehicleImageUpload" />
          </span>
          <select v-else-if="optionsForColumn(column).length" v-model="editDraft[column.key]" class="field-control"><option v-for="option in optionsForColumn(column)" :key="option" :value="option">{{ option }}</option></select>
          <textarea v-else-if="section === 'vehicle-types' && column.key === 'description'" v-model="editDraft[column.key]" class="form-textarea" maxlength="200" placeholder="请输入车型定位、适用场景或乘坐体验说明"></textarea>
          <input v-else-if="section === 'vehicle-types' && column.key !== 'name'" v-model="editDraft[column.key]" class="field-control" type="number" :min="column.key === 'seats' ? 2 : 0" :max="column.key === 'seats' ? 20 : 30" step="1" :placeholder="`请输入${column.label}`" />
          <div v-else-if="column.kind === 'currency'" class="editor-money-field">
            <b>£</b><input v-model="editDraft[column.key]" type="number" step="0.01" :min="isDraftFieldRequired(column) ? '0.01' : undefined" :required="isDraftFieldRequired(column)" :aria-required="isDraftFieldRequired(column)" :placeholder="`请输入${column.label}`" />
          </div>
          <textarea v-else-if="section === 'charter-routes' && ['intro', 'description'].includes(column.key)" v-model="editDraft[column.key]" class="form-textarea" :placeholder="`请输入${column.label}`"></textarea>
          <input v-else-if="section === 'charter-routes' && column.key === 'sort'" v-model="editDraft[column.key]" class="field-control" type="number" min="0" step="1" placeholder="请输入排序值" />
          <input v-else v-model="editDraft[column.key]" class="field-control" type="text" :placeholder="`请输入${column.label}`" />
        </label>
      </div>
      <p class="editor-tip">{{ section === 'charter-routes' ? '参考金额为必填项，单位为英镑；仅用于乘客端页面展示，不参与定价、支付、订单或分账。' : section === 'vehicle-types' ? '车型图片、名称、描述与等级均为必填项；座位数包含司机位，可载乘客数由系统自动计算为“座位数 − 1”。容量修改仅影响新订单。' : '保存后将立即更新当前原型列表，并通过消息提示反馈操作结果。' }}</p>
      <template #footer>
        <button class="btn btn--secondary" type="button" @click="closeEditor">取消</button><button class="btn btn--brand" type="button" @click="saveRow"><Check :size="14" />确认保存</button>
      </template>
    </ModalDialog>

    <CouponGrantDialog
      v-if="couponGrantOpen && section === 'coupons'"
      :coupons="rows"
      :users="couponUsers"
      @close="couponGrantOpen = false"
      @grant="completeCouponGrant"
    />

    <ExceptionRefundDialog
      v-if="exceptionRefundTarget && section === 'exception-orders'"
      :row="exceptionRefundTarget"
      @close="exceptionRefundTarget = null"
      @submit="completeExceptionRefund"
    />

    <ModalDialog
      v-if="exceptionCancelTarget && section === 'exception-orders'"
      :title="`确认取消退款 · ${exceptionCancelTarget.id}`"
      eyebrow="CANCEL REFUND"
      @close="exceptionCancelTarget = null"
    >
      <div class="delete-confirmation">
        <span><AlertTriangle :size="20" /></span>
        <div>
          <strong>{{ exceptionCancelTarget.passenger }} 将不获得退款</strong>
          <p>确认后，该异常乘客记录将标记为“已处理”。若行程已履约，司机按订单金额正常分账；若未履约，对应款项由平台保留。该操作会写入处理记录。</p>
        </div>
      </div>
      <template #footer>
        <button class="btn btn--secondary" type="button" @click="exceptionCancelTarget = null">返回核对</button>
        <button class="btn btn--danger" type="button" @click="confirmExceptionCancel">确认取消退款</button>
      </template>
    </ModalDialog>

    <ModalDialog v-if="driverMarkTarget" title="修改司机标记" eyebrow="DRIVER LABEL EDITOR" @close="closeDriverMarkEditor">
      <div class="driver-mark-editor-head"><span>{{ String(driverMarkTarget.driverId ?? driverMarkTarget.id) }}</span><div><strong>{{ driverMarkTarget.name }} · {{ driverMarkTarget.englishName }}</strong><p>管理员标记修改将记录操作人、时间及修改前后值。</p></div></div>
      <div class="driver-mark-editor-body">
        <section class="driver-mark-editor-section"><label>服务类型（接单类型）<b>至少选择 1 项</b></label><div class="driver-mark-options"><button v-for="type in driverAcceptingTypeOptions" :key="type" type="button" :class="{ 'is-selected': driverMarkDraft.acceptingTypes.includes(type) }" @click="toggleDriverAcceptingType(type)">{{ type }}</button></div><p>“接送机”影响线上派单范围；“包车”仅作运营标签。</p></section>
        <section class="driver-mark-editor-section"><label>合规类型<b>必填，单选</b></label><div class="driver-mark-options"><button v-for="type in driverComplianceOptions" :key="type" type="button" :class="{ 'is-selected': driverMarkDraft.compliance === type }" @click="selectDriverCompliance(type)">{{ type }}</button></div><p>人工合规结论与证件有效期相互独立；非合规不会自动冻结接单。</p></section>
        <section class="driver-mark-editor-section"><label>服务车型<b>仅可选择已启用车型</b></label><select v-model="driverMarkDraft.vehicleType" class="field-control"><option value="">请选择服务车型</option><option v-for="vehicleType in enabledDriverVehicleTypes" :key="vehicleType" :value="vehicleType">{{ vehicleType }}</option></select><p v-if="enabledDriverVehicleTypes.length">车型修改仅对新订单生效，不影响已分配订单的定价与履约。</p><p v-else>请先在车型管理中创建并启用车型。</p></section>
      </div>
      <template #footer><button class="btn btn--secondary" type="button" @click="closeDriverMarkEditor">取消</button><button class="btn btn--brand" type="button" :disabled="!driverMarkDraft.acceptingTypes.length || !driverMarkDraft.compliance || !driverMarkDraft.vehicleType" @click="saveDriverMark"><Check :size="14" />确认保存</button></template>
    </ModalDialog>

    <ModalDialog v-if="passengerPreviewOpen && section === 'charter-routes'" title="乘客端包车路线预览" eyebrow="PASSENGER PREVIEW" @close="passengerPreviewOpen = false">
      <div class="charter-preview">
        <div class="charter-preview__intro">
          <span>包车出行</span>
          <h3>发现你的下一段英伦旅程</h3>
          <p>以下金额仅供行程咨询时参考，具体车型、日期与路线会影响最终报价。</p>
        </div>
        <div v-if="charterPreviewRows.length" class="charter-preview__list">
          <article v-for="row in charterPreviewRows" :key="row.id" class="charter-preview__card">
            <div>
              <small>{{ row.intro }}</small>
              <h4>{{ row.name }}</h4>
              <p>{{ row.description }}</p>
            </div>
            <footer>
              <div><span>参考价 {{ formatReferencePrice(row.referenceAmount) }} 起</span><small>实际价格以咨询为准</small></div>
              <strong>{{ row.phone }}</strong>
            </footer>
          </article>
        </div>
        <div v-else class="empty-state"><strong>暂无可展示路线</strong><p>启用包车路线后，会在乘客端展示。</p></div>
        <p class="charter-preview__boundary">参考金额仅用于展示，不参与定价、支付、订单或分账。</p>
      </div>
      <template #footer><button class="btn btn--secondary" type="button" @click="passengerPreviewOpen = false">关闭预览</button></template>
    </ModalDialog>

    <ModalDialog v-if="deleteTarget && (section === 'charter-routes' || section === 'vehicle-types' || section === 'geofences' || section === 'coupons' || section === 'campaigns' || section === 'value-added-services' || section === 'banners' || section === 'notices' || section === 'carpool-copy')" :title="section === 'vehicle-types' ? '删除车型' : section === 'geofences' ? '删除围栏' : section === 'coupons' ? '删除优惠券' : section === 'campaigns' ? '删除活动' : section === 'value-added-services' ? '删除增值服务' : section === 'banners' ? '删除 Banner' : section === 'notices' ? '删除公告' : section === 'carpool-copy' ? '删除默认语' : '确认删除包车路线'" :eyebrow="section === 'vehicle-types' ? 'DELETE VEHICLE TYPE' : section === 'geofences' ? 'DELETE GEOFENCE' : section === 'coupons' ? 'DELETE COUPON' : section === 'campaigns' ? 'DELETE CAMPAIGN' : section === 'value-added-services' ? 'DELETE SERVICE' : section === 'banners' ? 'DELETE BANNER' : section === 'notices' ? 'DELETE NOTICE' : section === 'carpool-copy' ? 'DELETE CARPOOL COPY' : 'DELETE ROUTE'" @close="deleteTarget = null">
      <div class="delete-confirmation">
        <span><Trash2 :size="20" /></span>
        <div>
          <strong>{{ deleteTarget.name ?? deleteTarget.title ?? deleteTarget.node ?? deleteTarget.content }}</strong>
          <p v-if="section === 'vehicle-types' && (vehicleDeleteUsage.routes > 0 || vehicleDeleteUsage.drivers > 0)">该车型存在关联业务，无法删除。当前关联 {{ vehicleDeleteUsage.routes }} 条路线、{{ vehicleDeleteUsage.drivers }} 名司机；可先禁用，历史定价和进行中订单不受影响。</p>
          <p v-else-if="section === 'vehicle-types'">该车型尚未被路线定价或司机认证引用，可以删除。删除后不可恢复。</p>
          <p v-else-if="section === 'geofences' && Number(deleteTarget.routeCount ?? 0) > 0">该围栏存在 {{ deleteTarget.routeCount }} 条关联路线，无法删除。可先禁用；存量路线与已有订单不受影响。</p>
          <p v-else-if="section === 'geofences'">该围栏未被任何路线用作起点或终点，可以删除。删除后不可恢复。</p>
          <p v-else-if="section === 'coupons' && Number(deleteTarget.issuedQuantity ?? 0) > 0">该券已有 {{ Number(deleteTarget.issuedQuantity).toLocaleString('en-GB') }} 张发放记录，不能删除。请改为禁用；已发到用户账户的券不受影响。</p>
          <p v-else-if="section === 'coupons'">该券尚无发放记录，可以删除。删除后不可恢复。</p>
          <p v-else-if="section === 'campaigns' && deleteTarget.status !== '下架'">仅下架状态的活动可删除，请先执行下架操作。</p>
          <p v-else-if="section === 'campaigns'">该活动当前为下架状态，删除后不再参与奖励触发，且不可恢复。</p>
          <p v-else-if="section === 'value-added-services' && deleteTarget.businessLinked === true">该服务已与业务及历史订单关联，不允许删除；可改为禁用。</p>
          <p v-else-if="section === 'value-added-services'">该项为线下服务，可以删除。删除后将从当前原型列表与乘客端可选项中移除。</p>
          <p v-else-if="section === 'banners'">删除后，该 Banner 将从当前后台列表和投放配置中移除。已产生的历史曝光数据不受影响。</p>
          <p v-else-if="section === 'notices'">删除后，该公告将从当前后台列表与各发布端移除，且不可恢复。</p>
          <p v-else-if="section === 'carpool-copy'">删除后，该默认语将从对应生效端与行程节点的快捷发送列表中移除，且不可恢复。</p>
          <p v-else>删除后，该路线将从后台列表与乘客端展示中移除。当前原型不会保留这条路线记录。</p>
        </div>
      </div>
      <template #footer><button class="btn btn--secondary" type="button" @click="deleteTarget = null">取消</button><button class="btn btn--danger" type="button" :disabled="(section === 'vehicle-types' && (vehicleDeleteUsage.routes > 0 || vehicleDeleteUsage.drivers > 0)) || (section === 'geofences' && Number(deleteTarget.routeCount ?? 0) > 0) || (section === 'coupons' && Number(deleteTarget.issuedQuantity ?? 0) > 0) || (section === 'campaigns' && deleteTarget.status !== '下架') || (section === 'value-added-services' && deleteTarget.businessLinked === true)" @click="confirmDelete">确认删除</button></template>
    </ModalDialog>

    <ModalDialog v-if="vehicleRoutesTarget && section === 'vehicle-types'" :title="`${vehicleRoutesTarget.name} · 关联路线`" eyebrow="ROUTE DEPENDENCIES" @close="vehicleRoutesTarget = null">
      <div class="relation-summary"><span>{{ vehicleRoutesTarget.id }}</span><div><strong>配置引用 {{ vehicleRoutesTarget.routeCount }} 次</strong><p>以下展示当前原型数据中可查看的路线；正式环境将由接口返回完整清单。</p></div></div>
      <div v-if="linkedRoutesForVehicle.length" class="relation-list">
        <article v-for="routeRow in linkedRoutesForVehicle" :key="routeRow.id"><div><strong>{{ routeRow.name }}</strong><small class="mono">{{ routeRow.id }} · {{ routeRow.fences }}</small></div><StatusBadge :label="String(routeRow.status)" :tone="statusTone(routeRow.status)" dot /></article>
      </div>
      <div v-else class="empty-state"><strong>原型数据暂无路线明细</strong><p>关联数量来自业务快照，完整路线清单将在接口接入后返回。</p></div>
      <template #footer><button class="btn btn--secondary" type="button" @click="vehicleRoutesTarget = null">关闭</button></template>
    </ModalDialog>

    <ModalDialog v-if="geofenceRoutesTarget && section === 'geofences'" :title="`${geofenceRoutesTarget.name} · 关联路线`" eyebrow="GEOFENCE DEPENDENCIES" @close="geofenceRoutesTarget = null">
      <div class="relation-summary"><span>{{ geofenceRoutesTarget.id }}</span><div><strong>被 {{ geofenceRoutesTarget.routeCount }} 条路线引用</strong><p>围栏可能作为路线起点或终点；存在引用时禁止删除。</p></div></div>
      <div v-if="linkedRoutesForGeofence.length" class="relation-list">
        <article v-for="routeRow in linkedRoutesForGeofence" :key="routeRow.id"><div><strong>{{ routeRow.name }}</strong><small class="mono">{{ routeRow.id }} · {{ routeRow.startFenceId === geofenceRoutesTarget.id ? '作为起点围栏' : '作为终点围栏' }}</small></div><StatusBadge :label="String(routeRow.status)" :tone="statusTone(routeRow.status)" dot /></article>
      </div>
      <div v-else class="empty-state"><strong>原型数据暂无完整路线明细</strong><p>关联数量来自业务快照，正式环境将由接口返回完整清单。</p></div>
      <template #footer><button class="btn btn--secondary" type="button" @click="geofenceRoutesTarget = null">关闭</button></template>
    </ModalDialog>

    <ModalDialog v-if="confirmSettingsSave" title="确认保存配置" eyebrow="CONFIGURATION REVIEW" @close="confirmSettingsSave = false">
      <div class="save-confirmation"><span><Save :size="21" /></span><div><strong>即将更新「{{ pageMeta.title }}」</strong><p>新配置会按页面标注的生效范围应用，系统将记录操作人、保存时间和变更前后值。</p></div></div>
      <template #footer>
        <button class="btn btn--secondary" type="button" @click="confirmSettingsSave = false">继续检查</button><button class="btn btn--brand" type="button" @click="saveSettings"><Check :size="14" />确认保存并生效</button>
      </template>
    </ModalDialog>

    <ModalDialog v-if="settingsHistoryOpen && config.kind === 'settings'" :title="`${pageMeta.title}·修改记录`" eyebrow="CONFIGURATION AUDIT LOG" size="wide" @close="settingsHistoryOpen = false">
      <div class="settings-history-summary">
        <span>{{ currentSettingsHistory.length }} 条记录</span>
        <p>按保存时间倒序展示，每个变更项独立记录操作人、前后值和生效范围。</p>
      </div>
      <div class="settings-history-table-wrap">
        <table class="data-table settings-history-table">
          <thead><tr><th>日志ID</th><th>操作时间</th><th>操作人</th><th>配置项</th><th>修改前</th><th>修改后</th><th>生效范围</th><th>IP 地址</th></tr></thead>
          <tbody><tr v-for="record in currentSettingsHistory" :key="record.id"><td class="mono">{{ record.id }}</td><td>{{ record.operatedAt }}</td><td>{{ record.operator }}</td><td><strong>{{ record.item }}</strong></td><td>{{ record.before }}</td><td class="settings-history-after">{{ record.after }}</td><td>{{ record.scope }}</td><td class="mono">{{ record.ip }}</td></tr></tbody>
        </table>
      </div>
      <div v-if="!currentSettingsHistory.length" class="empty-state"><strong>暂无修改记录</strong><p>配置保存后，变更内容将自动写入此处。</p></div>
      <template #footer><button class="btn btn--secondary" type="button" @click="settingsHistoryOpen = false">关闭</button></template>
    </ModalDialog>
  </div>

  <section v-else class="surface-panel module-fallback">
    <span><SlidersHorizontal :size="22" /></span><h1>模块配置未找到</h1><p>导航标识与页面配置不一致，请返回数据驾驶舱后重新进入。</p><button class="btn btn--primary" type="button" @click="router.push('/dashboard')">返回数据驾驶舱</button>
  </section>
</template>

<style scoped>
.module-overview { display: grid; grid-template-columns: minmax(240px, .72fr) minmax(0, 1.8fr); align-items: stretch; padding: 22px; margin-bottom: 16px; gap: 18px; color: #fff; }
.module-overview--fleet { grid-template-columns: minmax(220px, .58fr) minmax(0, 2.15fr); }
.module-overview--without-insight { grid-template-columns: 1fr; }
.module-overview > * { position: relative; z-index: 1; }
.module-overview__insight { display: flex; min-width: 0; flex-direction: column; justify-content: center; padding: 4px 5px; }
.module-overview__insight > span { display: flex; align-items: center; gap: 5px; color: var(--brand-light); font-family: var(--font-mono); font-size: 9px; letter-spacing: .08em; }
.module-overview__insight h2 { margin: 7px 0 4px; font-family: var(--font-display); font-size: 18px; line-height: 1.35; }
.module-overview__insight p { max-width: 390px; margin: 0; color: var(--ink-300); font-size: 10px; line-height: 1.55; }
.module-overview__insight small { margin-top: 9px; color: rgba(255,255,255,.48); font-family: var(--font-mono); font-size: 8px; }
.module-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)); gap: 8px; }
.module-metric { display: flex; min-width: 0; min-height: 96px; flex-direction: column; align-items: flex-start; justify-content: center; padding: 14px; border: 1px solid rgba(227,237,245,.12); border-radius: var(--radius-lg); background: rgba(255,255,255,.045); color: #fff; text-align: left; cursor: default; opacity: 1; }
.module-metric.is-clickable { cursor: pointer; }
.module-metric.is-clickable:hover { border-color: rgba(255,149,0,.45); background: rgba(255,255,255,.09); }
.module-metric > span { color: var(--ink-300); font-size: 9px; }
.module-metric strong { margin: 3px 0 1px; font-family: var(--font-display); font-size: 23px; font-weight: 800; letter-spacing: -.02em; }
.module-metric small { overflow: hidden; max-width: 100%; color: rgba(255,255,255,.46); font-size: 8px; text-overflow: ellipsis; white-space: nowrap; }
.module-metric--brand strong { color: var(--brand-light); }
.module-metric--success strong { color: #4ade80; }
.module-metric--warning strong { color: #fb923c; }
.module-metric--danger strong { color: #fca5a5; }
.fleet-metric-groups { display: grid; min-width: 0; grid-template-columns: minmax(112px, .72fr) minmax(0, 2fr) minmax(0, 1.34fr); align-items: stretch; gap: 8px; }
.fleet-metric-group { display: flex; min-width: 0; flex-direction: column; gap: 6px; }
.fleet-metric-group__title { color: rgba(255,255,255,.5); font-family: var(--font-mono); font-size: 8px; letter-spacing: .08em; }
.fleet-metric-group__items { display: grid; min-width: 0; flex: 1; grid-template-columns: repeat(auto-fit, minmax(82px, 1fr)); gap: 6px; }
.fleet-metric-group .module-metric { min-height: 82px; padding: 11px; }
.fleet-metric-group .module-metric strong { font-size: 20px; }
.fleet-list-heading { display: flex; align-items: flex-end; justify-content: space-between; padding: 0 2px 10px; gap: 24px; }
.fleet-list-heading span { color: var(--ink-500); font-family: var(--font-mono); font-size: 8px; letter-spacing: .08em; }
.fleet-list-heading h2 { margin: 2px 0 0; color: var(--text-strong); font-family: var(--font-display); font-size: 15px; }
.fleet-list-heading p { max-width: 580px; margin: 0; color: var(--text-faint); font-size: 9px; line-height: 1.55; text-align: right; }
.module-filter-bar { margin-top: 0; }
.module-filter-bar--advanced { display: block; padding: 16px; }
.advanced-filter-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
.advanced-filter-grid--finance { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.advanced-filter-grid--compact { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.advanced-filter-grid--geofence { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.advanced-filter-grid--route { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.advanced-filter-grid--charter { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.advanced-filter-grid--coupon { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.advanced-filter-grid--coupon-grant { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.advanced-filter-grid--campaign { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.advanced-filter-grid--value-added-service { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.advanced-filter-grid--banner { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.advanced-filter-grid--notice { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.advanced-filter-grid--service-ticket { grid-template-columns: repeat(5, minmax(0, 1fr)); }
.filter-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.filter-field > span { color: var(--text-subtle); font-size: 9px; font-weight: 700; }
.filter-field .field-control { width: 100%; min-width: 0; }
.filter-field--range { grid-column: span 2; }
.filter-field--range > div { display: flex; min-width: 0; align-items: center; gap: 7px; }
.filter-field--range > div .field-control { min-width: 0; flex: 1; }
.filter-field--range > div i { color: var(--text-faint); font-size: 9px; font-style: normal; }
.advanced-filter-actions { display: flex; align-items: center; min-height: 38px; margin-top: 14px; gap: 8px; }
.settlement-stat-filter { display: flex; align-items: center; gap: 8px; }
.settlement-stat-filter__periods { display: flex; padding: 3px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--page); box-shadow: var(--shadow-sm); }
.settlement-stat-filter__periods button { min-width: 43px; height: 30px; padding: 0 10px; border: 0; border-radius: var(--radius-pill); background: transparent; color: var(--text-faint); font-size: 9px; font-weight: 750; cursor: pointer; transition: color var(--motion-fast), background var(--motion-fast), box-shadow var(--motion-fast); }
.settlement-stat-filter__periods button:hover:not(.is-active) { color: var(--ink-700); background: var(--ink-50); }
.settlement-stat-filter__periods button.is-active { background: var(--ink-700); color: #fff; box-shadow: var(--shadow-sm); }
.settlement-stat-filter__range { display: flex; align-items: center; padding: 3px; gap: 5px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); box-shadow: var(--shadow-sm); }
.settlement-stat-filter__range input { width: 112px; height: 30px; padding: 0 9px; border: 0; border-radius: var(--radius-pill); outline: 0; background: var(--page); color: var(--text-subtle); font-size: 8px; }
.settlement-stat-filter__range i { color: var(--text-faint); font-size: 8px; font-style: normal; }
.settlement-stat-filter__range button { height: 30px; padding: 0 12px; border: 0; border-radius: var(--radius-pill); background: var(--brand); color: #fff; font-size: 8px; font-weight: 800; cursor: pointer; }
.result-count { color: var(--text-faint); font-family: var(--font-mono); font-size: 10px; white-space: nowrap; }
.result-count strong { color: var(--ink-700); }
.module-data-table { min-width: 1080px; }
.module-data-table--vehicle { min-width: 1640px; }
.module-data-table--vehicle th:last-child,
.module-data-table--vehicle td:last-child { position: static; width: auto; min-width: 250px; box-shadow: none; }
.module-data-table--geofence { min-width: 1220px; }
.module-data-table--geofence th:last-child,
.module-data-table--geofence td:last-child { position: static; width: auto; min-width: 250px; box-shadow: none; }
.module-data-table--route { min-width: 1320px; }
.module-data-table--route th:last-child,
.module-data-table--route td:last-child { position: static; width: auto; min-width: 280px; box-shadow: none; }
.module-data-table--exception { min-width: 2050px; }
.module-data-table--exception th:last-child,
.module-data-table--exception td:last-child { position: static; width: auto; min-width: 240px; box-shadow: none; }
.table-thumbnail { display: block; width: 104px; height: 58px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); object-fit: cover; }
.table-description { display: -webkit-box; overflow: hidden; color: var(--text-muted); font-size: 9px; line-height: 1.55; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.vehicle-grade { display: inline-flex; min-height: 22px; align-items: center; padding: 0 8px; border: 1px solid #bfd5e8; border-radius: var(--radius-pill); background: #f1f7fc; color: var(--ink-600); font-size: 9px; font-weight: 700; }
.table-primary-cell strong { display: block; color: var(--text-strong); font-family: var(--font-display); font-size: 11px; }
.table-primary-cell small { display: block; margin-top: 2px; color: var(--text-faint); font-size: 9px; }
.rating-link { padding: 0; border: 0; background: transparent; color: var(--brand-dark); font-family: var(--font-mono); font-size: 10px; font-weight: 700; cursor: pointer; }
.rating-link:hover { color: var(--brand); text-decoration: underline; text-underline-offset: 3px; }
.relation-link { padding: 0; border: 0; background: transparent; color: var(--ink-600); font-family: var(--font-mono); font-size: 10px; font-weight: 700; }
.relation-link:hover { color: var(--brand-dark); text-decoration: underline; text-underline-offset: 3px; }
.progress-cell { display: flex; align-items: center; min-width: 105px; gap: 7px; }
.progress-cell > span { overflow: hidden; width: 64px; height: 5px; border-radius: var(--radius-pill); background: var(--ink-100); }
.progress-cell i { display: block; max-width: 100%; height: 100%; border-radius: inherit; background: var(--brand); }
.progress-cell strong { color: var(--text-muted); font-family: var(--font-mono); font-size: 9px; }
.table-pagination-controls { display: flex; align-items: center; gap: 10px; }
.page-size-select { height: 28px; padding: 0 7px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--text-muted); font-size: 9px; }
.dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.75fr) minmax(230px, .68fr); margin-bottom: 16px; gap: 16px; }
.trend-panel { padding: 19px 20px 16px; }
.panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.panel-heading span { color: var(--ink-500); font-family: var(--font-mono); font-size: 8px; letter-spacing: .08em; }
.panel-heading h3 { margin: 3px 0 0; color: var(--text-strong); font-family: var(--font-display); font-size: 14px; }
.panel-heading > small { max-width: 220px; color: var(--text-faint); font-size: 9px; text-align: right; }
.trend-chart { display: flex; height: 190px; align-items: flex-end; padding-top: 22px; gap: 9px; }
.trend-chart__item { display: grid; height: 100%; min-width: 28px; flex: 1; grid-template-rows: 18px 1fr 18px; align-items: end; gap: 3px; text-align: center; }
.trend-chart__item > span { color: var(--text-muted); font-family: var(--font-mono); font-size: 8px; }
.trend-chart__item > div { display: flex; height: 100%; align-items: flex-end; justify-content: center; border-bottom: 1px solid var(--border); }
.trend-chart__item i { display: block; width: min(30px, 62%); min-height: 8px; border-radius: 5px 5px 1px 1px; background: linear-gradient(180deg, var(--brand-light), var(--brand)); box-shadow: 0 5px 12px rgba(245,124,0,.18); }
.trend-chart__item small { color: var(--text-faint); font-size: 8px; }
.capacity-breakdown { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.capacity-breakdown article { display: flex; min-height: 104px; flex-direction: column; justify-content: center; padding: 14px; border-left: 3px solid var(--ink-300); }
.capacity-breakdown span { color: var(--text-faint); font-size: 9px; }
.capacity-breakdown strong { color: var(--text-strong); font-family: var(--font-display); font-size: 20px; }
.capacity-breakdown small { color: var(--text-faint); font-size: 8px; }
.capacity-breakdown--brand { border-left-color: var(--brand) !important; }
.capacity-breakdown--success { border-left-color: var(--success) !important; }
.capacity-breakdown--warning { border-left-color: var(--warning) !important; }
.capacity-breakdown--danger { border-left-color: var(--danger) !important; }
.settings-meta { display: flex; align-items: center; padding: 14px 18px; margin-bottom: 16px; gap: 0; }
.settings-meta > div { min-width: 170px; padding-right: 28px; margin-right: 28px; border-right: 1px solid var(--border); }
.settings-meta span { display: block; color: var(--text-faint); font-size: 8px; }
.settings-meta strong { display: block; margin-top: 2px; color: var(--text-strong); font-size: 10px; }
.settings-meta > .badge { margin-left: auto; }
.settings-history-summary { display: flex; align-items: center; justify-content: space-between; padding: 11px 13px; margin-bottom: 12px; gap: 16px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.settings-history-summary > span { padding: 4px 8px; border-radius: var(--radius-pill); background: var(--ink-700); color: #fff; font-family: var(--font-mono); font-size: 8px; font-weight: 700; white-space: nowrap; }
.settings-history-summary p { margin: 0; color: var(--text-faint); font-size: 9px; line-height: 1.5; text-align: right; }
.settings-history-table-wrap { overflow: auto; border: 1px solid var(--border); border-radius: var(--radius-lg); }
.settings-history-table { min-width: 1100px; }
.settings-history-table th:last-child,
.settings-history-table td:last-child { position: static; box-shadow: none; }
.settings-history-table td strong { color: var(--text-strong); font-size: 10px; }
.settings-history-after { color: var(--brand-dark); font-weight: 800; }
.settings-reset { min-height: 30px; padding: 0 8px; margin-left: 6px; font-size: 9px; }
.settings-sections { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.settings-card { overflow: hidden; }
.settings-card__header { display: flex; align-items: flex-start; justify-content: space-between; padding: 17px 18px; border-bottom: 1px solid var(--border); background: var(--page-2); color: var(--ink-500); }
.settings-card__header span { color: var(--ink-500); font-family: var(--font-mono); font-size: 8px; letter-spacing: .08em; }
.settings-card__header h3 { margin: 3px 0 2px; color: var(--text-strong); font-family: var(--font-display); font-size: 13px; }
.settings-card__header p { max-width: 480px; margin: 0; color: var(--text-faint); font-size: 9px; }
.settings-card__fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 18px; gap: 16px; }
.setting-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.setting-field--wide { grid-column: 1 / -1; }
.setting-field > span, .editor-field > span { color: var(--text-subtle); font-size: 9px; font-weight: 700; }
.setting-field > small { color: var(--text-faint); font-size: 8px; line-height: 1.4; }
.setting-control { width: 100%; background: var(--surface); }
.setting-input { display: flex; overflow: hidden; height: 38px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.setting-input:focus-within { border-color: var(--ink-500); box-shadow: 0 0 0 3px rgba(45,99,152,.1); }
.setting-input input { min-width: 0; flex: 1; padding: 0 11px; border: 0; outline: 0; background: transparent; color: var(--text-subtle); font-size: 12px; }
.setting-input b { display: flex; align-items: center; padding: 0 10px; border-left: 1px solid var(--border); background: var(--page-2); color: var(--text-faint); font-size: 9px; font-weight: 600; }
.setting-switch { display: flex; width: 100%; height: 38px; align-items: center; padding: 0 10px; gap: 8px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); color: var(--text-faint); text-align: left; }
.setting-switch i { position: relative; width: 31px; height: 17px; border-radius: var(--radius-pill); background: var(--divider); transition: background var(--motion-fast); }
.setting-switch i::after { position: absolute; top: 3px; left: 3px; width: 11px; height: 11px; border-radius: 50%; background: #fff; box-shadow: var(--shadow-sm); content: ''; transition: transform var(--motion-fast); }
.setting-switch.is-on i { background: var(--success); }
.setting-switch.is-on i::after { transform: translateX(14px); }
.setting-switch em { font-size: 9px; font-style: normal; }
.detail-hero { display: flex; align-items: center; padding: 15px; margin-bottom: 16px; gap: 11px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.detail-hero > span { display: inline-flex; width: 42px; height: 42px; flex: 0 0 42px; align-items: center; justify-content: center; border-radius: 50%; background: var(--ink-700); color: #fff; font-family: var(--font-display); font-size: 11px; font-weight: 800; }
.detail-hero > div { min-width: 0; flex: 1; }
.detail-hero small { color: var(--ink-500); font-family: var(--font-mono); font-size: 7px; }
.detail-hero h3 { margin: 1px 0; color: var(--text-strong); font-family: var(--font-display); font-size: 13px; }
.detail-hero p { margin: 0; color: var(--text-faint); font-size: 8px; }
.detail-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
.detail-grid > div { padding: 11px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.detail-grid > div > span { display: block; color: var(--text-faint); font-size: 8px; }
.detail-grid > div > strong { display: block; overflow-wrap: anywhere; margin-top: 3px; color: var(--text-subtle); font-size: 10px; }
.detail-vehicle-image { display: block; width: 100%; max-width: 280px; height: 142px; margin-top: 7px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); object-fit: cover; }
.geofence-detail-map { overflow: hidden; margin-bottom: 14px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.geofence-detail-map header { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid var(--border); background: var(--page); }
.geofence-detail-map header span { display: block; color: var(--ink-500); font-family: var(--font-mono); font-size: 7px; letter-spacing: .08em; }
.geofence-detail-map header strong { display: block; margin-top: 2px; color: var(--text-strong); font-size: 10px; }
.geofence-detail-map header small { color: var(--text-faint); font-family: var(--font-mono); font-size: 8px; }
.geofence-detail-map svg { display: block; width: 100%; height: 260px; background: #edf3f6; }
.geofence-detail-map svg path { fill: none; stroke: #fff; stroke-width: 2; }
.geofence-detail-map svg polygon { fill: rgba(245,124,0,.2); stroke: var(--brand); stroke-width: .8; stroke-linejoin: round; }
.geofence-detail-map__relation { display: flex; align-items: center; padding: 9px 11px; gap: 8px; border-top: 1px solid var(--border); color: var(--text-muted); font-size: 8px; }
.detail-note { display: flex; align-items: flex-start; padding: 12px; margin-top: 16px; gap: 9px; border: 1px solid #ffd1a3; border-radius: var(--radius-lg); background: var(--brand-50); color: var(--brand-dark); }
.detail-note strong { display: block; font-size: 10px; }
.detail-note p { margin: 2px 0 0; color: var(--text-muted); font-size: 9px; }
.editor-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.editor-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.editor-field--wide { grid-column: 1 / -1; }
.required-mark { color: var(--danger); font-style: normal; }
.editor-field .field-control { width: 100%; }
.editor-money-field { display: flex; overflow: hidden; height: 38px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.editor-money-field:focus-within { border-color: var(--ink-500); box-shadow: 0 0 0 3px rgba(45,99,152,.1); }
.editor-money-field b { display: flex; align-items: center; padding: 0 11px; border-right: 1px solid var(--border); background: var(--page-2); color: var(--text-muted); font-size: 11px; }
.editor-money-field input { min-width: 0; flex: 1; padding: 0 11px; border: 0; outline: 0; background: transparent; color: var(--text-subtle); font-size: 12px; }
.vehicle-image-uploader { position: relative; display: flex; overflow: hidden; min-height: 150px; align-items: center; justify-content: center; border: 1px dashed var(--ink-300); border-radius: var(--radius-lg); background: var(--page); color: var(--ink-600); cursor: pointer; }
.vehicle-image-uploader:hover { border-color: var(--brand); background: var(--brand-50); }
.vehicle-image-uploader > img { width: 100%; height: 180px; object-fit: cover; }
.vehicle-image-uploader > input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.vehicle-image-uploader__empty { display: flex; align-items: center; flex-direction: column; gap: 4px; }
.vehicle-image-uploader__empty b { font-size: 11px; }
.vehicle-image-uploader__empty small { color: var(--text-faint); font-size: 8px; }
.vehicle-image-uploader__replace { position: absolute; right: 10px; bottom: 10px; display: inline-flex; min-height: 28px; align-items: center; padding: 0 10px; gap: 5px; border-radius: var(--radius-pill); background: rgba(8,28,48,.84); color: #fff; font-size: 9px; font-weight: 700; }
.editor-tip { padding: 10px 11px; margin: 16px 0 0; border-radius: var(--radius-md); background: var(--ink-50); color: var(--text-muted); font-size: 9px; }
.charter-preview { display: grid; gap: 14px; }
.charter-preview__intro { padding: 18px; border-radius: var(--radius-lg); background: var(--ink-800); color: #fff; }
.charter-preview__intro > span { color: var(--brand-light); font-family: var(--font-mono); font-size: 8px; letter-spacing: .08em; }
.charter-preview__intro h3 { margin: 5px 0 3px; font-family: var(--font-display); font-size: 17px; }
.charter-preview__intro p { margin: 0; color: rgba(255,255,255,.62); font-size: 9px; line-height: 1.55; }
.charter-preview__list { display: grid; gap: 10px; }
.charter-preview__card { padding: 15px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.charter-preview__card small { color: var(--text-faint); font-size: 8px; }
.charter-preview__card h4 { margin: 3px 0; color: var(--text-strong); font-family: var(--font-display); font-size: 12px; }
.charter-preview__card p { margin: 0; color: var(--text-muted); font-size: 9px; line-height: 1.55; }
.charter-preview__card footer { display: flex; align-items: flex-end; justify-content: space-between; padding-top: 11px; margin-top: 11px; gap: 16px; border-top: 1px solid var(--border); }
.charter-preview__card footer div { display: grid; gap: 2px; }
.charter-preview__card footer span { color: var(--brand-dark); font-family: var(--font-display); font-size: 12px; font-weight: 800; }
.charter-preview__card footer strong { color: var(--ink-600); font-family: var(--font-mono); font-size: 9px; }
.charter-preview__boundary { padding: 10px 12px; margin: 0; border-radius: var(--radius-md); background: var(--brand-50); color: var(--brand-dark); font-size: 9px; }
.delete-confirmation { display: flex; align-items: flex-start; gap: 12px; }
.delete-confirmation > span { display: inline-flex; width: 42px; height: 42px; flex: 0 0 42px; align-items: center; justify-content: center; border-radius: 50%; background: var(--danger-bg); color: var(--danger); }
.delete-confirmation strong { color: var(--text-strong); font-family: var(--font-display); font-size: 12px; }
.delete-confirmation p { margin: 4px 0 0; color: var(--text-muted); font-size: 10px; line-height: 1.55; }
.relation-summary { display: flex; align-items: flex-start; padding: 13px; margin-bottom: 14px; gap: 10px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.relation-summary > span { padding: 4px 7px; border-radius: var(--radius-sm); background: var(--ink-100); color: var(--ink-700); font-family: var(--font-mono); font-size: 9px; font-weight: 700; }
.relation-summary strong { color: var(--text-strong); font-family: var(--font-display); font-size: 12px; }
.relation-summary p { margin: 3px 0 0; color: var(--text-faint); font-size: 9px; }
.relation-list { display: flex; flex-direction: column; gap: 8px; }
.relation-list article { display: flex; align-items: center; justify-content: space-between; padding: 11px 12px; gap: 12px; border: 1px solid var(--border); border-radius: var(--radius-lg); }
.relation-list strong { display: block; color: var(--text-strong); font-size: 11px; }
.relation-list small { display: block; margin-top: 3px; color: var(--text-faint); font-size: 8px; }
.save-confirmation { display: flex; align-items: flex-start; gap: 12px; }
.save-confirmation > span { display: inline-flex; width: 42px; height: 42px; flex: 0 0 42px; align-items: center; justify-content: center; border-radius: 50%; background: var(--brand-100); color: var(--brand-dark); }
.save-confirmation strong { color: var(--text-strong); font-family: var(--font-display); font-size: 12px; }
.save-confirmation p { margin: 4px 0 0; color: var(--text-muted); font-size: 10px; line-height: 1.55; }
.driver-mark-editor-head { display: flex; align-items: center; padding: 12px; margin-bottom: 12px; gap: 9px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.driver-mark-editor-head > span { display: inline-flex; min-width: 66px; min-height: 32px; align-items: center; justify-content: center; padding: 0 8px; border-radius: var(--radius-md); background: var(--ink-700); color: #fff; font-family: var(--font-mono); font-size: 8px; }
.driver-mark-editor-head strong { display: block; color: var(--text-strong); font-size: 11px; }
.driver-mark-editor-head p { margin: 3px 0 0; color: var(--text-faint); font-size: 8px; }
.driver-mark-editor-body { display: grid; gap: 10px; }
.driver-mark-editor-section { padding: 13px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.driver-mark-editor-section label { display: flex; align-items: center; justify-content: space-between; color: var(--text-strong); font-size: 10px; font-weight: 800; }
.driver-mark-editor-section label b { color: var(--brand-dark); font-size: 8px; }
.driver-mark-editor-section > .field-control { width: 100%; margin-top: 9px; }
.driver-mark-editor-section p { margin: 8px 0 0; color: var(--text-faint); font-size: 8px; line-height: 1.5; }
.driver-mark-options { display: flex; margin-top: 10px; gap: 7px; }
.driver-mark-options button { min-width: 82px; min-height: 32px; padding: 0 12px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--text-muted); font-size: 9px; font-weight: 700; }
.driver-mark-options button.is-selected { border-color: var(--brand); background: var(--brand-100); color: var(--brand-dark); box-shadow: inset 0 0 0 1px var(--brand); }
.module-fallback { display: flex; min-height: 420px; flex-direction: column; align-items: center; justify-content: center; padding: 32px; color: var(--text-faint); text-align: center; }
.module-fallback > span { display: inline-flex; width: 52px; height: 52px; align-items: center; justify-content: center; border-radius: 50%; background: var(--ink-50); color: var(--ink-600); }
.module-fallback h1 { margin: 12px 0 2px; color: var(--text-strong); font-family: var(--font-display); font-size: 20px; }
.module-fallback p { margin: 0 0 16px; font-size: 11px; }
@media (max-width: 1100px) {
  .module-overview { grid-template-columns: 1fr; }
  .advanced-filter-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .settlement-stat-filter { align-items: flex-start; flex-direction: column; }
  .settlement-stat-filter__range { flex-wrap: wrap; }
  .dashboard-grid { grid-template-columns: 1fr; }
  .capacity-breakdown { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .settings-sections { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .module-overview { padding: 16px; }
  .module-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .fleet-metric-groups { grid-template-columns: 1fr; }
  .fleet-list-heading { align-items: flex-start; flex-direction: column; gap: 4px; }
  .fleet-list-heading p { max-width: none; text-align: left; }
  .advanced-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .settlement-stat-filter__range input { width: 104px; }
  .advanced-filter-actions { align-items: stretch; flex-wrap: wrap; }
  .advanced-filter-actions .filter-bar__spacer { display: none; }
  .capacity-breakdown { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .settings-meta { align-items: flex-start; flex-wrap: wrap; gap: 10px; }
  .settings-meta > div { min-width: calc(50% - 8px); padding: 0; margin: 0; border: 0; }
  .settings-meta > .badge { margin-left: 0; }
  .settings-reset { margin-left: 0; }
}
@media (max-width: 520px) {
  .module-metrics, .settings-card__fields, .editor-grid, .detail-grid { grid-template-columns: 1fr; }
  .setting-field--wide { grid-column: auto; }
  .trend-panel { overflow-x: auto; }
  .trend-chart { min-width: 520px; }
}
</style>
