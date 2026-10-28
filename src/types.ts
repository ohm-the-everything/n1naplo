export type Locale = 'hu' | 'en'

// A címke és az egység üres is lehet: a felület ilyenkor a nyelvi helyőrzőt mutatja
// („Gyógyszer 1"). Az egység zárolt, amint a mezőben van adat (medHasValues).
export type Med = { id: string; label: string; unit: string; enabled: boolean }

// Két rendelés közt gyűlő kérdések/témák a következő orvosi vizitre.
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
  onboardedAt: string | null // ISO időpont; null = a bevezetés még hátravan
  locale: 'auto' | Locale
  backup: BackupChoice
}

// A napló másolata a rendszer mentésébe kerülhet — csak ha a felhasználó maga kéri.
// cloud: Google-fiók / iCloud; transfer: átköltözés új telefonra. Alapból mindkettő ki.
export type BackupChoice = { cloud: boolean; transfer: boolean }

export const DOCUMENT_VERSION = 2

// A teljes napló — ez megy fájlba, mentésbe, és ez jön vissza mindenhonnan.
export type N1Document = {
  version: typeof DOCUMENT_VERSION
  entries: Record<string, DayEntry>
  settings: Settings
  topics: Topic[]
}

// A teljesen üres sor adatlyuk, nem tárolt nulla.
export function isEmptyEntry(entry: DayEntry): boolean {
  const hasMed = Object.values(entry.meds ?? {}).some((value) => value !== undefined)
  return (
    !hasMed && NUMERIC_FIELDS.every((field) => entry[field] === undefined) && !entry.jegyzet?.trim()
  )
}
