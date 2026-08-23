export type Med = { id: string; label: string; enabled: boolean }

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
}

// A teljesen üres sor adatlyuk, nem tárolt nulla.
export function isEmptyEntry(entry: DayEntry): boolean {
  const hasMed = Object.values(entry.meds ?? {}).some((value) => value !== undefined)
  return (
    !hasMed && NUMERIC_FIELDS.every((field) => entry[field] === undefined) && !entry.jegyzet?.trim()
  )
}
