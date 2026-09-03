<script setup lang="ts">
import {
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
  Info,
  LocateFixed,
  MapPinned,
  Minus,
  Plus,
  RotateCcw,
  Trash2,
  Undo2,
} from '@lucide/vue'
import { computed, ref, watch } from 'vue'

import ModalDialog from '@/components/overlay/ModalDialog.vue'
import type { ModuleRow } from '@/data/moduleCatalog.types'

type PolygonPoint = { x: number; y: number }
type RelationWarning = { type: 'contains' | 'overlap'; name: string }

const props = defineProps<{
  row: ModuleRow | null
  rows: ModuleRow[]
}>()

const emit = defineEmits<{
  close: []
  save: [row: ModuleRow, warnings: RelationWarning[]]
}>()

const name = ref('')
const type = ref<'机场' | '城市'>('机场')
const description = ref('')
const points = ref<PolygonPoint[]>([])
const zoom = ref(1)
const showOtherFences = ref(true)
const dragIndex = ref<number | null>(null)
const dragMoved = ref(false)
const validationError = ref('')

function normalizePoints(value: unknown): PolygonPoint[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const x = Number((item as Record<string, unknown>).x)
    const y = Number((item as Record<string, unknown>).y)
    return Number.isFinite(x) && Number.isFinite(y) ? [{ x, y }] : []
  })
}

function initialize() {
  name.value = String(props.row?.name ?? '')
  type.value = props.row?.type === '城市' ? '城市' : '机场'
  description.value = String(props.row?.description ?? '')
  points.value = normalizePoints(props.row?.polygon)
  zoom.value = 1
  validationError.value = ''
}

watch(() => props.row, initialize, { immediate: true })

const viewBox = computed(() => {
  const size = 100 / zoom.value
  const offset = (100 - size) / 2
  return `${offset} ${offset} ${size} ${size}`
})

const pointString = computed(() => points.value.map((point) => `${point.x},${point.y}`).join(' '))
const existingFences = computed(() => props.rows
  .filter((row) => row.id !== props.row?.id)
  .map((row) => ({ id: row.id, name: String(row.name ?? row.id), points: normalizePoints(row.polygon) }))
  .filter((item) => item.points.length >= 3))

function polygonArea(polygon: PolygonPoint[]) {
  if (polygon.length < 3) return 0
  return Math.abs(polygon.reduce((sum, point, index) => {
    const next = polygon[(index + 1) % polygon.length]
    return sum + point.x * (next?.y ?? 0) - (next?.x ?? 0) * point.y
  }, 0) / 2)
}

function pointInPolygon(point: PolygonPoint, polygon: PolygonPoint[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const current = polygon[i]
    const previous = polygon[j]
    if (!current || !previous) continue
    const intersect = ((current.y > point.y) !== (previous.y > point.y))
      && point.x < (previous.x - current.x) * (point.y - current.y) / (previous.y - current.y || Number.EPSILON) + current.x
    if (intersect) inside = !inside
  }
  return inside
}

function orientation(a: PolygonPoint, b: PolygonPoint, c: PolygonPoint) {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)
}

function segmentsIntersect(a: PolygonPoint, b: PolygonPoint, c: PolygonPoint, d: PolygonPoint) {
  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)
  return (o1 > 0) !== (o2 > 0) && (o3 > 0) !== (o4 > 0)
}

function polygonsIntersect(a: PolygonPoint[], b: PolygonPoint[]) {
  return a.some((point, index) => {
    const next = a[(index + 1) % a.length]
    if (!next) return false
    return b.some((other, otherIndex) => {
      const otherNext = b[(otherIndex + 1) % b.length]
      return otherNext ? segmentsIntersect(point, next, other, otherNext) : false
    })
  })
}

function relationBetween(current: PolygonPoint[], other: PolygonPoint[]): RelationWarning['type'] | null {
  const currentInsideOther = current.every((point) => pointInPolygon(point, other))
  const otherInsideCurrent = other.every((point) => pointInPolygon(point, current))
  if (currentInsideOther || otherInsideCurrent) return 'contains'
  const someCurrentInside = current.some((point) => pointInPolygon(point, other))
  const someOtherInside = other.some((point) => pointInPolygon(point, current))
  if (someCurrentInside || someOtherInside || polygonsIntersect(current, other)) return 'overlap'
  return null
}

const relationWarnings = computed<RelationWarning[]>(() => {
  if (points.value.length < 3) return []
  return existingFences.value.flatMap((fence) => {
    const relation = relationBetween(points.value, fence.points)
    return relation ? [{ type: relation, name: fence.name }] : []
  })
})

const geometryRelation = computed(() => {
  if (relationWarnings.value.some((warning) => warning.type === 'overlap')) return '部分交叠（仅警示）'
  if (relationWarnings.value.some((warning) => warning.type === 'contains')) return '包含关系（小围栏优先）'
  return '正常'
})

const areaIndex = computed(() => polygonArea(points.value).toFixed(1))
const isNameDuplicated = computed(() => props.rows.some((row) => row.id !== props.row?.id
  && String(row.name ?? '').trim().toLowerCase() === name.value.trim().toLowerCase()))

function eventPoint(event: MouseEvent | PointerEvent) {
  const svg = event.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const size = 100 / zoom.value
  const offset = (100 - size) / 2
  return {
    x: Number((offset + (event.clientX - rect.left) / rect.width * size).toFixed(2)),
    y: Number((offset + (event.clientY - rect.top) / rect.height * size).toFixed(2)),
  }
}

function addPoint(event: MouseEvent) {
  if (dragMoved.value) {
    dragMoved.value = false
    return
  }
  if (points.value.length >= 50) {
    validationError.value = '单个围栏最多支持 50 个顶点。'
    return
  }
  points.value.push(eventPoint(event))
  validationError.value = ''
}

function startDrag(index: number, event: PointerEvent) {
  event.stopPropagation()
  dragIndex.value = index
  dragMoved.value = false
  ;(event.target as SVGElement).setPointerCapture?.(event.pointerId)
}

function movePoint(event: PointerEvent) {
  if (dragIndex.value === null) return
  const nextPoint = eventPoint(event)
  const current = points.value[dragIndex.value]
  if (!current) return
  if (Math.abs(current.x - nextPoint.x) > .1 || Math.abs(current.y - nextPoint.y) > .1) dragMoved.value = true
  points.value[dragIndex.value] = nextPoint
}

function stopDrag() {
  dragIndex.value = null
}

function undoPoint() {
  points.value.pop()
  validationError.value = ''
}

function clearPoints() {
  points.value = []
  validationError.value = ''
}

function changeZoom(delta: number) {
  zoom.value = Math.min(2, Math.max(1, Number((zoom.value + delta).toFixed(1))))
}

function save() {
  const trimmedName = name.value.trim()
  if (!trimmedName) {
    validationError.value = '请输入围栏名称。'
    return
  }
  if (isNameDuplicated.value) {
    validationError.value = '围栏名称已存在，请使用唯一名称。'
    return
  }
  if (points.value.length < 3) {
    validationError.value = '请在地图上绘制至少 3 个顶点。'
    return
  }
  emit('save', {
    id: props.row?.id ?? '',
    name: trimmedName,
    type: type.value,
    description: description.value.trim(),
    polygon: points.value.map((point) => ({ ...point })),
    geometryRelation: geometryRelation.value,
    relatedFence: relationWarnings.value.map((warning) => warning.name).join('、'),
    vertexCount: points.value.length,
    routeCount: Number(props.row?.routeCount ?? 0),
    updatedAt: new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date()).replaceAll('/', '-'),
    status: String(props.row?.status ?? '启用'),
  }, relationWarnings.value)
}
</script>

<template>
  <ModalDialog
    :title="row ? `编辑围栏 · ${row.name}` : '新增围栏'"
    eyebrow="GEOFENCE MAP EDITOR"
    size="wide"
    @close="emit('close')"
  >
    <div class="geofence-form">
      <section class="geofence-form__fields">
        <label class="geofence-field">
          <span>围栏名称 <em>*</em></span>
          <input v-model="name" class="field-control" type="text" maxlength="50" placeholder="请输入唯一的围栏名称" />
          <small v-if="isNameDuplicated">该名称已被其他围栏使用</small>
        </label>
        <label class="geofence-field">
          <span>围栏类型 <em>*</em></span>
          <select v-model="type" class="field-control"><option value="机场">机场</option><option value="城市">城市</option></select>
          <small>用于司机订单池区域筛选与接单服务区域设置</small>
        </label>
        <label class="geofence-field geofence-field--wide">
          <span>描述</span>
          <textarea v-model="description" class="form-textarea" maxlength="200" placeholder="请输入覆盖航站楼、行政区或服务范围说明（选填）"></textarea>
        </label>
      </section>

      <section class="geofence-map-section">
        <header class="geofence-map-section__header">
          <div><span>地图多边形标记 <em>*</em></span><p>点击地图依次添加顶点；拖动编号节点可微调边界。至少需要 3 个顶点。</p></div>
          <div class="geofence-map-toolbar">
            <button type="button" :disabled="!points.length" @click="undoPoint"><Undo2 :size="14" />撤销</button>
            <button type="button" :disabled="!points.length" @click="clearPoints"><Trash2 :size="14" />清空</button>
            <button type="button" @click="showOtherFences = !showOtherFences"><component :is="showOtherFences ? EyeOff : Eye" :size="14" />{{ showOtherFences ? '隐藏其他围栏' : '显示其他围栏' }}</button>
          </div>
        </header>

        <div class="geofence-map-layout">
          <div class="geofence-map">
            <svg
              :viewBox="viewBox"
              aria-label="围栏绘制地图"
              role="application"
              @click="addPoint"
              @pointermove="movePoint"
              @pointerup="stopDrag"
              @pointerleave="stopDrag"
            >
              <defs>
                <pattern id="geofence-grid" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M 6 0 L 0 0 0 6" fill="none" stroke="#d7e2e9" stroke-width=".35" /></pattern>
              </defs>
              <rect width="100" height="100" fill="#edf3f6" />
              <rect width="100" height="100" fill="url(#geofence-grid)" opacity=".72" />
              <path class="geofence-road geofence-road--major" d="M4 87 C24 73 36 66 48 54 S70 30 96 17" />
              <path class="geofence-road" d="M12 5 C17 25 27 38 44 48 S72 68 91 95" />
              <path class="geofence-road" d="M1 38 C21 43 39 34 56 28 S81 24 99 32" />
              <path class="geofence-water" d="M70 -4 C62 18 72 30 65 48 S52 75 61 104" />
              <g class="geofence-map-labels"><text x="16" y="20">Manchester</text><text x="38" y="48">Birmingham</text><text x="57" y="65">London</text><text x="63" y="54">Cambridge</text><text x="47" y="73">Heathrow</text><text x="58" y="81">Gatwick</text></g>

              <g v-if="showOtherFences" class="geofence-existing-layer">
                <polygon v-for="fence in existingFences" :key="fence.id" :points="fence.points.map((point) => `${point.x},${point.y}`).join(' ')" />
              </g>
              <polyline v-if="points.length > 1" class="geofence-draft-line" :points="pointString" />
              <polygon v-if="points.length >= 3" class="geofence-draft-polygon" :points="pointString" />
              <g v-for="(point, index) in points" :key="`${index}-${point.x}-${point.y}`" class="geofence-vertex" :transform="`translate(${point.x} ${point.y})`" @pointerdown="startDrag(index, $event)">
                <circle r="2.7" /><text y=".75">{{ index + 1 }}</text>
              </g>
            </svg>
            <div class="geofence-map__hint"><MapPinned :size="14" /><span>{{ points.length ? '继续点击添加顶点，或拖动节点调整边界' : '从地图任意位置开始绘制围栏' }}</span></div>
            <div class="geofence-map__zoom" aria-label="地图缩放控制">
              <button type="button" :disabled="zoom <= 1" aria-label="缩小地图" @click="changeZoom(-.2)"><Minus :size="14" /></button>
              <button type="button" aria-label="重置地图缩放" @click="zoom = 1">{{ Math.round(zoom * 100) }}%</button>
              <button type="button" :disabled="zoom >= 2" aria-label="放大地图" @click="changeZoom(.2)"><Plus :size="14" /></button>
            </div>
          </div>

          <aside class="geofence-map-summary">
            <div class="geofence-map-summary__metrics">
              <article><span>顶点数</span><strong>{{ points.length }}</strong><small>{{ points.length >= 3 ? '满足保存要求' : `还需 ${3 - points.length} 个` }}</small></article>
              <article><span>面积指数</span><strong>{{ areaIndex }}</strong><small>接入地图后换算 km²</small></article>
            </div>
            <section class="geofence-relation" :class="`geofence-relation--${geometryRelation === '正常' ? 'normal' : geometryRelation.includes('交叠') ? 'warning' : 'info'}`">
              <component :is="geometryRelation.includes('交叠') ? AlertTriangle : geometryRelation.includes('包含') ? Info : Check" :size="16" />
              <div><strong>{{ geometryRelation }}</strong><p v-if="!relationWarnings.length">当前边界未检测到与其他围栏交叠。</p><p v-else-if="geometryRelation.includes('交叠')">与「{{ relationWarnings.filter((item) => item.type === 'overlap').map((item) => item.name).join('、') }}」存在部分交叠，允许保存但建议调整。</p><p v-else>与「{{ relationWarnings.map((item) => item.name).join('、') }}」存在包含关系；下单匹配时更小围栏优先。</p></div>
            </section>
            <section class="geofence-point-list">
              <header><span>顶点坐标</span><button v-if="points.length" type="button" @click="zoom = 1"><LocateFixed :size="13" />定位全图</button></header>
              <div v-if="points.length"><span v-for="(point, index) in points" :key="index"><b>{{ index + 1 }}</b><code>{{ point.x.toFixed(2) }}, {{ point.y.toFixed(2) }}</code></span></div>
              <p v-else>尚未添加顶点。</p>
            </section>
          </aside>
        </div>
      </section>

      <p v-if="validationError" class="geofence-validation"><AlertTriangle :size="15" />{{ validationError }}</p>
      <p class="geofence-save-note"><Info :size="15" />围栏修改仅影响新订单的路线匹配，已有订单继续使用创建时锁定的围栏与路线。</p>
    </div>

    <template #footer>
      <button class="btn btn--secondary" type="button" @click="emit('close')">取消</button>
      <button class="btn btn--brand" type="button" @click="save"><Check :size="14" />保存围栏</button>
    </template>
  </ModalDialog>
</template>

<style scoped>
.geofence-form { display: grid; gap: 16px; }
.geofence-form__fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
.geofence-field { display: flex; min-width: 0; flex-direction: column; gap: 5px; }
.geofence-field--wide { grid-column: 1 / -1; }
.geofence-field > span, .geofence-map-section__header span { color: var(--text-subtle); font-size: 9px; font-weight: 700; }
.geofence-field em, .geofence-map-section__header em { color: var(--danger); font-style: normal; }
.geofence-field small { color: var(--text-faint); font-size: 8px; line-height: 1.45; }
.geofence-field .field-control { width: 100%; }
.geofence-map-section { overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-xl); background: var(--surface); }
.geofence-map-section__header { display: flex; align-items: center; justify-content: space-between; padding: 13px 14px; gap: 16px; border-bottom: 1px solid var(--border); background: var(--page); }
.geofence-map-section__header p { margin: 3px 0 0; color: var(--text-faint); font-size: 8px; }
.geofence-map-toolbar { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 5px; }
.geofence-map-toolbar button, .geofence-point-list button { display: inline-flex; min-height: 28px; align-items: center; padding: 0 8px; gap: 4px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); color: var(--text-muted); font-size: 8px; font-weight: 700; }
.geofence-map-toolbar button:hover:not(:disabled), .geofence-point-list button:hover { border-color: var(--ink-300); color: var(--ink-700); }
.geofence-map-toolbar button:disabled { opacity: .42; }
.geofence-map-layout { display: grid; grid-template-columns: minmax(0, 1.8fr) minmax(210px, .72fr); min-height: 390px; }
.geofence-map { position: relative; min-height: 390px; overflow: hidden; border-right: 1px solid var(--border); background: #edf3f6; }
.geofence-map svg { display: block; width: 100%; height: 100%; min-height: 390px; cursor: crosshair; touch-action: none; }
.geofence-road { fill: none; stroke: rgba(255,255,255,.95); stroke-width: 1.2; }
.geofence-road--major { stroke: #fff; stroke-width: 2.3; }
.geofence-water { fill: none; stroke: rgba(120,185,215,.42); stroke-width: 2.8; }
.geofence-map-labels text { fill: #8499a5; font-family: var(--font-mono); font-size: 2.15px; pointer-events: none; }
.geofence-existing-layer polygon { fill: rgba(45,99,152,.08); stroke: rgba(45,99,152,.38); stroke-width: .45; stroke-dasharray: 1.2 .8; pointer-events: none; }
.geofence-draft-line { fill: none; stroke: var(--brand); stroke-width: .65; stroke-linecap: round; stroke-linejoin: round; pointer-events: none; }
.geofence-draft-polygon { fill: rgba(245,124,0,.18); stroke: var(--brand); stroke-width: .75; stroke-linejoin: round; pointer-events: none; }
.geofence-vertex { cursor: grab; }
.geofence-vertex:active { cursor: grabbing; }
.geofence-vertex circle { fill: var(--brand); stroke: #fff; stroke-width: .65; filter: drop-shadow(0 1px 1px rgba(8,28,48,.2)); }
.geofence-vertex text { fill: #fff; font-family: var(--font-mono); font-size: 2.2px; font-weight: 800; text-anchor: middle; pointer-events: none; user-select: none; }
.geofence-map__hint { position: absolute; bottom: 10px; left: 10px; display: inline-flex; max-width: calc(100% - 150px); min-height: 30px; align-items: center; padding: 0 10px; gap: 6px; border: 1px solid rgba(255,255,255,.85); border-radius: var(--radius-pill); background: rgba(255,255,255,.9); color: var(--ink-600); font-size: 8px; box-shadow: var(--shadow-sm); backdrop-filter: blur(5px); }
.geofence-map__zoom { position: absolute; top: 10px; right: 10px; display: inline-flex; overflow: hidden; border: 1px solid var(--border); border-radius: var(--radius-md); background: rgba(255,255,255,.94); box-shadow: var(--shadow-sm); }
.geofence-map__zoom button { display: inline-flex; width: 32px; height: 30px; align-items: center; justify-content: center; border-right: 1px solid var(--border); background: transparent; color: var(--ink-700); font-size: 7px; }
.geofence-map__zoom button:nth-child(2) { width: 46px; }
.geofence-map__zoom button:last-child { border-right: 0; }
.geofence-map__zoom button:disabled { opacity: .4; }
.geofence-map-summary { display: flex; min-width: 0; flex-direction: column; padding: 12px; gap: 10px; background: var(--page); }
.geofence-map-summary__metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
.geofence-map-summary__metrics article { padding: 10px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.geofence-map-summary__metrics span, .geofence-map-summary__metrics small { display: block; color: var(--text-faint); font-size: 7px; }
.geofence-map-summary__metrics strong { display: block; margin: 3px 0 1px; color: var(--text-strong); font-family: var(--font-display); font-size: 16px; }
.geofence-relation { display: flex; align-items: flex-start; padding: 10px; gap: 8px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); color: var(--ink-600); }
.geofence-relation--normal { border-color: #bce8ce; background: #f2fbf6; color: var(--success); }
.geofence-relation--warning { border-color: #ffd5a5; background: #fff8ef; color: var(--warning); }
.geofence-relation--info { border-color: #bfd5e8; background: #f1f7fc; color: var(--ink-600); }
.geofence-relation strong { display: block; color: currentColor; font-size: 9px; }
.geofence-relation p { margin: 3px 0 0; color: var(--text-muted); font-size: 8px; line-height: 1.5; }
.geofence-point-list { overflow: hidden; min-height: 0; flex: 1; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.geofence-point-list header { display: flex; align-items: center; justify-content: space-between; padding: 8px 9px; border-bottom: 1px solid var(--border); color: var(--text-subtle); font-size: 8px; font-weight: 700; }
.geofence-point-list header button { min-height: 24px; border: 0; padding: 0 3px; }
.geofence-point-list > div { display: grid; max-height: 170px; overflow: auto; padding: 7px; gap: 4px; }
.geofence-point-list > div > span { display: flex; align-items: center; justify-content: space-between; padding: 5px 7px; border-radius: var(--radius-sm); background: var(--page); }
.geofence-point-list b { display: inline-flex; width: 17px; height: 17px; align-items: center; justify-content: center; border-radius: 50%; background: var(--brand); color: #fff; font-size: 7px; }
.geofence-point-list code { color: var(--text-muted); font-family: var(--font-mono); font-size: 7px; }
.geofence-point-list > p { padding: 18px 10px; margin: 0; color: var(--text-faint); font-size: 8px; text-align: center; }
.geofence-validation, .geofence-save-note { display: flex; align-items: flex-start; padding: 10px 11px; margin: 0; gap: 7px; border-radius: var(--radius-md); font-size: 9px; line-height: 1.5; }
.geofence-validation { background: var(--danger-bg); color: var(--danger); }
.geofence-save-note { background: var(--ink-50); color: var(--text-muted); }
@media (max-width: 900px) {
  .geofence-map-layout { grid-template-columns: 1fr; }
  .geofence-map { border-right: 0; border-bottom: 1px solid var(--border); }
  .geofence-map-section__header { align-items: flex-start; flex-direction: column; }
  .geofence-map-toolbar { justify-content: flex-start; }
}
@media (max-width: 640px) {
  .geofence-form__fields { grid-template-columns: 1fr; }
  .geofence-field--wide { grid-column: auto; }
}
</style>
