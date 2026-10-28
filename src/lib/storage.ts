import { Preferences } from '@capacitor/preferences'
import { hu } from '@/i18n/hu'
import {
  ALL_FIELDS,
  type DayEntry,
  type FieldKey,
  type Med,
  type Settings,
  type Topic,
} from '@/types'

const ENTRIES_KEY = 'entries'
const SETTINGS_KEY = 'settings'
const TOPICS_KEY = 'topics'

export function defaultSettings(): Settings {
  return {
    meds: [
      { id: 'med1', label: hu.settings.med1Default, unit: '', enabled: true },
      { id: 'med2', label: hu.settings.med2Default, unit: '', enabled: true },
    ],
    reminderEnabled: true,
    reminderHour: 21,
    reminderMinute: 0,
    enabledFields: Object.fromEntries(ALL_FIELDS.map((field) => [field, true])) as Record<
      FieldKey,
      boolean
    >,
    lastReviewOpen: null,
    onboardedAt: null,
    locale: 'auto',
  }
}

type LegacyEntry = DayEntry & { med1?: number; med2?: number }

// A v0.1 a gyógyszert fix med1/med2 mezőben tárolta — átemeljük a meds térképbe.
export function migrateEntry(raw: unknown): DayEntry {
  const { med1, med2, ...entry } = raw as LegacyEntry
  if (med1 === undefined && med2 === undefined) return entry
  const meds = { ...entry.meds }
  if (med1 !== undefined) meds.med1 = med1
  if (med2 !== undefined) meds.med2 = med2
  return { ...entry, meds }
}

type LegacySettings = Partial<Settings> & {
  med1Label?: string
  med2Label?: string
  enabledFields?: Partial<Record<string, boolean>>
}

export function migrateSettings(raw: unknown): Settings {
  const base = defaultSettings()
  if (!raw || typeof raw !== 'object') return base
  const {
    med1Label,
    med2Label,
    enabledFields: storedFields,
    meds: storedMeds,
    ...rest
  } = raw as LegacySettings

  // v0.1: med1Label/med2Label + enabledFields.med1/med2 → meds lista.
  const meds: Med[] =
    storedMeds?.map((med) => ({ ...med, unit: med.unit ?? '' })) ??
    base.meds.map((med, index) => ({
      ...med,
      label: (index === 0 ? med1Label : med2Label) ?? med.label,
      enabled: storedFields?.[med.id] ?? true,
    }))

  // Az új mezők (pl. szorongás) alapból bekapcsolva jönnek.
  const enabledFields = { ...base.enabledFields }
  for (const field of ALL_FIELDS) {
    const storedValue = storedFields?.[field]
    if (storedValue !== undefined) enabledFields[field] = storedValue
  }

  return { ...base, ...rest, meds, enabledFields }
}

export async function loadEntries(): Promise<Record<string, DayEntry>> {
  const { value } = await Preferences.get({ key: ENTRIES_KEY })
  if (!value) return {}
  const raw = JSON.parse(value) as Record<string, unknown>
  return Object.fromEntries(Object.entries(raw).map(([date, entry]) => [date, migrateEntry(entry)]))
}

export async function persistEntries(entries: Record<string, DayEntry>): Promise<void> {
  await Preferences.set({ key: ENTRIES_KEY, value: JSON.stringify(entries) })
}

export async function loadSettings(): Promise<Settings> {
  const { value } = await Preferences.get({ key: SETTINGS_KEY })
  return migrateSettings(value ? JSON.parse(value) : null)
}

export async function persistSettings(settings: Settings): Promise<void> {
  await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(settings) })
}

export async function loadTopics(): Promise<Topic[]> {
  const { value } = await Preferences.get({ key: TOPICS_KEY })
  return value ? JSON.parse(value) : []
}

export async function persistTopics(topics: Topic[]): Promise<void> {
  await Preferences.set({ key: TOPICS_KEY, value: JSON.stringify(topics) })
}
