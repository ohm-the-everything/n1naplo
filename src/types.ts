export type Locale = 'hu' | 'en'

// Empty label: the UI shows "Gyógyszer N". The unit locks once the field has values.
export type Med = { id: string; label: string; unit: string; enabled: boolean }

export type Topic = { id: string; text: string; done: boolean }

export type DayEntry = {
  date: string // ISO yyyy-MM-dd
  meds?: Record<string, number> // med id → darab
  alvas?: number
  izgalom?: number
  szorongas?: number
  unalom?: number
  hangulat?: number
  sovargas?: number
  jegyzet?: string
}

export const NUMERIC_FIELDS = [
  'alvas',
  'izgalom',
  'szorongas',
  'unalom',
  'hangulat',
  'sovargas',
] as const

export type NumericField = (typeof NUMERIC_FIELDS)[number]
export type FieldKey = NumericField | 'jegyzet'

export const ALL_FIELDS: FieldKey[] = [...NUMERIC_FIELDS, 'jegyzet']

export type Settings = {
  meds: Med[]
  reminderEnabled: boolean
  reminderHour: number
  reminderMinute: number
  enabledFields: Record<FieldKey, boolean>
  lastReviewOpen: string | null
  onboardedAt: string | null // null until onboarding is done
  locale: 'auto' | Locale
  backup: BackupChoice
  protection: Protection
}

// Opt-in copies for system backup and phone-to-phone transfer; both off by default.
export type BackupChoice = { cloud: boolean; transfer: boolean }

export type Protection = { allowScreenshots: boolean; appLock: boolean }

export const DOCUMENT_VERSION = 2

export type N1Document = {
  version: typeof DOCUMENT_VERSION
  entries: Record<string, DayEntry>
  settings: Settings
  topics: Topic[]
}

// An all-empty row is a data gap, not a stored zero.
export function isEmptyEntry(entry: DayEntry): boolean {
  const hasMed = Object.values(entry.meds ?? {}).some((value) => value !== undefined)
  return (
    !hasMed && NUMERIC_FIELDS.every((field) => entry[field] === undefined) && !entry.jegyzet?.trim()
  )
}
