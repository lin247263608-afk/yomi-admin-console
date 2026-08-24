<script setup lang="ts">
import { CarFront, Clock3, FileBadge2, ShieldCheck, Smartphone, UserRound } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

import StatusBadge from '@/components/feedback/StatusBadge.vue'
import DrawerShell from '@/components/overlay/DrawerShell.vue'
import { driverCandidates } from '@/data/mock'
import { moduleCatalog } from '@/data/moduleCatalog'
import type { ModuleRow } from '@/data/moduleCatalog.types'

type DriverDetailTab = 'profile' | 'vehicle' | 'credentials' | 'reviews'

const props = withDefaults(defineProps<{
  driver: ModuleRow
  initialTab?: DriverDetailTab
}>(), {
  initialTab: 'profile',
})

const emit = defineEmits<{
  close: []
}>()

type CredentialState = 'valid' | 'warning' | 'expired'

interface CredentialDetail {
  name: string
  date: string
  state: CredentialState
}

interface ReviewDetail {
  date: string
  orderId: string
  passenger: string
  score: number
  content: string
}

interface DriverDetailSnapshot {
  userId: string
  driverId: string
  name: string
  englishName: string
  avatar: string
  phone: string
  email: string
  gender: string
  plate: string
  vehicleType: string
  compliance: string
  acceptingType: string
  poolState: string
  status: string
  certificationStatus: string
  registeredAt: string
  registeredSource: string
  registeredDevice: string
  lastLoginAt: string
  licence: {
    number: string
    expiresAt: string
    state: CredentialState
  }
  stripe: {
    account: string
    accountName: string
    status: string
  }
  vehicle: {
    plate: string
    brandModel: string
    color: string
    fuelType: string
    government: string
    photos: string[]
  }
  operator: {
    hasLicence: boolean
    photo: string
    expiresAt: string
    name: string
    phone: string
    email: string
  }
  credentials: CredentialDetail[]
  rating: {
    score: number
    count: number
    distribution: Array<{ stars: number; count: number; percent: number }>
    reviews: ReviewDetail[]
  }
}

const activeTab = ref<DriverDetailTab>(props.initialTab)

const tabs: Array<{ id: DriverDetailTab; label: string; icon: typeof UserRound }> = [
  { id: 'profile', label: '基础信息', icon: UserRound },
  { id: 'vehicle', label: '车辆信息', icon: CarFront },
  { id: 'credentials', label: '安全资质', icon: ShieldCheck },
  { id: 'reviews', label: '评价', icon: FileBadge2 },
]

const loginProfiles: Record<string, { registeredAt: string; registeredSource: string; registeredDevice: string; lastLoginAt: string }> = {
  'DR-00842': { registeredAt: '2025-11-04 09:12', registeredSource: 'APP-iOS', registeredDevice: 'iPhone 15 · IDFA 8F2A…91C4', lastLoginAt: '2026-08-19 05:12' },
  'DR-00617': { registeredAt: '2025-10-18 14:26', registeredSource: 'APP-Android', registeredDevice: 'Pixel 8 · Android ID A91D…20EF', lastLoginAt: '2026-08-18 22:08' },
  'DR-00903': { registeredAt: '2026-01-22 11:48', registeredSource: '微信小程序', registeredDevice: 'iPhone 14 · IDFA 1C0B…7D21', lastLoginAt: '2026-08-19 04:46' },
  'DR-00308': { registeredAt: '2025-09-16 18:05', registeredSource: 'APP-Android', registeredDevice: 'Samsung S24 · OAID 72BC…5A10', lastLoginAt: '2026-08-16 10:08' },
  'DR-00591': { registeredAt: '2026-02-06 08:37', registeredSource: 'APP-iOS', registeredDevice: 'iPhone 13 · IDFA 5E81…4B09', lastLoginAt: '2026-08-17 20:41' },
}

const vehicleProfiles: Record<string, { color: string; fuelType: string; government: string }> = {
  'DR-00842': { color: 'Midnight Blue', fuelType: 'Hybrid', government: 'London Borough of Hillingdon' },
  'DR-00617': { color: 'Pearl White', fuelType: 'Diesel', government: 'Greater Manchester' },
  'DR-00903': { color: 'Graphite Grey', fuelType: 'Petrol', government: 'West Midlands' },
  'DR-00308': { color: 'Obsidian Black', fuelType: 'Diesel', government: 'Greater Manchester' },
  'DR-00591': { color: 'Silver', fuelType: 'Diesel', government: 'West Yorkshire' },
}

const credentialProfiles: Record<string, { operatorExpiresAt: string; phDriver: string; phVehicle: string; dbs: string; insurance: string; compliance: string; mot: string }> = {
  'DR-00842': { operatorExpiresAt: '2027-02-28', phDriver: '2027-05-20', phVehicle: '2026-10-10', dbs: '2025-06-12', insurance: '2027-01-30', compliance: '2026-12-01', mot: '2026-11-12' },
  'DR-00617': { operatorExpiresAt: '2027-04-18', phDriver: '2027-03-06', phVehicle: '2027-03-06', dbs: '2025-09-22', insurance: '2027-02-14', compliance: '2027-01-08', mot: '2027-01-30' },
  'DR-00903': { operatorExpiresAt: '2027-01-15', phDriver: '2027-06-11', phVehicle: '2027-02-21', dbs: '2025-12-04', insurance: '2027-05-01', compliance: '2026-12-19', mot: '2026-09-20' },
  'DR-00308': { operatorExpiresAt: '2026-08-01', phDriver: '2026-07-31', phVehicle: '2026-09-14', dbs: '2024-11-08', insurance: '2026-10-22', compliance: '2026-08-08', mot: '2026-12-10' },
  'DR-00591': { operatorExpiresAt: '2027-05-07', phDriver: '2027-02-16', phVehicle: '2027-02-16', dbs: '2025-10-13', insurance: '2027-04-26', compliance: '2027-03-18', mot: '2027-04-04' },
}

const reviewProfiles: Record<string, { count: number; reviews: ReviewDetail[] }> = {
  'DR-00842': {
    count: 128,
    reviews: [
      { date: '2026-08-18 22:10', orderId: 'YO-260817-10861', passenger: '林诗雨', score: 5, content: '提前到达上车点，沟通清晰，车内整洁。' },
      { date: '2026-08-10 11:34', orderId: 'YO-260810-10342', passenger: '周行远', score: 5, content: '机场接机很顺利，行李协助很周到。' },
      { date: '2026-07-26 09:18', orderId: 'YO-260724-09816', passenger: '沈佳宁', score: 4, content: '整体体验不错，路线安排合理。' },
    ],
  },
  'DR-00617': {
    count: 96,
    reviews: [
      { date: '2026-08-17 18:02', orderId: 'YO-260817-10876', passenger: '陈予安', score: 5, content: '驾驶平稳，回复消息很及时。' },
      { date: '2026-08-02 14:26', orderId: 'YO-260801-09542', passenger: '王睿', score: 5, content: '车辆空间充足，服务专业。' },
      { date: '2026-07-18 20:15', orderId: 'YO-260716-09138', passenger: '赵清和', score: 4, content: '准时完成送机，体验良好。' },
    ],
  },
  'DR-00903': {
    count: 74,
    reviews: [
      { date: '2026-08-15 08:42', orderId: 'YO-260814-10628', passenger: '周行远', score: 5, content: '路线熟悉，行程中主动确认下车点。' },
      { date: '2026-07-31 16:08', orderId: 'YO-260730-10112', passenger: '林诗雨', score: 4, content: '服务态度好，车辆干净。' },
    ],
  },
  'DR-00308': {
    count: 112,
    reviews: [
      { date: '2026-08-03 10:21', orderId: 'YO-260802-09611', passenger: '沈佳宁', score: 5, content: '沟通顺畅，按约定时间完成接送。' },
      { date: '2026-07-22 19:40', orderId: 'YO-260721-09350', passenger: '王睿', score: 3, content: '高峰期略有延误，已完成后续说明。' },
    ],
  },
  'DR-00591': {
    count: 58,
    reviews: [
      { date: '2026-08-12 07:16', orderId: 'YO-260811-10492', passenger: '赵清和', score: 5, content: '车辆舒适，司机服务细致。' },
      { date: '2026-07-29 13:04', orderId: 'YO-260728-10026', passenger: '林诗雨', score: 4, content: '整体满意，机场路段驾驶稳定。' },
    ],
  },
}

function dateState(value: string): CredentialState {
  const time = new Date(`${value}T23:59:59`).getTime()
  if (!Number.isFinite(time) || time < Date.now()) return 'expired'
  if (time - Date.now() < 60 * 24 * 60 * 60 * 1000) return 'warning'
  return 'valid'
}

function makeCredential(name: string, date: string, issued = false): CredentialDetail {
  return { name, date: issued ? `签发日期 ${date}` : `有效期至 ${date}`, state: issued ? 'valid' : dateState(date) }
}

function buildSnapshot(row: ModuleRow): DriverDetailSnapshot {
  const driverId = String(row.driverId ?? row.id)
  const candidate = driverCandidates.find((item) => item.id === driverId || item.name === String(row.name ?? ''))
  const sourceRow = moduleCatalog.drivers?.rows?.find((item) => String(item.driverId ?? '') === driverId)
  const login = loginProfiles[driverId] ?? loginProfiles['DR-00842']
  const vehicleProfile = vehicleProfiles[driverId] ?? vehicleProfiles['DR-00842']
  const credentialProfile = credentialProfiles[driverId] ?? credentialProfiles['DR-00842']
  const review = reviewProfiles[driverId] ?? reviewProfiles['DR-00842']
  const name = String(row.name ?? candidate?.name ?? '司机')
  const rowId = String(row.id ?? '')
  const userId = rowId.startsWith('USR-') ? rowId : String(sourceRow?.id ?? '—')
  const vehicle = String(row.vehicleType ?? candidate?.vehicle ?? '—')
  const compliance = String(row.compliance ?? candidate?.complianceStatus ?? '合规')
  const status = String(row.status ?? (candidate?.acceptingStatus === '冻结接单' ? '冻结' : '正常'))
  const poolState = String(row.poolState ?? '开启')
  const rating = Number(String(row.rating ?? candidate?.rating ?? 4.8).replace(/[^0-9.]/g, '')) || 4.8
  const ratingCount = review.count
  const distribution = [
    { stars: 5, count: Math.round(ratingCount * .72), percent: 72 },
    { stars: 4, count: Math.round(ratingCount * .21), percent: 21 },
    { stars: 3, count: Math.round(ratingCount * .05), percent: 5 },
    { stars: 2, count: Math.round(ratingCount * .015), percent: 1.5 },
    { stars: 1, count: Math.max(0, ratingCount - Math.round(ratingCount * .72) - Math.round(ratingCount * .21) - Math.round(ratingCount * .05) - Math.round(ratingCount * .015)), percent: 0.5 },
  ]

  return {
    userId,
    driverId,
    name,
    englishName: String(row.englishName ?? candidate?.englishName ?? '—'),
    avatar: String(row.avatar ?? name.slice(0, 1)),
    phone: String(row.phone ?? candidate?.phone ?? '—'),
    email: String(row.email ?? candidate?.email ?? (String(row.contact ?? '').split(' · ')[1] || '—')),
    gender: String(row.gender ?? '男'),
    plate: String(row.plate ?? candidate?.plate ?? '—'),
    vehicleType: vehicle,
    compliance,
    acceptingType: String(row.acceptingType ?? '接送机'),
    poolState,
    status,
    certificationStatus: driverId === 'DR-00308' ? '已驳回' : driverId === 'DR-00617' ? '未认证stripe' : '已认证',
    registeredAt: login.registeredAt,
    registeredSource: login.registeredSource,
    registeredDevice: login.registeredDevice,
    lastLoginAt: login.lastLoginAt,
    licence: {
      number: `DL-GB-${driverId.slice(-5)}••31`,
      expiresAt: credentialProfile.phDriver,
      state: dateState(credentialProfile.phDriver),
    },
    stripe: {
      account: `acct_1YOMI${driverId.replace(/\D/g, '').slice(-6)}`,
      accountName: `${name} · YOMI Driver Account`,
      status: driverId === 'DR-00308' ? 'restricted' : driverId === 'DR-00617' ? 'pending' : 'verified',
    },
    vehicle: {
      plate: String(row.plate ?? candidate?.plate ?? '—'),
      brandModel: candidate?.vehicle ?? vehicle,
      color: vehicleProfile.color,
      fuelType: vehicleProfile.fuelType,
      government: vehicleProfile.government,
      photos: ['车辆正面照', '车内前排座椅照', '车内后排座椅照', '车后备箱照', '车辆 V5C 照'],
    },
    operator: {
      hasLicence: driverId !== 'DR-00308',
      photo: 'Operator licence · 已上传',
      expiresAt: credentialProfile.operatorExpiresAt,
      name: 'YOMI Travel Ltd',
      phone: '+44 20 7946 0821',
      email: 'compliance@yomi.travel',
    },
    credentials: [
      makeCredential('PH Driver License', credentialProfile.phDriver),
      makeCredential('PH Vehicle License', credentialProfile.phVehicle),
      makeCredential('DBS 无犯罪记录证明', credentialProfile.dbs, true),
      makeCredential('商业险保险单 · Commercial Insurance', credentialProfile.insurance),
      makeCredential('车辆合规检验报告 · Compliance Test', credentialProfile.compliance),
      makeCredential('车辆年检 · MOT', credentialProfile.mot),
    ],
    rating: { score: Number(rating.toFixed(1)), count: ratingCount, distribution, reviews: review.reviews },
  }
}

const detail = computed(() => buildSnapshot(props.driver))

function statusTone(status: unknown) {
  const label = String(status ?? '')
  if (/非合规|不合规|冻结|驳回|restricted|过期|expired/.test(label)) return 'danger' as const
  if (/未认证|warning|提醒|pending/.test(label)) return 'warning' as const
  if (/正常|合规|已认证|verified|开启|在线|有效/.test(label)) return 'success' as const
  return 'neutral' as const
}

function credentialLabel(state: CredentialState) {
  if (state === 'expired') return '已过期'
  if (state === 'warning') return '60 天内到期'
  return '有效'
}

function credentialTone(state: CredentialState) {
  if (state === 'expired') return 'danger' as const
  if (state === 'warning') return 'warning' as const
  return 'success' as const
}

function credentialState(value: string): CredentialState {
  const time = new Date(`${value}T23:59:59`).getTime()
  if (!Number.isFinite(time) || time < Date.now()) return 'expired'
  if (time - Date.now() < 60 * 24 * 60 * 60 * 1000) return 'warning'
  return 'valid'
}

function starText(score: number) {
  return `${'★'.repeat(score)}${'☆'.repeat(Math.max(0, 5 - score))}`
}

watch([() => props.driver.id, () => props.initialTab], () => {
  activeTab.value = props.initialTab
})
</script>

<template>
  <DrawerShell :title="`${detail.name} · 司机详情`" eyebrow="DRIVER DETAIL" @close="emit('close')">
    <div class="driver-detail-hero">
      <div class="driver-avatar" aria-hidden="true">{{ detail.avatar }}</div>
      <div class="driver-detail-hero__main">
        <small>{{ detail.driverId }} · {{ detail.userId }}</small>
        <h3>{{ detail.name }} <span>{{ detail.englishName }}</span></h3>
        <p>{{ detail.phone }} · {{ detail.email }}</p>
      </div>
      <div class="driver-detail-hero__badges">
        <StatusBadge :label="detail.status" :tone="statusTone(detail.status)" dot />
        <StatusBadge :label="`订单池 ${detail.poolState}`" :tone="detail.poolState === '开启' ? 'success' : 'neutral'" />
      </div>
    </div>

    <div class="driver-detail-tabs" role="tablist" aria-label="司机详情页签">
      <button v-for="tab in tabs" :key="tab.id" type="button" role="tab" :aria-selected="activeTab === tab.id" :class="{ 'is-active': activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="14" />{{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'profile'" class="driver-tab-panel">
      <section class="driver-detail-card">
        <header><div><span>ACCOUNT</span><h3>账号信息</h3></div><ShieldCheck :size="17" /></header>
        <div class="driver-info-grid">
          <div><span>用户ID</span><strong class="mono">{{ detail.userId }}</strong></div>
          <div><span>车主ID</span><strong class="mono">{{ detail.driverId }}</strong></div>
          <div><span>姓名 / 英文名</span><strong>{{ detail.name }} / {{ detail.englishName }}</strong></div>
          <div><span>头像</span><strong class="avatar-note"><i>{{ detail.avatar }}</i>已配置（原型占位）</strong></div>
          <div><span>手机号</span><strong>{{ detail.phone }}</strong></div>
          <div><span>电子邮箱</span><strong>{{ detail.email }}</strong></div>
          <div><span>性别</span><strong>{{ detail.gender }}</strong></div>
          <div><span>车牌号 / 车型</span><strong>{{ detail.plate }} · {{ detail.vehicleType }}</strong></div>
          <div><span>合规标签</span><StatusBadge :label="detail.compliance" :tone="statusTone(detail.compliance)" dot /></div>
          <div><span>接单类型</span><strong>{{ detail.acceptingType }}</strong></div>
          <div><span>接单状态</span><StatusBadge :label="detail.status" :tone="statusTone(detail.status)" dot /></div>
          <div><span>认证状态</span><StatusBadge :label="detail.certificationStatus" :tone="statusTone(detail.certificationStatus)" dot /></div>
        </div>
      </section>

      <section class="driver-detail-card">
        <header><div><span>DRIVING LICENCE</span><h3>驾驶证</h3></div><FileBadge2 :size="17" /></header>
        <div class="driver-document-row"><div class="driver-document-thumb"><FileBadge2 :size="24" /><small>DRIVING LICENCE</small></div><div><strong>驾驶证主页照</strong><p>证件编号：{{ detail.licence.number }}</p><StatusBadge label="已上传" tone="success" /></div><div class="driver-document-expiry"><span>有效结束日期</span><strong>{{ detail.licence.expiresAt }}</strong><StatusBadge :label="credentialLabel(detail.licence.state)" :tone="credentialTone(detail.licence.state)" dot /></div></div>
      </section>

      <section class="driver-detail-card">
        <header><div><span>LOGIN AUDIT</span><h3>登录信息</h3></div><Clock3 :size="17" /></header>
        <div class="driver-info-grid"><div><span>注册时间</span><strong>{{ detail.registeredAt }}</strong></div><div><span>注册来源</span><strong>{{ detail.registeredSource }}</strong></div><div class="driver-info-grid__wide"><span>注册设备</span><strong>{{ detail.registeredDevice }}</strong></div><div><span>最后登录时间</span><strong>{{ detail.lastLoginAt }}</strong></div></div>
        <p class="driver-detail-note"><Smartphone :size="14" />设备标识已按后台展示规则脱敏，仅用于登录审计。</p>
      </section>

      <section class="driver-detail-card">
        <header><div><span>STRIPE CONNECT</span><h3>Stripe 认证</h3></div><ShieldCheck :size="17" /></header>
        <div class="driver-info-grid"><div><span>Stripe 账号</span><strong class="mono">{{ detail.stripe.account }}</strong></div><div><span>账户名称</span><strong>{{ detail.stripe.accountName }}</strong></div><div><span>认证状态</span><StatusBadge :label="detail.stripe.status" :tone="statusTone(detail.stripe.status)" dot /></div></div>
      </section>
    </div>

    <div v-else-if="activeTab === 'vehicle'" class="driver-tab-panel">
      <section class="driver-detail-card">
        <header><div><span>VEHICLE PROFILE</span><h3>车辆信息</h3></div><CarFront :size="17" /></header>
        <div class="driver-info-grid"><div><span>车牌号</span><strong>{{ detail.vehicle.plate }}</strong></div><div><span>品牌车系</span><strong>{{ detail.vehicle.brandModel }}</strong></div><div><span>车辆颜色</span><strong>{{ detail.vehicle.color }}</strong></div><div><span>燃油类型</span><strong>{{ detail.vehicle.fuelType }}</strong></div><div class="driver-info-grid__wide"><span>所属政府</span><strong>{{ detail.vehicle.government }}</strong></div></div>
      </section>
      <section class="driver-detail-card">
        <header><div><span>VEHICLE MEDIA</span><h3>车辆照片</h3><small>资料已脱敏，当前版本以原型占位图展示</small></div><CarFront :size="17" /></header>
        <div class="driver-photo-grid"><div v-for="photo in detail.vehicle.photos" :key="photo" class="driver-photo-card"><div class="driver-photo-placeholder"><CarFront :size="22" /></div><span>{{ photo }}</span><StatusBadge label="已上传" tone="success" /></div></div>
      </section>
    </div>

    <div v-else-if="activeTab === 'credentials'" class="driver-tab-panel">
      <section class="driver-detail-card">
        <header><div><span>OPERATOR LICENCE</span><h3>Operator 牌照</h3></div><ShieldCheck :size="17" /></header>
        <div v-if="detail.operator.hasLicence" class="driver-document-row"><div class="driver-document-thumb"><FileBadge2 :size="24" /><small>OPERATOR</small></div><div><strong>{{ detail.operator.photo }}</strong><p>持牌资料已上传</p></div><div class="driver-document-expiry"><span>有效期至</span><strong>{{ detail.operator.expiresAt }}</strong><StatusBadge :label="credentialLabel(credentialState(detail.operator.expiresAt))" :tone="credentialTone(credentialState(detail.operator.expiresAt))" dot /></div></div>
        <div v-else class="driver-operator-contact"><StatusBadge label="无 Operator 牌照" tone="warning" /><div><span>Operator 名称</span><strong>{{ detail.operator.name }}</strong></div><div><span>电话</span><strong>{{ detail.operator.phone }}</strong></div><div><span>邮箱</span><strong>{{ detail.operator.email }}</strong></div></div>
      </section>
      <section class="driver-detail-card">
        <header><div><span>COMPLIANCE DOCUMENTS</span><h3>安全资质</h3><small>距到期不足 60 天标黄，已过期标红；仅作后台提醒</small></div><FileBadge2 :size="17" /></header>
        <div class="driver-credential-list"><article v-for="credential in detail.credentials" :key="credential.name" class="driver-credential-item" :class="`is-${credential.state}`"><div class="driver-credential-icon"><FileBadge2 :size="18" /></div><div class="driver-credential-main"><strong>{{ credential.name }}</strong><p>{{ credential.date }}</p></div><StatusBadge :label="credentialLabel(credential.state)" :tone="credentialTone(credential.state)" dot /></article></div>
      </section>
    </div>

    <div v-else class="driver-tab-panel">
      <section class="driver-detail-card">
        <header><div><span>DRIVER RATING</span><h3>评价概览</h3><small>仅展示乘客对司机的评价</small></div><span class="driver-rating-score">{{ detail.rating.score.toFixed(1) }} ★</span></header>
        <div class="rating-overview"><div class="rating-total"><strong>{{ detail.rating.score.toFixed(1) }}</strong><span>{{ '★'.repeat(Math.round(detail.rating.score)) }}</span><small>共 {{ detail.rating.count }} 次评价</small></div><div class="rating-distribution"><div v-for="item in detail.rating.distribution" :key="item.stars"><span>{{ item.stars }} 星</span><i><b :style="{ width: `${item.percent}%` }"></b></i><strong>{{ item.count }} · {{ item.percent }}%</strong></div></div></div>
      </section>
      <section class="driver-detail-card">
        <header><div><span>REVIEW DETAILS</span><h3>评价明细</h3></div><FileBadge2 :size="17" /></header>
        <div v-if="detail.rating.reviews.length" class="driver-review-list"><article v-for="review in detail.rating.reviews" :key="`${review.orderId}-${review.date}`"><div class="driver-review-head"><div><strong>{{ review.passenger }}</strong><small>{{ review.date }} · {{ review.orderId }}</small></div><span class="driver-review-stars">{{ starText(review.score) }}</span></div><p>{{ review.content }}</p></article></div>
        <div v-else class="driver-empty-state"><FileBadge2 :size="20" /><strong>暂无评价</strong><p>当前原型数据仓中没有该司机的评价记录。</p></div>
      </section>
    </div>

    <template #footer><button class="btn btn--secondary" type="button" @click="emit('close')">关闭</button></template>
  </DrawerShell>
</template>

<style scoped>
.driver-detail-hero { display: flex; align-items: center; padding: 14px; margin-bottom: 15px; gap: 11px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--page); }
.driver-avatar { display: inline-flex; width: 44px; height: 44px; flex: 0 0 44px; align-items: center; justify-content: center; border-radius: 50%; background: var(--ink-700); color: #fff; font-family: var(--font-display); font-size: 16px; font-weight: 800; }
.driver-detail-hero__main { min-width: 0; flex: 1; }
.driver-detail-hero__main small { color: var(--ink-500); font-family: var(--font-mono); font-size: 8px; }
.driver-detail-hero__main h3 { margin: 2px 0; color: var(--text-strong); font-family: var(--font-display); font-size: 14px; }
.driver-detail-hero__main h3 span { margin-left: 4px; color: var(--text-faint); font-family: var(--font-body); font-size: 10px; font-weight: 500; }
.driver-detail-hero__main p { overflow: hidden; margin: 0; color: var(--text-faint); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
.driver-detail-hero__badges { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.driver-detail-tabs { display: flex; overflow-x: auto; padding-bottom: 6px; margin-bottom: 15px; gap: 4px; border-bottom: 1px solid var(--border); }
.driver-detail-tabs button { display: inline-flex; align-items: center; min-height: 34px; padding: 0 10px; gap: 5px; border-radius: var(--radius-md); background: transparent; color: var(--text-faint); font-size: 10px; font-weight: 600; white-space: nowrap; }
.driver-detail-tabs button:hover, .driver-detail-tabs button.is-active { background: var(--ink-50); color: var(--ink-700); }
.driver-tab-panel { display: grid; gap: 12px; }
.driver-detail-card { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.driver-detail-card > header { display: flex; align-items: flex-start; justify-content: space-between; padding: 13px 14px; border-bottom: 1px solid var(--border); background: var(--page-2); color: var(--ink-500); }
.driver-detail-card > header span:first-child { display: block; color: var(--ink-500); font-family: var(--font-mono); font-size: 8px; letter-spacing: .08em; }
.driver-detail-card > header h3 { margin: 3px 0 0; color: var(--text-strong); font-family: var(--font-display); font-size: 13px; }
.driver-detail-card > header small { display: block; margin-top: 3px; color: var(--text-faint); font-size: 9px; }
.driver-info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 14px; gap: 10px; }
.driver-info-grid > div { min-width: 0; padding: 9px 10px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.driver-info-grid__wide { grid-column: 1 / -1; }
.driver-info-grid span, .driver-document-expiry span, .driver-operator-contact span, .rating-distribution span { display: block; margin-bottom: 3px; color: var(--text-faint); font-size: 8px; font-weight: 600; }
.driver-info-grid strong { display: block; overflow-wrap: anywhere; color: var(--text-subtle); font-size: 10px; }
.avatar-note { display: flex !important; align-items: center; gap: 5px; }
.avatar-note i { display: inline-flex; width: 20px; height: 20px; align-items: center; justify-content: center; border-radius: 50%; background: var(--ink-700); color: #fff; font-size: 9px; font-style: normal; }
.driver-document-row { display: flex; align-items: center; padding: 14px; gap: 11px; }
.driver-document-row > div:nth-child(2) { min-width: 0; flex: 1; }
.driver-document-row strong { display: block; color: var(--text-strong); font-size: 10px; }
.driver-document-row p { margin: 3px 0 7px; color: var(--text-faint); font-family: var(--font-mono); font-size: 8px; }
.driver-document-thumb { display: flex; width: 86px; height: 58px; flex: 0 0 86px; flex-direction: column; align-items: center; justify-content: center; border-radius: var(--radius-md); background: linear-gradient(135deg, var(--ink-800), var(--ink-600)); color: #fff; }
.driver-document-thumb small { margin-top: 3px; font-family: var(--font-mono); font-size: 6px; }
.driver-document-expiry { min-width: 92px; padding-left: 10px; border-left: 1px solid var(--border); }
.driver-document-expiry strong { margin-bottom: 5px; font-family: var(--font-mono); font-size: 9px; }
.driver-detail-note { display: flex; align-items: center; padding: 10px 14px; margin: 0; gap: 6px; border-top: 1px solid var(--border); color: var(--text-faint); font-size: 9px; }
.driver-photo-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 12px; gap: 9px; }
.driver-photo-card { min-width: 0; padding: 8px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.driver-photo-placeholder { display: flex; height: 58px; align-items: center; justify-content: center; margin-bottom: 7px; border-radius: var(--radius-sm); background: linear-gradient(135deg, var(--ink-100), var(--page-2)); color: var(--ink-500); }
.driver-photo-card > span { display: block; min-height: 22px; margin-bottom: 5px; color: var(--text-subtle); font-size: 8px; line-height: 1.35; }
.driver-operator-contact { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 14px; gap: 10px; }
.driver-operator-contact > .badge { grid-column: 1 / -1; justify-self: start; }
.driver-operator-contact > div { padding: 9px 10px; border: 1px solid var(--border); border-radius: var(--radius-md); }
.driver-operator-contact strong { overflow-wrap: anywhere; color: var(--text-subtle); font-size: 10px; }
.driver-credential-list { display: grid; padding: 12px; gap: 8px; }
.driver-credential-item { display: flex; align-items: center; padding: 10px; gap: 9px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.driver-credential-item.is-warning { border-color: #f6cf91; background: #fffbf2; }
.driver-credential-item.is-expired { border-color: #f3b4b4; background: #fff7f7; }
.driver-credential-icon { display: inline-flex; width: 32px; height: 32px; flex: 0 0 32px; align-items: center; justify-content: center; border-radius: var(--radius-sm); background: var(--ink-50); color: var(--ink-600); }
.driver-credential-main { min-width: 0; flex: 1; }
.driver-credential-main strong { display: block; color: var(--text-strong); font-size: 10px; }
.driver-credential-main p { margin: 3px 0 0; color: var(--text-faint); font-family: var(--font-mono); font-size: 8px; }
.driver-rating-score { color: var(--brand-dark) !important; font-family: var(--font-display) !important; font-size: 14px !important; letter-spacing: 0 !important; }
.rating-overview { display: grid; grid-template-columns: 120px 1fr; padding: 15px; gap: 18px; }
.rating-total { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; border-right: 1px solid var(--border); }
.rating-total strong { color: var(--text-strong); font-family: var(--font-display); font-size: 29px; }
.rating-total span { margin: 2px 0; color: var(--brand); font-size: 12px; letter-spacing: 1px; }
.rating-total small { color: var(--text-faint); font-size: 8px; }
.rating-distribution { display: grid; align-content: center; gap: 7px; }
.rating-distribution > div { display: grid; grid-template-columns: 32px 1fr 74px; align-items: center; gap: 7px; }
.rating-distribution span { margin: 0; font-size: 8px; }
.rating-distribution i { overflow: hidden; height: 5px; border-radius: var(--radius-pill); background: var(--ink-100); }
.rating-distribution i b { display: block; height: 100%; border-radius: inherit; background: var(--brand); }
.rating-distribution strong { color: var(--text-faint); font-family: var(--font-mono); font-size: 8px; font-weight: 500; text-align: right; }
.driver-review-list { display: grid; padding: 12px; gap: 8px; }
.driver-review-list article { padding: 11px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
.driver-review-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
.driver-review-head strong { display: block; color: var(--text-strong); font-size: 10px; }
.driver-review-head small { display: block; margin-top: 3px; color: var(--text-faint); font-family: var(--font-mono); font-size: 8px; }
.driver-review-stars { color: var(--brand); font-size: 11px; letter-spacing: 1px; white-space: nowrap; }
.driver-review-list p { margin: 8px 0 0; color: var(--text-subtle); font-size: 10px; line-height: 1.5; }
.driver-empty-state { display: flex; min-height: 160px; flex-direction: column; align-items: center; justify-content: center; padding: 20px; color: var(--text-faint); text-align: center; gap: 6px; }
.driver-empty-state strong { color: var(--text-subtle); font-size: 11px; }
.driver-empty-state p { margin: 0; font-size: 9px; }
@media (max-width: 560px) { .driver-info-grid, .driver-operator-contact, .rating-overview { grid-template-columns: 1fr; } .driver-info-grid__wide { grid-column: auto; } .driver-photo-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .rating-total { padding-bottom: 14px; border-right: 0; border-bottom: 1px solid var(--border); } }
</style>
