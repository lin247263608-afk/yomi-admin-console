import type { BadgeTone } from '@/types'

export type ModuleCellValue = string | number | boolean | null | Array<Record<string, string | number>>

export interface ModuleMetric {
  label: string
  value: string
  note: string
  tone?: 'default' | 'brand' | 'success' | 'warning' | 'danger'
  group?: 'total' | 'connection' | 'permission'
  filter?: {
    key: string
    value: string
  }
}

export interface ModuleFilter {
  key: string
  label: string
  options: string[]
}

export interface ModuleColumn {
  key: string
  label: string
  kind?: 'plain' | 'primary' | 'mono' | 'status' | 'currency' | 'progress' | 'image'
  secondaryKey?: string
  width?: string
}

export interface ModuleRow {
  id: string
  status?: string
  [key: string]: ModuleCellValue | undefined
}

export interface ModuleRowAction {
  label: string
  mode: 'notify' | 'advance' | 'toggle'
  nextStatus?: string
  activeStatus?: string
  inactiveStatus?: string
  completedLabel?: string
  tone?: BadgeTone
}

export interface ModuleTrendPanel {
  title: string
  caption: string
  unit: string
  labels: string[]
  values: number[]
  breakdowns: Array<{
    label: string
    value: string
    note: string
    tone?: 'default' | 'brand' | 'success' | 'warning' | 'danger'
  }>
}

export interface ModuleSettingField {
  key: string
  label: string
  value: string | boolean
  type: 'text' | 'number' | 'select' | 'switch' | 'textarea'
  unit?: string
  help?: string
  options?: string[]
}

export interface ModuleSettingSection {
  title: string
  description: string
  fields: ModuleSettingField[]
}

export interface ModuleCatalogEntry {
  kind: 'table' | 'dashboard' | 'settings'
  eyebrow: string
  description: string
  /** Optional page chrome switches used when a module needs a denser layout. */
  showDescription?: boolean
  showInsight?: boolean
  showOverview?: boolean
  showSecondaryAction?: boolean
  insight: {
    label: string
    title: string
    description: string
  }
  metrics: ModuleMetric[]
  searchPlaceholder?: string
  filters?: ModuleFilter[]
  columns?: ModuleColumn[]
  rows?: ModuleRow[]
  primaryAction?: string
  secondaryAction?: string
  rowAction?: ModuleRowAction
  trendPanel?: ModuleTrendPanel
  settings?: ModuleSettingSection[]
  canCreate?: boolean
  canEdit?: boolean
}
