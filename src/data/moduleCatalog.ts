import { coreModuleCatalog } from '@/data/moduleCatalog.core'
import { opsModuleCatalog } from '@/data/moduleCatalog.ops'
import type { ModuleCatalogEntry } from '@/data/moduleCatalog.types'

export const moduleCatalog: Record<string, ModuleCatalogEntry> = {
  ...coreModuleCatalog,
  ...opsModuleCatalog,
}
