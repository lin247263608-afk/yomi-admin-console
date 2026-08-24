<script setup lang="ts">
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
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
import RoutePricingEditor from '@/components/modules/RoutePricingEditor.vue'
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

const rows = ref<ModuleRow[]>([])
const searchTerm = ref('')
const activeFilters = reactive<Record<string, string>>({})
const userSearchDraft = reactive<UserSearchFields>(createEmptyUserSearch())
const userSearchApplied = reactive<UserSearchFields>(createEmptyUserSearch())
const driverSearchDraft = reactive<DriverSearchFields>(createEmptyDriverSearch())
const driverSearchApplied = reactive<DriverSearchFields>(createEmptyDriverSearch())
const currentPage = ref(1)
const pageSize = ref<20 | 50 | 100>(20)
const selectedRow = ref<ModuleRow | null>(null)
const driverDetailInitialTab = ref<'profile' | 'reviews'>('profile')
const editTarget = ref<ModuleRow | null>(null)
const editMode = ref<'create' | 'edit' | null>(null)
const editDraft = reactive<Record<string, string>>({})
const deleteTarget = ref<ModuleRow | null>(null)
const passengerPreviewOpen = ref(false)
const settingsDraft = reactive<Record<string, string | boolean>>({})
const settingsBaseline = ref<Record<string, string | boolean>>({})
const confirmSettingsSave = ref(false)
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

function initializeModule() {
  rows.value = (config.value?.rows ?? []).map((row) => ({ ...row }))
  searchTerm.value = ''
  resetUserSearchState()
  resetDriverSearchState()
  clearRecord(activeFilters)
  config.value?.filters?.forEach((filter) => {
    activeFilters[filter.key] = '全部'
  })
  currentPage.value = 1
  selectedRow.value = null
  deleteTarget.value = null
  passengerPreviewOpen.value = false
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
  lastSavedAt.value = savedAtBySection[section.value] ?? '2026-08-18 14:32'
  lastRefreshAt.value = '刚刚'
}

watch(section, initializeModule, { immediate: true })

const visibleColumns = computed(() => config.value?.columns ?? [])
const draftColumns = computed(() => {
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
  if (section.value === 'users' && (metric.filter.key === 'identity' || metric.filter.key === 'status')) {
    userSearchDraft[metric.filter.key] = metric.filter.value
    applyUserSearch()
    return
  }
  if (section.value === 'drivers' && (metric.filter.key === 'compliance' || metric.filter.key === 'status')) {
    driverSearchDraft[metric.filter.key] = metric.filter.value
    applyDriverSearch()
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
  if (section.value === 'charter-routes') {
    passengerPreviewOpen.value = true
    return
  }
  if (config.value.kind === 'settings') {
    const action = config.value.secondaryAction ?? '查看修改记录'
    if (action.includes('撤销')) resetSettings()
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
  return (config.value?.filters?.find((filter) => filter.key === column.key)?.options ?? [])
    .filter((option) => option !== '全部')
}

function isDraftFieldRequired(column: ModuleColumn) {
  return section.value === 'charter-routes'
    && ['name', 'intro', 'description', 'referenceAmount', 'phone'].includes(column.key)
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
  clearRecord(editDraft)
  draftColumns.value.forEach((column) => {
    editDraft[column.key] = String(row[column.key] ?? '')
  })
  editTarget.value = row
  editMode.value = 'edit'
}

function saveRow() {
  const values = Object.fromEntries(draftColumns.value.map((column) => {
    const draftValue = editDraft[column.key] ?? ''
    return [column.key, column.kind === 'currency' ? Number(draftValue) : draftValue]
  }))
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
    const generatedId = `${section.value.toUpperCase().slice(0, 4)}-${Date.now().toString().slice(-6)}`
    const id = editDraft.id?.trim() || generatedId
    rows.value.unshift({ ...values, id, status: String(values.status || '启用') })
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
  closeEditor()
}

function requestDelete(row: ModuleRow) {
  if (section.value !== 'charter-routes') return
  deleteTarget.value = row
}

function confirmDelete() {
  if (section.value !== 'charter-routes' || !deleteTarget.value) return
  const deletedRow = deleteTarget.value
  rows.value = rows.value.filter((row) => row.id !== deletedRow.id)
  if (config.value) config.value.rows = rows.value.map((row) => ({ ...row }))
  if (selectedRow.value?.id === deletedRow.id) selectedRow.value = null
  deleteTarget.value = null
  appStore.notify('包车路线已删除', `${deletedRow.id} · ${String(deletedRow.name ?? '')} 已从当前路线列表中移除。`, 'success')
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

function rowActionLabel(row: ModuleRow) {
  const action = config.value?.rowAction
  if (!action) return ''
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

function performRowAction(row: ModuleRow) {
  const action = config.value?.rowAction
  if (!action) return
  const actionLabel = rowActionLabel(row)
  if (section.value === 'feedback') {
    const flow = ['待处理', '已接收', '处理中', '已完结']
    const next = flow[flow.indexOf(String(row.status)) + 1]
    if (next) row.status = next
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

function saveSettings() {
  syncBusinessConfig()
  settingsBaseline.value = { ...settingsDraft }
  lastSavedAt.value = new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date()).replaceAll('/', '-')
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
      <div v-if="config.showSecondaryAction !== false || config.primaryAction" class="page-header__actions">
        <button v-if="config.showSecondaryAction !== false" class="btn btn--secondary" type="button" @click="handleSecondaryAction">
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
      class="module-overview dark-panel"
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
      <section v-if="isFleetMonitoring" class="fleet-list-heading">
        <div><span>CAPACITY LIST</span><h2>运力列表</h2></div>
        <p>“今日”按英国运营时区自然日计算；今日收入仅统计已完成订单的司机应得，不代表已到账金额。</p>
      </section>
      <section v-if="section === 'users'" class="filter-bar module-filter-bar module-filter-bar--advanced">
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
          <table class="data-table module-data-table">
            <thead><tr><th v-for="column in visibleColumns" :key="column.key" :style="{ minWidth: column.width }">{{ column.label }}</th><th>操作</th></tr></thead>
            <tbody>
              <tr v-for="row in pagedRows" :key="row.id">
                <td v-for="column in visibleColumns" :key="column.key">
                  <div v-if="column.kind === 'primary'" class="table-primary-cell">
                    <strong>{{ formatCell(row[column.key], column) }}</strong><small v-if="column.secondaryKey">{{ formatCell(row[column.secondaryKey], column) }}</small>
                  </div>
                  <StatusBadge v-else-if="column.kind === 'status'" :label="formatCell(row[column.key], column)" :tone="statusTone(row[column.key])" dot />
                  <div v-else-if="column.kind === 'progress'" class="progress-cell">
                    <span><i :style="{ width: progressWidth(row[column.key]) }"></i></span><strong>{{ formatCell(row[column.key], column) }}</strong>
                  </div>
                  <button v-else-if="isFleetMonitoring && column.key === 'rating'" class="rating-link" type="button" title="查看评价详情" @click="openRowDetail(row, 'reviews')">{{ formatCell(row[column.key], column) }} ★</button>
                  <span v-else :class="{ mono: column.kind === 'mono' || column.kind === 'currency' }">{{ formatCell(row[column.key], column) }}</span>
                </td>
                <td>
                  <div class="table-actions">
                    <button class="table-action" type="button" @click="openRowDetail(row)"><Eye :size="13" />查看</button>
                    <button
                      v-if="config.canEdit !== false"
                      class="table-action"
                      type="button"
                      :disabled="section === 'airport-routes' && row.status === '启用'"
                      :title="section === 'airport-routes' && row.status === '启用' ? '请先禁用路线后再编辑价格配置' : '编辑记录'"
                      @click="openEdit(row)"
                    ><Pencil :size="13" />编辑</button>
                    <button
                      v-if="section === 'drivers' || isFleetMonitoring"
                      class="table-action"
                      :class="{ 'table-action--danger': row.poolState === '开启' }"
                      type="button"
                      @click="toggleDriverPool(row)"
                    >{{ row.poolState === '开启' ? '关闭订单池' : '开启订单池' }}</button>
                    <button v-if="config.rowAction" class="table-action" :class="{ 'table-action--danger': config.rowAction.tone === 'danger' }" type="button" :disabled="rowActionDisabled(row)" @click="performRowAction(row)">{{ rowActionLabel(row) }}</button>
                    <button v-if="section === 'charter-routes'" class="table-action table-action--danger" type="button" @click="requestDelete(row)"><Trash2 :size="13" />删除</button>
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

    <DrawerShell v-else-if="selectedRow" :title="`${pageMeta.title}详情`" :eyebrow="`${config.eyebrow} / DETAIL`" @close="selectedRow = null">
      <div class="detail-hero">
        <span>{{ selectedRow.id.slice(0, 2) }}</span>
        <div><small>RECORD ID</small><h3>{{ selectedRow.id }}</h3><p>该记录来自当前原型业务数据仓，操作结果会在本次会话中保留。</p></div>
        <StatusBadge v-if="selectedRow.status" :label="selectedRow.status" :tone="statusTone(selectedRow.status)" dot />
      </div>
      <div class="detail-grid">
        <div v-for="column in visibleColumns" :key="column.key">
          <template v-if="column.kind === 'status'"><span>{{ column.label }}</span><StatusBadge :label="formatCell(selectedRow[column.key], column)" :tone="statusTone(selectedRow[column.key])" dot /></template>
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

    <ModalDialog v-else-if="editMode" :title="editMode === 'create' ? `新增${pageMeta.title}` : `编辑${pageMeta.title}`" eyebrow="FORM EDITOR" @close="closeEditor">
      <div class="editor-grid">
        <label v-for="column in draftColumns" :key="column.key" class="editor-field">
          <span>{{ column.label }}<em v-if="isDraftFieldRequired(column)" class="required-mark" aria-hidden="true"> *</em></span>
          <select v-if="optionsForColumn(column).length" v-model="editDraft[column.key]" class="field-control"><option v-for="option in optionsForColumn(column)" :key="option" :value="option">{{ option }}</option></select>
          <div v-else-if="column.kind === 'currency'" class="editor-money-field">
            <b>£</b><input v-model="editDraft[column.key]" type="number" step="0.01" :min="isDraftFieldRequired(column) ? '0.01' : undefined" :required="isDraftFieldRequired(column)" :aria-required="isDraftFieldRequired(column)" :placeholder="`请输入${column.label}`" />
          </div>
          <textarea v-else-if="section === 'charter-routes' && ['intro', 'description'].includes(column.key)" v-model="editDraft[column.key]" class="form-textarea" :placeholder="`请输入${column.label}`"></textarea>
          <input v-else v-model="editDraft[column.key]" class="field-control" type="text" :placeholder="`请输入${column.label}`" />
        </label>
      </div>
      <p class="editor-tip">{{ section === 'charter-routes' ? '参考金额为必填项，单位为英镑；仅用于乘客端页面展示，不参与定价、支付、订单或分账。' : '保存后将立即更新当前原型列表，并通过消息提示反馈操作结果。' }}</p>
      <template #footer>
        <button class="btn btn--secondary" type="button" @click="closeEditor">取消</button><button class="btn btn--brand" type="button" @click="saveRow"><Check :size="14" />确认保存</button>
      </template>
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

    <ModalDialog v-if="deleteTarget && section === 'charter-routes'" title="确认删除包车路线" eyebrow="DELETE ROUTE" @close="deleteTarget = null">
      <div class="delete-confirmation">
        <span><Trash2 :size="20" /></span>
        <div><strong>{{ deleteTarget.name }}</strong><p>删除后，该路线将从后台列表与乘客端展示中移除。当前原型不会保留这条路线记录。</p></div>
      </div>
      <template #footer><button class="btn btn--secondary" type="button" @click="deleteTarget = null">取消</button><button class="btn btn--danger" type="button" @click="confirmDelete">确认删除</button></template>
    </ModalDialog>

    <ModalDialog v-if="confirmSettingsSave" title="确认保存配置" eyebrow="CONFIGURATION REVIEW" @close="confirmSettingsSave = false">
      <div class="save-confirmation"><span><Save :size="21" /></span><div><strong>即将更新「{{ pageMeta.title }}」</strong><p>新配置会按页面标注的生效范围应用，系统将记录操作人、保存时间和变更前后值。</p></div></div>
      <template #footer>
        <button class="btn btn--secondary" type="button" @click="confirmSettingsSave = false">继续检查</button><button class="btn btn--brand" type="button" @click="saveSettings"><Check :size="14" />确认保存并生效</button>
      </template>
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
.filter-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.filter-field > span { color: var(--text-subtle); font-size: 9px; font-weight: 700; }
.filter-field .field-control { width: 100%; min-width: 0; }
.advanced-filter-actions { display: flex; align-items: center; min-height: 38px; margin-top: 14px; gap: 8px; }
.result-count { color: var(--text-faint); font-family: var(--font-mono); font-size: 10px; white-space: nowrap; }
.result-count strong { color: var(--ink-700); }
.module-data-table { min-width: 1080px; }
.table-primary-cell strong { display: block; color: var(--text-strong); font-family: var(--font-display); font-size: 11px; }
.table-primary-cell small { display: block; margin-top: 2px; color: var(--text-faint); font-size: 9px; }
.rating-link { padding: 0; border: 0; background: transparent; color: var(--brand-dark); font-family: var(--font-mono); font-size: 10px; font-weight: 700; cursor: pointer; }
.rating-link:hover { color: var(--brand); text-decoration: underline; text-underline-offset: 3px; }
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
.detail-note { display: flex; align-items: flex-start; padding: 12px; margin-top: 16px; gap: 9px; border: 1px solid #ffd1a3; border-radius: var(--radius-lg); background: var(--brand-50); color: var(--brand-dark); }
.detail-note strong { display: block; font-size: 10px; }
.detail-note p { margin: 2px 0 0; color: var(--text-muted); font-size: 9px; }
.editor-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.editor-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.required-mark { color: var(--danger); font-style: normal; }
.editor-field .field-control { width: 100%; }
.editor-money-field { display: flex; overflow: hidden; height: 38px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.editor-money-field:focus-within { border-color: var(--ink-500); box-shadow: 0 0 0 3px rgba(45,99,152,.1); }
.editor-money-field b { display: flex; align-items: center; padding: 0 11px; border-right: 1px solid var(--border); background: var(--page-2); color: var(--text-muted); font-size: 11px; }
.editor-money-field input { min-width: 0; flex: 1; padding: 0 11px; border: 0; outline: 0; background: transparent; color: var(--text-subtle); font-size: 12px; }
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
.save-confirmation { display: flex; align-items: flex-start; gap: 12px; }
.save-confirmation > span { display: inline-flex; width: 42px; height: 42px; flex: 0 0 42px; align-items: center; justify-content: center; border-radius: 50%; background: var(--brand-100); color: var(--brand-dark); }
.save-confirmation strong { color: var(--text-strong); font-family: var(--font-display); font-size: 12px; }
.save-confirmation p { margin: 4px 0 0; color: var(--text-muted); font-size: 10px; line-height: 1.55; }
.module-fallback { display: flex; min-height: 420px; flex-direction: column; align-items: center; justify-content: center; padding: 32px; color: var(--text-faint); text-align: center; }
.module-fallback > span { display: inline-flex; width: 52px; height: 52px; align-items: center; justify-content: center; border-radius: 50%; background: var(--ink-50); color: var(--ink-600); }
.module-fallback h1 { margin: 12px 0 2px; color: var(--text-strong); font-family: var(--font-display); font-size: 20px; }
.module-fallback p { margin: 0 0 16px; font-size: 11px; }
@media (max-width: 1100px) {
  .module-overview { grid-template-columns: 1fr; }
  .advanced-filter-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
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
