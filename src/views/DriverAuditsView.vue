<script setup lang="ts">
import { CarFront, Check, FileBadge2, Filter, RefreshCw, Search, ShieldCheck, UserRound, X } from '@lucide/vue'
import { computed, reactive, ref, watch } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import DrawerShell from '@/components/overlay/DrawerShell.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import { driverAudits } from '@/data/mock'
import { moduleCatalog } from '@/data/moduleCatalog'
import { useAppStore } from '@/stores/app'
import type { DriverAudit } from '@/types'
import { formatLondonTime } from '@/utils/format'

const appStore = useAppStore()
const rows = ref<DriverAudit[]>(driverAudits)

interface AuditSearchState {
  driverId: string
  name: string
  phone: string
  plate: string
  email: string
  applicationType: '全部' | DriverAudit['applicationType']
  certificationStatus: '全部' | DriverAudit['certificationStatus']
  submittedFrom: string
  submittedTo: string
}

const searchDraft = reactive<AuditSearchState>({
  driverId: '',
  name: '',
  phone: '',
  plate: '',
  email: '',
  applicationType: '全部',
  certificationStatus: '全部',
  submittedFrom: '',
  submittedTo: '',
})
const appliedSearch = ref<AuditSearchState>({ ...searchDraft })
const pageSize = ref<20 | 50 | 100>(20)
const currentPage = ref(1)
const selectedAudit = ref<DriverAudit | null>(null)
const activeDetailTab = ref<'profile' | 'vehicle' | 'credentials'>('profile')
const approveTarget = ref<DriverAudit | null>(null)
const rejectTarget = ref<DriverAudit | null>(null)
const rejectReason = ref('')
const approvalMarkDraft = reactive({
  acceptingTypes: [] as string[],
  compliance: '' as '' | '合规' | '非合规',
  vehicleType: '',
})
const approvalAcceptingTypeOptions = ['接送机', '包车']
const approvalComplianceOptions: Array<'合规' | '非合规'> = ['合规', '非合规']
const enabledVehicleTypes = computed(() => (moduleCatalog['vehicle-types']?.rows ?? [])
  .filter((row) => row.status === '启用')
  .map((row) => String(row.name ?? ''))
  .filter(Boolean))
const approvalMarksComplete = computed(() => approvalMarkDraft.acceptingTypes.length > 0
  && Boolean(approvalMarkDraft.compliance)
  && Boolean(approvalMarkDraft.vehicleType))

interface AuditDetailExtra {
  avatar: string
  compliance: '合规' | '非合规' | '待判定'
  acceptingType: string
  serviceVehicleType: string
  accountStatus: '正常' | '冻结'
  licenceNumber: string
  licenceExpiresAt: string
  registeredAt: string
  registeredSource: string
  registeredDevice: string
  lastLoginAt: string
  stripeAccount: string
  stripeAccountName: string
  stripeStatus: 'pending' | 'verified' | 'restricted'
  vehicleColor: string
  fuelType: string
  government: string
  operatorHasLicence: boolean
  operatorExpiresAt: string
  operatorName: string
  operatorPhone: string
  operatorEmail: string
  complianceTestExpiresAt: string
  dbsIssuedAt: string
}

const auditDetailExtras: Record<string, AuditDetailExtra> = {
  'AUD-260818-042': {
    avatar: '赵', compliance: '待判定', acceptingType: '待标记', serviceVehicleType: '待标记', accountStatus: '正常',
    licenceNumber: 'DL-GB-1042-4831', licenceExpiresAt: '2027-10-18', registeredAt: '2026-08-18 01:42',
    registeredSource: 'APP-iOS', registeredDevice: 'iPhone 15 · IDFA 8F2A…91C4', lastLoginAt: '2026-08-25 01:58',
    stripeAccount: '待审核通过后创建', stripeAccountName: '赵清和 · YOMI Driver Account', stripeStatus: 'pending',
    vehicleColor: 'Midnight Blue', fuelType: 'Hybrid', government: 'London Borough of Hillingdon',
    operatorHasLicence: true, operatorExpiresAt: '2027-02-28', operatorName: '—', operatorPhone: '—', operatorEmail: '—',
    complianceTestExpiresAt: '2027-01-12', dbsIssuedAt: '2026-05-18',
  },
  'AUD-260818-038': {
    avatar: '沈', compliance: '合规', acceptingType: '接送机', serviceVehicleType: '经济5座', accountStatus: '正常',
    licenceNumber: 'DL-GB-0917-6628', licenceExpiresAt: '2028-04-06', registeredAt: '2025-10-18 14:26',
    registeredSource: 'APP-Android', registeredDevice: 'Pixel 8 · Android ID A91D…20EF', lastLoginAt: '2026-08-25 00:46',
    stripeAccount: 'acct_1YOMI00917', stripeAccountName: '沈佳宁 · YOMI Driver Account', stripeStatus: 'verified',
    vehicleColor: 'Pearl White', fuelType: 'Petrol', government: 'Greater Manchester',
    operatorHasLicence: false, operatorExpiresAt: '—', operatorName: 'Manchester Private Hire Ltd', operatorPhone: '+44 161 496 0821', operatorEmail: 'operator@example.co.uk',
    complianceTestExpiresAt: '2027-01-08', dbsIssuedAt: '2025-09-22',
  },
  'AUD-260817-031': {
    avatar: '高', compliance: '非合规', acceptingType: '接送机、包车', serviceVehicleType: '豪华7座', accountStatus: '正常',
    licenceNumber: 'DL-GB-0308-2195', licenceExpiresAt: '2026-08-21', registeredAt: '2025-09-16 18:05',
    registeredSource: 'APP-Android', registeredDevice: 'Samsung S24 · OAID 72BC…5A10', lastLoginAt: '2026-08-24 22:10',
    stripeAccount: 'acct_1YOMI00308', stripeAccountName: '高朗 · YOMI Driver Account', stripeStatus: 'verified',
    vehicleColor: 'Obsidian Black', fuelType: 'Diesel', government: 'Greater Manchester',
    operatorHasLicence: false, operatorExpiresAt: '—', operatorName: 'YOMI Travel Ltd', operatorPhone: '+44 20 7946 0821', operatorEmail: 'compliance@yomi.travel',
    complianceTestExpiresAt: '2026-08-08', dbsIssuedAt: '2024-11-08',
  },
  'AUD-260817-029': {
    avatar: '何', compliance: '合规', acceptingType: '接送机', serviceVehicleType: '商务7座', accountStatus: '冻结',
    licenceNumber: 'DL-GB-0591-7702', licenceExpiresAt: '2027-02-16', registeredAt: '2026-02-06 08:37',
    registeredSource: 'APP-iOS', registeredDevice: 'iPhone 13 · IDFA 5E81…4B09', lastLoginAt: '2026-08-24 20:41',
    stripeAccount: 'acct_1YOMI00591', stripeAccountName: '何野 · YOMI Driver Account', stripeStatus: 'pending',
    vehicleColor: 'Silver', fuelType: 'Diesel', government: 'West Yorkshire',
    operatorHasLicence: true, operatorExpiresAt: '2027-05-07', operatorName: '—', operatorPhone: '—', operatorEmail: '—',
    complianceTestExpiresAt: '2027-03-18', dbsIssuedAt: '2025-10-13',
  },
}

const selectedExtra = computed(() => selectedAudit.value ? auditDetailExtras[selectedAudit.value.id] : null)

function londonDateKey(iso: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso))
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

const filteredRows = computed(() => {
  const filters = appliedSearch.value
  const textMatches = (rowValue: unknown, queryValue: string) => !queryValue.trim()
    || String(rowValue ?? '').toLowerCase().includes(queryValue.trim().toLowerCase())
  return rows.value.filter((row) => {
    const matchesType = filters.applicationType === '全部' || row.applicationType === filters.applicationType
    const matchesCertification = filters.certificationStatus === '全部' || row.certificationStatus === filters.certificationStatus
    const submittedDate = londonDateKey(row.submittedAt)
    const matchesFrom = !filters.submittedFrom || submittedDate >= filters.submittedFrom
    const matchesTo = !filters.submittedTo || submittedDate <= filters.submittedTo
    return matchesType
      && matchesCertification
      && matchesFrom
      && matchesTo
      && textMatches(row.driverId, filters.driverId)
      && textMatches(row.name, filters.name)
      && textMatches(row.phone, filters.phone)
      && textMatches(row.plate, filters.plate)
      && textMatches(row.email, filters.email)
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))
const pagedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

watch([filteredRows, pageSize], () => {
  currentPage.value = 1
})

const counts = computed(() => ({
  pending: rows.value.filter((row) => row.reviewStatus === '待审核').length,
  stripe: rows.value.filter((row) => row.certificationStatus === '未认证stripe').length,
  rejected: rows.value.filter((row) => row.reviewStatus === '已驳回').length,
  expiring: rows.value.filter((row) => row.credentials.some((credential) => credential.state === 'expiring')).length,
}))

function certificationTone(status: DriverAudit['certificationStatus']) {
  if (status === '已认证') return 'success' as const
  if (status === '未认证stripe') return 'info' as const
  if (status === '已驳回') return 'danger' as const
  return 'warning' as const
}

function reviewTone(status: DriverAudit['reviewStatus']) {
  if (status === '已通过') return 'success' as const
  if (status === '已驳回') return 'danger' as const
  return 'warning' as const
}

function typeTone(type: DriverAudit['applicationType']) {
  if (type === '首次认证') return 'info' as const
  if (type === '个人信息修改申请') return 'coral' as const
  return 'neutral' as const
}

function credentialTone(state: DriverAudit['credentials'][number]['state']) {
  if (state === 'valid') return 'success' as const
  if (state === 'expiring') return 'warning' as const
  return 'danger' as const
}

function credentialLabel(state: DriverAudit['credentials'][number]['state']) {
  if (state === 'valid') return '有效'
  if (state === 'expiring') return '60 天内到期'
  return '已过期'
}

function isChanged(...fieldNames: string[]) {
  if (!selectedAudit.value || selectedAudit.value.applicationType === '首次认证') return false
  return fieldNames.some((name) => selectedAudit.value?.changedFields.includes(name))
}

function detailFieldClass(...fieldNames: string[]) {
  return { 'is-changed': isChanged(...fieldNames) }
}

function applySearch() {
  if (searchDraft.submittedFrom && searchDraft.submittedTo && searchDraft.submittedFrom > searchDraft.submittedTo) {
    appStore.notify('日期范围有误', '提交开始日期不能晚于结束日期。', 'warning')
    return
  }
  appliedSearch.value = { ...searchDraft }
  currentPage.value = 1
}

function openDetail(audit: DriverAudit) {
  selectedAudit.value = audit
  activeDetailTab.value = 'profile'
}

function requestApprove(audit: DriverAudit) {
  selectedAudit.value = null
  approveTarget.value = audit
  approvalMarkDraft.acceptingTypes = []
  approvalMarkDraft.compliance = ''
  approvalMarkDraft.vehicleType = ''
}

function toggleApprovalAcceptingType(type: string) {
  const index = approvalMarkDraft.acceptingTypes.indexOf(type)
  if (index >= 0) approvalMarkDraft.acceptingTypes.splice(index, 1)
  else approvalMarkDraft.acceptingTypes.push(type)
}

function selectApprovalCompliance(type: '合规' | '非合规') {
  approvalMarkDraft.compliance = type
}

function confirmApprove() {
  if (!approveTarget.value) return
  const isFirst = approveTarget.value.applicationType === '首次认证'
  if (isFirst && !approvalMarksComplete.value) return
  if (isFirst) {
    const extra = auditDetailExtras[approveTarget.value.id]
    if (extra) {
      extra.acceptingType = approvalMarkDraft.acceptingTypes.join('、')
      extra.compliance = approvalMarkDraft.compliance || '待判定'
      extra.serviceVehicleType = approvalMarkDraft.vehicleType
    }
  }
  approveTarget.value.reviewStatus = '已通过'
  approveTarget.value.certificationStatus = isFirst ? '未认证stripe' : '已认证'
  appStore.notify(
    isFirst ? '资料审核已通过' : '修改申请已生效',
    isFirst ? '已触发 Stripe Express 入驻流程，等待 KYC。' : '新资料已即时生效，司机接单资格保持不变。',
    'success',
  )
  approveTarget.value = null
}

function requestReject(audit: DriverAudit) {
  selectedAudit.value = null
  rejectTarget.value = audit
  rejectReason.value = ''
}

function confirmReject() {
  if (!rejectTarget.value || !rejectReason.value.trim()) return
  const isFirst = rejectTarget.value.applicationType === '首次认证'
  rejectTarget.value.reviewStatus = '已驳回'
  if (isFirst) rejectTarget.value.certificationStatus = '已驳回'
  appStore.notify(
    '申请已驳回',
    isFirst
      ? '首次认证未通过，原因已记录并推送至司机端。'
      : '修改申请未通过，司机继续沿用原资料并保持已认证。',
    'success',
  )
  rejectTarget.value = null
  rejectReason.value = ''
}

function resetFilters() {
  searchDraft.driverId = ''
  searchDraft.name = ''
  searchDraft.phone = ''
  searchDraft.plate = ''
  searchDraft.email = ''
  searchDraft.applicationType = '全部'
  searchDraft.certificationStatus = '全部'
  searchDraft.submittedFrom = ''
  searchDraft.submittedTo = ''
  appliedSearch.value = { ...searchDraft }
  currentPage.value = 1
}
</script>

<template>
  <div class="audits-page">
    <header class="page-header">
      <div>
        <div class="page-header__eyebrow">USERS / DRIVER AUDITS</div>
        <h1>司机审核</h1>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--refresh" type="button" @click="appStore.notify('审核队列已刷新', '已同步最新提交与 Stripe 认证状态。', 'success')"><RefreshCw :size="15" />刷新队列</button>
      </div>
    </header>

    <section class="audit-summary audit-summary--without-intro dark-panel stats-banner stats-banner--dark">
      <div class="audit-summary__metrics"><div><span>待资料审核</span><strong>{{ counts.pending }}</strong></div><div><span>待 Stripe</span><strong>{{ counts.stripe }}</strong></div><div><span>申请已驳回</span><strong>{{ counts.rejected }}</strong></div><div><span>即将到期</span><strong class="audit-summary__warning">{{ counts.expiring }}</strong></div></div>
    </section>

    <section class="filter-bar audit-filter-bar audit-filter-bar--advanced" @keyup.enter="applySearch">
      <div class="advanced-filter-grid">
        <label class="filter-field"><span>司机ID</span><input v-model="searchDraft.driverId" class="field-control" type="search" placeholder="请输入司机ID" /></label>
        <label class="filter-field"><span>姓名</span><input v-model="searchDraft.name" class="field-control" type="search" placeholder="请输入姓名" /></label>
        <label class="filter-field"><span>手机号</span><input v-model="searchDraft.phone" class="field-control" type="search" placeholder="请输入手机号" /></label>
        <label class="filter-field"><span>车牌号</span><input v-model="searchDraft.plate" class="field-control" type="search" placeholder="请输入车牌号" /></label>
        <label class="filter-field"><span>邮箱</span><input v-model="searchDraft.email" class="field-control" type="search" placeholder="请输入邮箱" /></label>
        <label class="filter-field"><span>提交开始日期</span><input v-model="searchDraft.submittedFrom" class="field-control" type="date" aria-label="提交开始日期" /></label>
        <label class="filter-field"><span>提交结束日期</span><input v-model="searchDraft.submittedTo" class="field-control" type="date" aria-label="提交结束日期" /></label>
        <label class="filter-field"><span>申请类型</span><select v-model="searchDraft.applicationType" class="field-control" aria-label="申请类型"><option value="全部">申请类型：全部</option><option value="首次认证">首次认证</option><option value="个人信息修改申请">个人信息修改申请</option><option value="车辆信息修改申请">车辆信息修改申请</option></select></label>
        <label class="filter-field"><span>认证状态</span><select v-model="searchDraft.certificationStatus" class="field-control" aria-label="认证状态"><option value="全部">认证状态：全部</option><option value="未认证">未认证</option><option value="已驳回">已驳回</option><option value="未认证stripe">未认证stripe</option><option value="已认证">已认证</option></select></label>
      </div>
      <div class="advanced-filter-actions">
        <button class="btn btn--brand" type="button" @click="applySearch"><Search :size="14" />搜索</button>
        <button class="btn btn--ghost" type="button" @click="resetFilters"><X :size="14" />重置</button>
        <div class="filter-bar__spacer"></div>
        <span class="filter-result"><Filter :size="13" />找到 <strong>{{ filteredRows.length }}</strong> 条记录</span>
      </div>
    </section>

    <section class="table-shell">
      <div class="table-scroll">
        <table class="data-table audit-table">
          <thead><tr><th>用户ID</th><th>姓名</th><th>英文名</th><th>手机号</th><th>电子邮箱</th><th>性别</th><th>车牌号</th><th>车型</th><th>申请类型</th><th>认证状态</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.id">
              <td><div class="table-primary mono">{{ row.userId }}</div></td>
              <td><div class="table-primary">{{ row.name }}</div></td>
              <td>{{ row.englishName }}</td>
              <td>{{ row.phone }}</td>
              <td>{{ row.email }}</td>
              <td>{{ row.gender }}</td>
              <td><span class="mono">{{ row.plate }}</span></td>
              <td>{{ row.vehicle }}</td>
              <td><StatusBadge :label="row.applicationType" :tone="typeTone(row.applicationType)" /></td>
              <td><StatusBadge :label="row.certificationStatus" :tone="certificationTone(row.certificationStatus)" dot /></td>
              <td><div class="table-actions"><button class="table-action" type="button" @click="openDetail(row)">详情</button><button v-if="row.reviewStatus === '待审核'" class="table-action" type="button" @click="requestApprove(row)">通过</button><button v-if="row.reviewStatus === '待审核'" class="table-action table-action--danger" type="button" @click="requestReject(row)">驳回</button></div></td>
            </tr>
            <tr v-if="!filteredRows.length"><td colspan="11"><div class="empty-state"><span class="empty-state__icon"><Search :size="20" /></span><strong>没有匹配的审核申请</strong><p>调整搜索关键词或筛选条件后再试。</p></div></td></tr>
          </tbody>
        </table>
      </div>
      <footer class="table-footer"><span>共 {{ filteredRows.length }} 条 · 第 {{ currentPage }} / {{ totalPages }} 页 · 按提交时间倒序</span><div class="pagination"><select v-model="pageSize" class="pagination-size" aria-label="每页条数"><option :value="20">20 条/页</option><option :value="50">50 条/页</option><option :value="100">100 条/页</option></select><button type="button" :disabled="currentPage === 1" @click="currentPage--">‹</button><button v-for="page in totalPages" :key="page" type="button" :class="{ 'is-active': currentPage === page }" @click="currentPage = page">{{ page }}</button><button type="button" :disabled="currentPage === totalPages" @click="currentPage++">›</button></div></footer>
    </section>

    <DrawerShell v-if="selectedAudit" :title="selectedAudit.name" :eyebrow="selectedAudit.id" @close="selectedAudit = null">
      <div class="audit-detail-head">
        <span class="audit-detail-avatar">{{ selectedAudit.name.slice(0, 1) }}</span>
        <div><div class="audit-detail-name"><h3>{{ selectedAudit.name }}</h3><StatusBadge :label="selectedAudit.applicationType" :tone="typeTone(selectedAudit.applicationType)" /></div><p>{{ selectedAudit.englishName }} · {{ selectedAudit.phone }}</p></div>
        <div class="audit-detail-statuses"><StatusBadge :label="selectedAudit.reviewStatus" :tone="reviewTone(selectedAudit.reviewStatus)" dot /><StatusBadge :label="selectedAudit.certificationStatus" :tone="certificationTone(selectedAudit.certificationStatus)" dot /></div>
      </div>

      <div class="change-notice" :class="{ 'change-notice--full': selectedAudit.applicationType === '首次认证' }">
        <span><FileBadge2 :size="16" /></span>
        <div v-if="selectedAudit.applicationType === '首次认证'"><strong>首次认证 · 全量资料审核</strong><p>请依次核对基础信息、车辆信息和全部安全资质，审核结果按整单提交。</p></div>
        <div v-else><strong>{{ selectedAudit.applicationType }} · 本次重点变更</strong><p>{{ selectedAudit.changedFields.join('、') }}；详情中已使用橙色背景和“本次变更”标识突出。</p></div>
      </div>

      <div class="detail-tabs">
        <button type="button" :class="{ 'is-active': activeDetailTab === 'profile' }" @click="activeDetailTab = 'profile'"><UserRound :size="14" />基础信息</button>
        <button type="button" :class="{ 'is-active': activeDetailTab === 'vehicle' }" @click="activeDetailTab = 'vehicle'"><CarFront :size="14" />车辆信息</button>
        <button type="button" :class="{ 'is-active': activeDetailTab === 'credentials' }" @click="activeDetailTab = 'credentials'"><ShieldCheck :size="14" />安全资质</button>
      </div>

      <template v-if="selectedExtra">
        <section v-if="activeDetailTab === 'profile'" class="audit-tab-panel">
          <article class="audit-detail-card">
            <header><div><small>ACCOUNT</small><h3>账号信息</h3></div><UserRound :size="17" /></header>
            <div class="info-grid">
              <div><span>用户ID</span><strong class="mono">{{ selectedAudit.userId }}</strong></div>
              <div><span>车主ID</span><strong class="mono">{{ selectedAudit.driverId }}</strong></div>
              <div :class="detailFieldClass('姓名')"><span>姓名</span><strong>{{ selectedAudit.name }}</strong><em v-if="isChanged('姓名')">本次变更</em></div>
              <div :class="detailFieldClass('英文名')"><span>英文名</span><strong>{{ selectedAudit.englishName }}</strong><em v-if="isChanged('英文名')">本次变更</em></div>
              <div><span>头像</span><strong class="avatar-field"><i>{{ selectedExtra.avatar }}</i>已上传</strong></div>
              <div :class="detailFieldClass('手机号')"><span>手机号</span><strong>{{ selectedAudit.phone }}</strong><em v-if="isChanged('手机号')">本次变更</em></div>
              <div :class="detailFieldClass('电子邮箱', '邮箱')"><span>电子邮箱</span><strong>{{ selectedAudit.email }}</strong><em v-if="isChanged('电子邮箱', '邮箱')">本次变更</em></div>
              <div :class="detailFieldClass('性别')"><span>性别</span><strong>{{ selectedAudit.gender }}</strong><em v-if="isChanged('性别')">本次变更</em></div>
              <div><span>车牌号</span><strong>{{ selectedAudit.plate }}</strong></div>
              <div><span>车型（管理员标记）</span><strong>{{ selectedExtra.serviceVehicleType }}</strong></div>
              <div><span>合规标签</span><StatusBadge :label="selectedExtra.compliance" :tone="selectedExtra.compliance === '合规' ? 'success' : selectedExtra.compliance === '非合规' ? 'danger' : 'warning'" dot /></div>
              <div><span>接单类型</span><strong>{{ selectedExtra.acceptingType }}</strong></div>
              <div><span>状态</span><StatusBadge :label="selectedExtra.accountStatus" :tone="selectedExtra.accountStatus === '正常' ? 'success' : 'danger'" dot /></div>
              <div><span>认证状态</span><StatusBadge :label="selectedAudit.certificationStatus" :tone="certificationTone(selectedAudit.certificationStatus)" dot /></div>
            </div>
          </article>

          <article class="audit-detail-card" :class="detailFieldClass('驾驶证')">
            <header><div><small>DRIVING LICENCE</small><h3>驾驶证</h3></div><FileBadge2 :size="17" /></header>
            <div class="document-preview"><span class="document-preview__canvas"><FileBadge2 :size="32" /><small>DRIVING LICENCE</small></span><div><strong>驾驶证主页照</strong><p>驾驶证号：{{ selectedExtra.licenceNumber }}</p><StatusBadge label="已上传" tone="success" /></div><div class="document-meta"><span>有效结束日期</span><strong>{{ selectedExtra.licenceExpiresAt }}</strong><em v-if="isChanged('驾驶证')">本次变更</em></div></div>
          </article>

          <article class="audit-detail-card">
            <header><div><small>LOGIN AUDIT</small><h3>登录信息</h3></div><ShieldCheck :size="17" /></header>
            <div class="info-grid"><div><span>注册时间</span><strong>{{ selectedExtra.registeredAt }}</strong></div><div><span>注册来源</span><strong>{{ selectedExtra.registeredSource }}</strong></div><div class="info-grid__wide"><span>注册设备</span><strong>{{ selectedExtra.registeredDevice }}</strong></div><div><span>最后登录时间</span><strong>{{ selectedExtra.lastLoginAt }}</strong></div></div>
          </article>

          <article class="audit-detail-card">
            <header><div><small>STRIPE CONNECT</small><h3>Stripe 认证</h3></div><ShieldCheck :size="17" /></header>
            <div class="info-grid"><div><span>账号</span><strong class="mono">{{ selectedExtra.stripeAccount }}</strong></div><div><span>账户名称</span><strong>{{ selectedExtra.stripeAccountName }}</strong></div><div><span>状态</span><StatusBadge :label="selectedExtra.stripeStatus" :tone="selectedExtra.stripeStatus === 'verified' ? 'success' : selectedExtra.stripeStatus === 'restricted' ? 'danger' : 'warning'" dot /></div></div>
          </article>
        </section>

        <section v-else-if="activeDetailTab === 'vehicle'" class="audit-tab-panel">
          <article class="audit-detail-card">
            <header><div><small>VEHICLE PROFILE</small><h3>车辆信息</h3></div><CarFront :size="17" /></header>
            <div class="info-grid"><div :class="detailFieldClass('车牌号')"><span>车牌号</span><strong>{{ selectedAudit.plate }}</strong><em v-if="isChanged('车牌号')">本次变更</em></div><div :class="detailFieldClass('品牌车系', '车型')"><span>品牌车系</span><strong>{{ selectedAudit.vehicle }}</strong><em v-if="isChanged('品牌车系', '车型')">本次变更</em></div><div :class="detailFieldClass('车辆颜色')"><span>车辆颜色</span><strong>{{ selectedExtra.vehicleColor }}</strong><em v-if="isChanged('车辆颜色')">本次变更</em></div><div :class="detailFieldClass('燃油类型')"><span>燃油类型</span><strong>{{ selectedExtra.fuelType }}</strong><em v-if="isChanged('燃油类型')">本次变更</em></div><div class="info-grid__wide" :class="detailFieldClass('所属政府')"><span>所属政府</span><strong>{{ selectedExtra.government }}</strong><em v-if="isChanged('所属政府')">本次变更</em></div></div>
          </article>
          <article class="audit-detail-card">
            <header><div><small>VEHICLE MEDIA</small><h3>车辆照片</h3></div><CarFront :size="17" /></header>
            <div class="vehicle-photos"><div v-for="photo in [{ label: '车辆正面照', keys: ['车辆正面照'] }, { label: '车内前排座椅照', keys: ['车内前排座椅照', '车内前排'] }, { label: '车内后排座椅照', keys: ['车内后排座椅照', '车内后排'] }, { label: '车后备箱照', keys: ['车后备箱照', '后备箱'] }, { label: '车辆 V5C 照', keys: ['车辆 V5C 照', 'V5C'] }]" :key="photo.label" :class="detailFieldClass(...photo.keys)"><CarFront :size="22" /><span>{{ photo.label }}</span><em v-if="isChanged(...photo.keys)">本次变更</em><StatusBadge v-else label="已上传" tone="success" /></div></div>
          </article>
        </section>

        <section v-else class="audit-tab-panel">
          <article class="audit-detail-card" :class="detailFieldClass('Operator 牌照')">
            <header><div><small>OPERATOR LICENCE</small><h3>Operator 牌照</h3></div><ShieldCheck :size="17" /></header>
            <div v-if="selectedExtra.operatorHasLicence" class="document-preview"><span class="document-preview__canvas"><FileBadge2 :size="32" /><small>OPERATOR</small></span><div><strong>牌照照片</strong><p>Operator Licence 已上传</p><StatusBadge label="已上传" tone="success" /></div><div class="document-meta"><span>有效期至</span><strong>{{ selectedExtra.operatorExpiresAt }}</strong></div></div>
            <div v-else class="info-grid"><div class="info-grid__wide"><span>持有牌照</span><strong>否，使用所属 Operator 信息</strong></div><div><span>Operator 名称</span><strong>{{ selectedExtra.operatorName }}</strong></div><div><span>电话</span><strong>{{ selectedExtra.operatorPhone }}</strong></div><div class="info-grid__wide"><span>邮箱</span><strong>{{ selectedExtra.operatorEmail }}</strong></div></div>
          </article>
          <article class="audit-detail-card">
            <header><div><small>SAFETY CREDENTIALS</small><h3>安全资质</h3></div><ShieldCheck :size="17" /></header>
            <div class="credential-list"><article v-for="credential in selectedAudit.credentials" :key="credential.name" :class="[`credential-card--${credential.state}`, detailFieldClass(credential.name, credential.name.replace('Commercial Insurance', '商业险保险单').replace('Compliance Test', '车辆合规检验报告'))]"><span class="credential-icon"><FileBadge2 :size="19" /></span><div><strong>{{ credential.name }}</strong><p>证件照片已上传 · {{ credential.expiresAt ? `有效期至 ${formatLondonTime(credential.expiresAt).split(' ')[0]}` : `签发日期 ${credential.issuedAt ?? '—'}` }}</p><em v-if="isChanged(credential.name, credential.name.replace('Commercial Insurance', '商业险保险单').replace('Compliance Test', '车辆合规检验报告'))">本次变更</em></div><StatusBadge :label="credentialLabel(credential.state)" :tone="credentialTone(credential.state)" dot /></article></div>
          </article>
        </section>
      </template>

      <template #footer>
        <button class="btn btn--secondary" type="button" @click="selectedAudit = null">关闭</button>
        <button v-if="selectedAudit.reviewStatus === '待审核'" class="btn btn--danger" type="button" @click="requestReject(selectedAudit)">不通过</button>
        <button v-if="selectedAudit.reviewStatus === '待审核'" class="btn btn--brand" type="button" @click="requestApprove(selectedAudit)">整单通过</button>
      </template>
    </DrawerShell>

    <ModalDialog v-if="approveTarget" title="确认整单通过" eyebrow="APPROVE APPLICATION" @close="approveTarget = null">
      <div class="review-confirm"><span class="review-confirm__icon review-confirm__icon--success"><Check :size="21" /></span><div><strong>{{ approveTarget.name }} · {{ approveTarget.applicationType }}</strong><p v-if="approveTarget.applicationType === '首次认证'">请先完成三项司机标记。提交后认证状态转为「未认证stripe」，并触发 Stripe Express 入驻。</p><p v-else>通过后新资料即时生效，沿用司机原有的合规类型、服务类型和车型标记。</p></div></div>
      <div v-if="approveTarget.applicationType === '首次认证'" class="driver-mark-form">
        <section class="driver-mark-card">
          <header class="driver-mark-card__head"><span>01</span><div><strong>服务类型</strong><small>选择司机可提供的接单服务</small></div><b>必填 · 至少 1 项</b></header>
          <div class="driver-mark-card__control mark-choice-group"><button v-for="type in approvalAcceptingTypeOptions" :key="type" type="button" :class="{ 'is-selected': approvalMarkDraft.acceptingTypes.includes(type) }" @click="toggleApprovalAcceptingType(type)">{{ type }}</button></div>
          <p class="driver-mark-card__help">“接送机”影响线上派单范围；“包车”仅作运营标签，线下成交。</p>
        </section>
        <section class="driver-mark-card">
          <header class="driver-mark-card__head"><span>02</span><div><strong>合规类型</strong><small>设置运营侧人工合规结论</small></div><b>必填 · 单选</b></header>
          <div class="driver-mark-card__control mark-choice-group"><button v-for="type in approvalComplianceOptions" :key="type" type="button" :class="{ 'is-selected': approvalMarkDraft.compliance === type }" @click="selectApprovalCompliance(type)">{{ type }}</button></div>
          <p class="driver-mark-card__help">与证件有效期状态相互独立；标记“非合规”不会自动冻结接单。</p>
        </section>
        <section class="driver-mark-card">
          <header class="driver-mark-card__head"><span>03</span><div><strong>服务车型</strong><small>指定派单范围与定价档位</small></div><b>必填 · 单选</b></header>
          <div class="driver-mark-card__control"><select v-model="approvalMarkDraft.vehicleType" class="field-control"><option value="">请选择服务车型</option><option v-for="vehicleType in enabledVehicleTypes" :key="vehicleType" :value="vehicleType">{{ vehicleType }}</option></select></div>
          <p v-if="!enabledVehicleTypes.length" class="driver-mark-card__help driver-mark-card__help--danger">请先在车型管理中创建并启用车型。</p><p v-else class="driver-mark-card__help">下拉选项仅包含车型管理中已启用的车型，仅对新订单生效。</p>
        </section>
      </div>
      <template #footer><button class="btn btn--secondary" type="button" @click="approveTarget = null">返回</button><button class="btn btn--brand" type="button" :disabled="approveTarget.applicationType === '首次认证' && !approvalMarksComplete" @click="confirmApprove">提交通过</button></template>
    </ModalDialog>

    <ModalDialog v-if="rejectTarget" title="审核不通过" eyebrow="REJECT APPLICATION" @close="rejectTarget = null">
      <div class="review-confirm"><span class="review-confirm__icon review-confirm__icon--danger"><X :size="21" /></span><div><strong>{{ rejectTarget.name }} · {{ rejectTarget.applicationType }}</strong><p>审核按整单结论驳回，司机可修改资料后重新提交，不限制次数且无冷却期。</p><p v-if="rejectTarget.applicationType !== '首次认证'">本次仅驳回修改申请；司机继续沿用原资料，认证状态保持「已认证」。</p></div></div>
      <label class="form-label" for="reject-reason">不通过原因（必填）</label><textarea id="reject-reason" v-model="rejectReason" class="form-textarea" placeholder="请填写清晰、可执行的修改原因"></textarea>
      <template #footer><button class="btn btn--secondary" type="button" @click="rejectTarget = null">返回</button><button class="btn btn--danger" type="button" :disabled="!rejectReason.trim()" @click="confirmReject">确认驳回并推送</button></template>
    </ModalDialog>
  </div>
</template>

<style scoped>
.audit-summary {
  display: grid;
  grid-template-columns: 1fr;
  padding: 22px 24px;
  margin-bottom: 16px;
  color: #fff;
  gap: 28px;
}

.audit-summary > * { position: relative; z-index: 1; }
.audit-summary__metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.audit-summary__metrics > div { display: flex; min-height: 76px; flex-direction: column; align-items: flex-start; justify-content: center; padding: 12px; gap: 4px; border: 1px solid rgba(227, 237, 245, 0.12); border-radius: var(--radius-lg); background: rgba(255, 255, 255, 0.04); color: var(--ink-300); }
.audit-summary__metrics span { font-size: 9px; }
.audit-summary__metrics strong { color: #fff; font-family: var(--font-display); font-size: 22px; font-weight: 800; }
.audit-summary__warning { color: var(--brand-light) !important; }
.audit-filter-bar--advanced { display: block; padding: 16px; }
.advanced-filter-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; }
.filter-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.filter-field > span { color: var(--text-subtle); font-size: 9px; font-weight: 700; }
.filter-field .field-control { width: 100%; min-width: 0; }
.advanced-filter-actions { display: flex; align-items: center; min-height: 38px; margin-top: 14px; gap: 8px; }
.filter-result { display: inline-flex; align-items: center; color: var(--text-faint); font-family: var(--font-mono); font-size: 10px; gap: 5px; }
.date-field { display: inline-flex; align-items: center; gap: 6px; }
.date-field > span { color: var(--text-faint); font-size: 9px; white-space: nowrap; }
.date-control { min-width: 128px; }
.date-separator { color: var(--text-faint); font-size: 9px; }
.audit-table { min-width: 1380px; }
.pagination-size { height: 28px; padding: 0 7px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); color: var(--text-muted); font-size: 9px; }

.driver-name { display: flex; align-items: center; min-width: 210px; gap: 8px; }
.driver-name > span { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; flex: 0 0 30px; border-radius: 50%; background: var(--ink-100); color: var(--ink-700); font-family: var(--font-display); font-size: 10px; font-weight: 700; }
.driver-name strong { display: block; color: var(--text-strong); font-size: 11px; }
.driver-name small { display: block; color: var(--text-faint); font-size: 8px; }
.change-list { display: flex; max-width: 180px; flex-wrap: wrap; gap: 4px; }
.change-list span { padding: 2px 6px; border: 1px solid #ffd1a3; border-radius: var(--radius-sm); background: var(--brand-100); color: var(--brand-dark); font-size: 8px; font-weight: 700; }

.audit-detail-head { display: flex; align-items: center; padding: 14px; margin-bottom: 14px; gap: 10px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.audit-detail-avatar { display: inline-flex; align-items: center; justify-content: center; width: 46px; height: 46px; flex: 0 0 46px; border-radius: 50%; background: var(--ink-700); color: #fff; font-family: var(--font-display); font-size: 16px; font-weight: 800; }
.audit-detail-head > div { min-width: 0; flex: 1; }
.audit-detail-name { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }
.audit-detail-name h3 { margin: 0; color: var(--text-strong); font-family: var(--font-display); font-size: 15px; }
.audit-detail-head p { margin: 2px 0 0; color: var(--text-faint); font-size: 9px; }
.audit-detail-statuses { display: flex; align-items: flex-end; flex: 0 0 auto !important; flex-direction: column; gap: 5px; }

.change-notice { display: flex; align-items: center; padding: 11px 12px; margin-bottom: 14px; gap: 9px; border: 1px solid #ffd1a3; border-radius: var(--radius-lg); background: var(--brand-50); }
.change-notice--full { border-color: #b9d2e8; background: var(--info-bg); }
.change-notice--full > span { background: var(--info-bg); color: var(--info); }
.change-notice--full strong { color: var(--info); }
.change-notice > span { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: var(--brand-100); color: var(--brand-dark); }
.change-notice strong { display: block; color: var(--brand-dark); font-size: 10px; }
.change-notice p { margin: 1px 0 0; color: var(--text-muted); font-size: 9px; }

.detail-tabs { display: flex; overflow-x: auto; padding-bottom: 6px; margin-bottom: 18px; gap: 4px; border-bottom: 1px solid var(--border); }
.detail-tabs button { display: inline-flex; align-items: center; min-height: 34px; padding: 0 10px; gap: 5px; border-radius: var(--radius-md); background: transparent; color: var(--text-faint); font-size: 10px; font-weight: 600; white-space: nowrap; }
.detail-tabs button:hover { background: var(--hover); color: var(--text-strong); }
.detail-tabs button.is-active { background: var(--ink-50); color: var(--ink-700); }

.audit-tab-panel { display: grid; gap: 12px; }
.audit-detail-card { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.audit-detail-card > header { display: flex; align-items: flex-start; justify-content: space-between; padding: 12px 14px; border-bottom: 1px solid var(--border); background: var(--page-2); color: var(--ink-500); }
.audit-detail-card > header small { display: block; color: var(--ink-500); font-family: var(--font-mono); font-size: 8px; letter-spacing: .08em; }
.audit-detail-card > header h3 { margin: 3px 0 0; color: var(--text-strong); font-family: var(--font-display); font-size: 13px; }
.audit-detail-card.is-changed { border-color: #f4a64f; box-shadow: 0 0 0 1px rgba(244, 166, 79, .12); }
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); padding: 14px; gap: 9px; }
.info-grid > div { padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.info-grid > div.is-changed { border-color: #ffd1a3; background: var(--brand-50); }
.info-grid__wide { grid-column: 1 / -1; }
.info-grid span { display: block; color: var(--text-faint); font-size: 8px; }
.info-grid strong { display: block; margin-top: 3px; color: var(--text-subtle); font-size: 10px; }
.info-grid em, .vehicle-photos em, .credential-list em, .document-meta em { display: inline-flex; padding: 2px 5px; margin-top: 6px; border-radius: var(--radius-pill); background: var(--brand); color: #fff; font-size: 7px; font-style: normal; font-weight: 800; }
.avatar-field { display: flex !important; align-items: center; gap: 6px; }
.avatar-field i { display: inline-flex; width: 22px; height: 22px; align-items: center; justify-content: center; border-radius: 50%; background: var(--ink-700); color: #fff; font-size: 8px; font-style: normal; }

.document-preview { display: flex; align-items: center; padding: 14px; gap: 12px; }
.document-preview.is-changed { border-color: #ffd1a3; background: var(--brand-50); }
.document-preview__canvas { display: flex; align-items: center; justify-content: center; width: 110px; height: 68px; flex-direction: column; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--ink-800), var(--ink-600)); color: #fff; }
.document-preview__canvas small { margin-top: 4px; font-family: var(--font-mono); font-size: 6px; }
.document-preview strong { display: block; color: var(--text-strong); font-size: 11px; }
.document-preview p { margin: 2px 0 6px; color: var(--text-faint); font-family: var(--font-mono); font-size: 8px; }
.document-preview > div:nth-child(2) { min-width: 0; flex: 1; }
.document-meta { min-width: 120px; padding-left: 12px; border-left: 1px solid var(--border); }
.document-meta span { display: block; color: var(--text-faint); font-size: 8px; }
.document-meta strong { margin-top: 4px; font-family: var(--font-mono); font-size: 9px; }

.vehicle-photos { display: grid; grid-template-columns: repeat(3, 1fr); padding: 12px; gap: 8px; }
.vehicle-photos > div { display: flex; align-items: center; justify-content: center; min-height: 96px; flex-direction: column; gap: 7px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); color: var(--ink-500); }
.vehicle-photos > div.is-changed { border-color: #ffd1a3; background: var(--brand-50); color: var(--brand-dark); }
.vehicle-photos span { color: var(--text-muted); font-size: 8px; }

.credential-list { display: flex; flex-direction: column; padding: 12px; gap: 8px; }
.credential-list article { display: flex; align-items: center; padding: 11px 12px; gap: 9px; border: 1px solid var(--border); border-radius: var(--radius-lg); }
.credential-list article.is-changed { border-color: #f4a64f; background: var(--brand-50); }
.credential-list article.credential-card--expiring { border-color: var(--warning-border); background: var(--warning-bg); }
.credential-list article.credential-card--expired { border-color: var(--danger-border); background: var(--danger-bg); }
.credential-icon { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; flex: 0 0 34px; border-radius: var(--radius-md); background: var(--ink-50); color: var(--ink-600); }
.credential-list article > div { min-width: 0; flex: 1; }
.credential-list strong { display: block; color: var(--text-strong); font-size: 10px; }
.credential-list p { margin: 2px 0 0; color: var(--text-faint); font-size: 8px; }

.review-confirm { display: flex; align-items: flex-start; margin-bottom: 18px; gap: 11px; }
.review-confirm__icon { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; flex: 0 0 40px; border-radius: 50%; }
.review-confirm__icon--success { background: var(--success-bg); color: var(--success); }
.review-confirm__icon--danger { background: var(--danger-bg); color: var(--danger); }
.review-confirm strong { color: var(--text-strong); font-family: var(--font-display); font-size: 12px; }
.review-confirm p { margin: 4px 0 0; color: var(--text-muted); font-size: 11px; line-height: 1.55; }
.driver-mark-form { display: grid; gap: 10px; }
.driver-mark-card { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); box-shadow: 0 1px 2px rgba(15, 35, 55, .03); }
.driver-mark-card__head { display: grid; grid-template-columns: 30px minmax(0, 1fr) auto; align-items: center; padding: 11px 12px; gap: 9px; border-bottom: 1px solid var(--border); background: var(--page-2); }
.driver-mark-card__head > span { display: inline-flex; width: 27px; height: 27px; align-items: center; justify-content: center; border-radius: var(--radius-md); background: var(--ink-700); color: #fff; font-family: var(--font-mono); font-size: 8px; font-weight: 700; }
.driver-mark-card__head > div { min-width: 0; }
.driver-mark-card__head strong { display: block; color: var(--text-strong); font-size: 10px; }
.driver-mark-card__head small { display: block; margin-top: 2px; color: var(--text-faint); font-size: 8px; }
.driver-mark-card__head b { padding: 3px 7px; border-radius: var(--radius-pill); background: var(--brand-100); color: var(--brand-dark); font-size: 7px; white-space: nowrap; }
.driver-mark-card__control { padding: 11px 12px 8px; }
.driver-mark-card__control .field-control { width: 100%; min-height: 36px; }
.mark-choice-group { display: flex; gap: 8px; }
.mark-choice-group button { min-width: 92px; min-height: 34px; padding: 0 15px; border: 1px solid var(--border); border-radius: var(--radius-pill); background: var(--surface); color: var(--text-muted); font-size: 9px; font-weight: 700; }
.mark-choice-group button:hover { border-color: var(--ink-300); background: var(--hover); }
.mark-choice-group button.is-selected { border-color: var(--brand); background: var(--brand-100); color: var(--brand-dark); box-shadow: inset 0 0 0 1px var(--brand); }
.driver-mark-card__help { padding: 0 12px 11px; margin: 0; color: var(--text-faint); font-size: 8px; line-height: 1.5; }
.driver-mark-card__help--danger { color: var(--danger); }

@media (max-width: 980px) {
  .audit-summary { grid-template-columns: 1fr; }
  .advanced-filter-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 620px) {
  .audit-summary__metrics { grid-template-columns: repeat(2, 1fr); }
  .advanced-filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .advanced-filter-actions { align-items: stretch; flex-wrap: wrap; }
  .advanced-filter-actions .filter-bar__spacer { display: none; }
  .info-grid, .vehicle-photos { grid-template-columns: 1fr; }
  .driver-mark-card__head { grid-template-columns: 30px minmax(0, 1fr); }
  .driver-mark-card__head b { grid-column: 2; justify-self: start; }
}
</style>
