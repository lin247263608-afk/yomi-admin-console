<script setup lang="ts">
import { CalendarClock, CarFront, Check, FileBadge2, Filter, Search, ShieldCheck, UserRound, X } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import DrawerShell from '@/components/overlay/DrawerShell.vue'
import ModalDialog from '@/components/overlay/ModalDialog.vue'
import { driverAudits } from '@/data/mock'
import { useAppStore } from '@/stores/app'
import type { DriverAudit } from '@/types'
import { formatLondonTime } from '@/utils/format'

const appStore = useAppStore()
const rows = ref<DriverAudit[]>(driverAudits)
const searchTerm = ref('')
const typeFilter = ref<'全部' | DriverAudit['applicationType']>('全部')
const reviewFilter = ref<'全部' | DriverAudit['reviewStatus']>('全部')
const certificationFilter = ref<'全部' | DriverAudit['certificationStatus']>('全部')
const submittedFrom = ref('')
const submittedTo = ref('')
const pageSize = ref<20 | 50 | 100>(20)
const currentPage = ref(1)
const selectedAudit = ref<DriverAudit | null>(null)
const activeDetailTab = ref<'profile' | 'vehicle' | 'credentials'>('profile')
const approveTarget = ref<DriverAudit | null>(null)
const rejectTarget = ref<DriverAudit | null>(null)
const rejectReason = ref('')

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
  const term = searchTerm.value.trim().toLowerCase()
  return rows.value.filter((row) => {
    const matchesTerm = !term || `${row.id}${row.userId}${row.name}${row.englishName}${row.phone}${row.email}${row.plate}`.toLowerCase().includes(term)
    const matchesType = typeFilter.value === '全部' || row.applicationType === typeFilter.value
    const matchesReview = reviewFilter.value === '全部' || row.reviewStatus === reviewFilter.value
    const matchesCertification = certificationFilter.value === '全部' || row.certificationStatus === certificationFilter.value
    const submittedDate = londonDateKey(row.submittedAt)
    const matchesFrom = !submittedFrom.value || submittedDate >= submittedFrom.value
    const matchesTo = !submittedTo.value || submittedDate <= submittedTo.value
    return matchesTerm && matchesType && matchesReview && matchesCertification && matchesFrom && matchesTo
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

function openDetail(audit: DriverAudit) {
  selectedAudit.value = audit
  activeDetailTab.value = 'profile'
}

function requestApprove(audit: DriverAudit) {
  selectedAudit.value = null
  approveTarget.value = audit
}

function confirmApprove() {
  if (!approveTarget.value) return
  const isFirst = approveTarget.value.applicationType === '首次认证'
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
  searchTerm.value = ''
  typeFilter.value = '全部'
  reviewFilter.value = '全部'
  certificationFilter.value = '全部'
  submittedFrom.value = ''
  submittedTo.value = ''
}
</script>

<template>
  <div class="audits-page">
    <header class="page-header">
      <div>
        <div class="page-header__eyebrow">USERS / DRIVER AUDITS</div>
        <h1>司机审核</h1>
        <p class="page-header__description">按整单结论审核首次认证与资料修改申请，司机评价不进入本模块。</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--secondary" type="button" @click="appStore.notify('审核队列已刷新', '已同步最新提交与 Stripe 认证状态。', 'success')"><CalendarClock :size="15" />刷新队列</button>
      </div>
    </header>

    <section class="audit-summary dark-panel">
      <div class="audit-summary__title"><span>DRIVER COMPLIANCE</span><h2>审核工作台</h2><p>所有证件状态、变更项与 Stripe 阶段在同一处核对。</p></div>
      <div class="audit-summary__metrics"><button type="button" @click="reviewFilter = '待审核'; certificationFilter = '全部'"><span>待资料审核</span><strong>{{ counts.pending }}</strong></button><button type="button" @click="certificationFilter = '未认证stripe'; reviewFilter = '全部'"><span>待 Stripe</span><strong>{{ counts.stripe }}</strong></button><button type="button" @click="reviewFilter = '已驳回'; certificationFilter = '全部'"><span>申请已驳回</span><strong>{{ counts.rejected }}</strong></button><button type="button" @click="reviewFilter = '全部'; certificationFilter = '全部'"><span>即将到期</span><strong class="audit-summary__warning">{{ counts.expiring }}</strong></button></div>
    </section>

    <section class="filter-bar">
      <label class="filter-bar__search"><Search :size="15" /><input v-model="searchTerm" type="search" placeholder="审核 ID、司机、手机号、邮箱或车牌" aria-label="搜索司机审核" /></label>
      <select v-model="typeFilter" class="field-control" aria-label="申请类型"><option value="全部">全部申请类型</option><option value="首次认证">首次认证</option><option value="个人信息修改申请">个人信息修改申请</option><option value="车辆信息修改申请">车辆信息修改申请</option></select>
      <select v-model="reviewFilter" class="field-control" aria-label="审核状态"><option value="全部">全部审核状态</option><option value="待审核">待审核</option><option value="已通过">已通过</option><option value="已驳回">已驳回</option></select>
      <select v-model="certificationFilter" class="field-control" aria-label="司机认证状态"><option value="全部">全部认证状态</option><option value="未认证">未认证</option><option value="已驳回">已驳回</option><option value="未认证stripe">未认证stripe</option><option value="已认证">已认证</option></select>
      <input v-model="submittedFrom" class="field-control date-control" type="date" aria-label="提交开始日期" title="提交开始日期" />
      <input v-model="submittedTo" class="field-control date-control" type="date" aria-label="提交结束日期" title="提交结束日期" />
      <div class="filter-bar__spacer"></div>
      <button class="btn btn--ghost" type="button" @click="resetFilters"><X :size="14" />清空筛选</button>
      <span class="filter-result"><Filter :size="13" />{{ filteredRows.length }} 条结果</span>
    </section>

    <section class="table-shell">
      <div class="table-scroll">
        <table class="data-table audit-table">
          <thead><tr><th>审核单 / 用户</th><th>司机</th><th>车辆</th><th>申请类型</th><th>本次变更</th><th>提交时间</th><th>审核状态</th><th>认证状态</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="row in pagedRows" :key="row.id">
              <td><div class="table-primary mono">{{ row.id }}</div><div class="table-secondary mono">{{ row.userId }}</div></td>
              <td><div class="driver-name"><span>{{ row.name.slice(0, 1) }}</span><div><strong>{{ row.name }} · {{ row.englishName }}</strong><small>{{ row.phone }} · {{ row.email }}</small></div></div></td>
              <td><div class="table-primary">{{ row.plate }}</div><div class="table-secondary">{{ row.vehicle }}</div></td>
              <td><StatusBadge :label="row.applicationType" :tone="typeTone(row.applicationType)" /></td>
              <td><div v-if="row.changedFields.length" class="change-list"><span v-for="field in row.changedFields" :key="field">{{ field }}</span></div><span v-else class="muted">全量资料</span></td>
              <td><div class="table-primary">{{ formatLondonTime(row.submittedAt) }}</div><div class="table-secondary">英国时区</div></td>
              <td><StatusBadge :label="row.reviewStatus" :tone="reviewTone(row.reviewStatus)" dot /></td>
              <td><StatusBadge :label="row.certificationStatus" :tone="certificationTone(row.certificationStatus)" dot /></td>
              <td><div class="table-actions"><button class="table-action" type="button" @click="openDetail(row)">详情</button><button v-if="row.reviewStatus === '待审核'" class="table-action" type="button" @click="requestApprove(row)">通过</button><button v-if="row.reviewStatus === '待审核'" class="table-action table-action--danger" type="button" @click="requestReject(row)">驳回</button></div></td>
            </tr>
            <tr v-if="!filteredRows.length"><td colspan="9"><div class="empty-state"><span class="empty-state__icon"><Search :size="20" /></span><strong>没有匹配的审核申请</strong><p>调整搜索关键词或筛选条件后再试。</p></div></td></tr>
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

      <div v-if="selectedAudit.changedFields.length" class="change-notice"><span><FileBadge2 :size="16" /></span><div><strong>本次变更项</strong><p>{{ selectedAudit.changedFields.join('、') }}</p></div></div>

      <div class="detail-tabs">
        <button type="button" :class="{ 'is-active': activeDetailTab === 'profile' }" @click="activeDetailTab = 'profile'"><UserRound :size="14" />基础信息</button>
        <button type="button" :class="{ 'is-active': activeDetailTab === 'vehicle' }" @click="activeDetailTab = 'vehicle'"><CarFront :size="14" />车辆信息</button>
        <button type="button" :class="{ 'is-active': activeDetailTab === 'credentials' }" @click="activeDetailTab = 'credentials'"><ShieldCheck :size="14" />安全资质</button>
      </div>

      <section v-if="activeDetailTab === 'profile'" class="audit-tab-panel">
        <div class="info-grid"><div><span>用户 ID</span><strong>{{ selectedAudit.userId }}</strong></div><div><span>姓名 / 英文名</span><strong>{{ selectedAudit.name }} / {{ selectedAudit.englishName }}</strong></div><div :class="{ 'is-changed': selectedAudit.changedFields.includes('手机号') }"><span>手机号</span><strong>{{ selectedAudit.phone }}</strong></div><div><span>电子邮箱</span><strong>{{ selectedAudit.email }}</strong></div><div><span>性别</span><strong>{{ selectedAudit.gender }}</strong></div><div><span>提交时间</span><strong>{{ formatLondonTime(selectedAudit.submittedAt, true) }}</strong></div></div>
        <div class="document-preview" :class="{ 'is-changed': selectedAudit.changedFields.includes('驾驶证') }"><span class="document-preview__canvas"><FileBadge2 :size="32" /><small>DRIVING LICENCE</small></span><div><strong>驾驶证主页</strong><p>证件编号：DL-GB-82••••31</p><StatusBadge label="已上传" tone="success" /></div></div>
      </section>

      <section v-else-if="activeDetailTab === 'vehicle'" class="audit-tab-panel">
        <div class="info-grid"><div :class="{ 'is-changed': selectedAudit.changedFields.includes('车牌号') }"><span>车牌号</span><strong>{{ selectedAudit.plate }}</strong></div><div><span>品牌车系</span><strong>{{ selectedAudit.vehicle }}</strong></div><div :class="{ 'is-changed': selectedAudit.changedFields.includes('车辆颜色') }"><span>车辆颜色</span><strong>Midnight Blue</strong></div><div><span>燃油类型</span><strong>Hybrid</strong></div></div>
        <div class="vehicle-photos"><div v-for="label in ['车辆正面照', '车内前排', '车内后排', '后备箱', 'V5C']" :key="label" :class="{ 'is-changed': selectedAudit.changedFields.includes(label === 'V5C' ? 'V5C' : '') }"><CarFront :size="22" /><span>{{ label }}</span></div></div>
      </section>

      <section v-else class="audit-tab-panel">
        <div class="credential-list"><article v-for="credential in selectedAudit.credentials" :key="credential.name" :class="`credential-card--${credential.state}`"><span class="credential-icon"><FileBadge2 :size="19" /></span><div><strong>{{ credential.name }}</strong><p>{{ credential.expiresAt ? `有效期至 ${formatLondonTime(credential.expiresAt).split(' ')[0]}` : `签发日期 ${credential.issuedAt ?? '—'}` }}</p></div><StatusBadge :label="credentialLabel(credential.state)" :tone="credentialTone(credential.state)" dot /></article></div>
      </section>

      <template #footer>
        <button class="btn btn--secondary" type="button" @click="selectedAudit = null">关闭</button>
        <button v-if="selectedAudit.reviewStatus === '待审核'" class="btn btn--danger" type="button" @click="requestReject(selectedAudit)">不通过</button>
        <button v-if="selectedAudit.reviewStatus === '待审核'" class="btn btn--brand" type="button" @click="requestApprove(selectedAudit)">整单通过</button>
      </template>
    </DrawerShell>

    <ModalDialog v-if="approveTarget" title="确认整单通过" eyebrow="APPROVE APPLICATION" @close="approveTarget = null">
      <div class="review-confirm"><span class="review-confirm__icon review-confirm__icon--success"><Check :size="21" /></span><div><strong>{{ approveTarget.name }} · {{ approveTarget.applicationType }}</strong><p v-if="approveTarget.applicationType === '首次认证'">通过后认证状态转为「未认证stripe」，系统将创建 Stripe Express 账户并发送入驻链接。</p><p v-else>通过后新资料即时生效，司机在审核期间的原接单资格不受影响。</p></div></div>
      <template #footer><button class="btn btn--secondary" type="button" @click="approveTarget = null">返回</button><button class="btn btn--brand" type="button" @click="confirmApprove">确认通过</button></template>
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
  grid-template-columns: minmax(230px, 0.8fr) 1.7fr;
  padding: 22px 24px;
  margin-bottom: 16px;
  color: #fff;
  gap: 28px;
}

.audit-summary > * { position: relative; z-index: 1; }
.audit-summary__title span { color: var(--brand-light); font-family: var(--font-mono); font-size: 9px; letter-spacing: 0.08em; }
.audit-summary__title h2 { margin: 5px 0 3px; font-family: var(--font-display); font-size: 19px; }
.audit-summary__title p { margin: 0; color: var(--ink-300); font-size: 10px; }
.audit-summary__metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.audit-summary__metrics button { display: flex; min-height: 76px; flex-direction: column; align-items: flex-start; justify-content: center; padding: 12px; gap: 4px; border: 1px solid rgba(227, 237, 245, 0.12); border-radius: var(--radius-lg); background: rgba(255, 255, 255, 0.04); color: var(--ink-300); text-align: left; }
.audit-summary__metrics button:hover { background: rgba(255, 255, 255, 0.08); }
.audit-summary__metrics span { font-size: 9px; }
.audit-summary__metrics strong { color: #fff; font-family: var(--font-display); font-size: 22px; font-weight: 800; }
.audit-summary__warning { color: var(--brand-light) !important; }
.filter-result { display: inline-flex; align-items: center; color: var(--text-faint); font-family: var(--font-mono); font-size: 10px; gap: 5px; }
.date-control { min-width: 142px; }
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
.change-notice > span { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; background: var(--brand-100); color: var(--brand-dark); }
.change-notice strong { display: block; color: var(--brand-dark); font-size: 10px; }
.change-notice p { margin: 1px 0 0; color: var(--text-muted); font-size: 9px; }

.detail-tabs { display: flex; overflow-x: auto; padding-bottom: 6px; margin-bottom: 18px; gap: 4px; border-bottom: 1px solid var(--border); }
.detail-tabs button { display: inline-flex; align-items: center; min-height: 34px; padding: 0 10px; gap: 5px; border-radius: var(--radius-md); background: transparent; color: var(--text-faint); font-size: 10px; font-weight: 600; white-space: nowrap; }
.detail-tabs button:hover { background: var(--hover); color: var(--text-strong); }
.detail-tabs button.is-active { background: var(--ink-50); color: var(--ink-700); }

.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); margin-bottom: 18px; gap: 9px; }
.info-grid > div { padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--page); }
.info-grid > div.is-changed { border-color: #ffd1a3; background: var(--brand-50); }
.info-grid span { display: block; color: var(--text-faint); font-size: 8px; }
.info-grid strong { display: block; margin-top: 3px; color: var(--text-subtle); font-size: 10px; }

.document-preview { display: flex; align-items: center; padding: 12px; gap: 12px; border: 1px solid var(--border); border-radius: var(--radius-lg); }
.document-preview.is-changed { border-color: #ffd1a3; background: var(--brand-50); }
.document-preview__canvas { display: flex; align-items: center; justify-content: center; width: 110px; height: 68px; flex-direction: column; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--ink-800), var(--ink-600)); color: #fff; }
.document-preview__canvas small { margin-top: 4px; font-family: var(--font-mono); font-size: 6px; }
.document-preview strong { display: block; color: var(--text-strong); font-size: 11px; }
.document-preview p { margin: 2px 0 6px; color: var(--text-faint); font-family: var(--font-mono); font-size: 8px; }

.vehicle-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.vehicle-photos > div { display: flex; align-items: center; justify-content: center; min-height: 96px; flex-direction: column; gap: 7px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); color: var(--ink-500); }
.vehicle-photos > div.is-changed { border-color: #ffd1a3; background: var(--brand-50); color: var(--brand-dark); }
.vehicle-photos span { color: var(--text-muted); font-size: 8px; }

.credential-list { display: flex; flex-direction: column; gap: 8px; }
.credential-list article { display: flex; align-items: center; padding: 11px 12px; gap: 9px; border: 1px solid var(--border); border-radius: var(--radius-lg); }
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

@media (max-width: 980px) {
  .audit-summary { grid-template-columns: 1fr; }
}

@media (max-width: 620px) {
  .audit-summary__metrics { grid-template-columns: repeat(2, 1fr); }
  .info-grid, .vehicle-photos { grid-template-columns: 1fr; }
}
</style>
