export type DayEntry = {
  date: string // ISO yyyy-MM-dd
  med1?: number
  med2?: number
  alvas?: number
  izgalom?: number
  unalom?: number
  hangulat?: number
  sovargas?: number
  jegyzet?: string
}

export const NUMERIC_FIELDS = [
  'med1',
  'med2',
  'alvas',
  'izgalom',
  'unalom',
  'hangulat',
  'sovargas',
] as const

export type NumericField = (typeof NUMERIC_FIELDS)[number]
export type FieldKey = NumericField | 'jegyzet'

export const ALL_FIELDS: FieldKey[] = [...NUMERIC_FIELDS, 'jegyzet']

export type Settings = {
  med1Label: string
  med2Label: string
  reminderEnabled: boolean
  reminderHour: number
  reminderMinute: number
  enabledFields: Record<FieldKey, boolean>
  lastReviewOpen: string | null
}

// A teljesen üres sor adatlyuk, nem tárolt nulla.
export function isEmptyEntry(entry: DayEntry): boolean {
  return NUMERIC_FIELDS.every((field) => entry[field] === undefined) && !entry.jegyzet?.trim()
}
