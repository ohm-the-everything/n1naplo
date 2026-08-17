import { Preferences } from '@capacitor/preferences'
import { hu } from '@/i18n/hu'
import { ALL_FIELDS, type DayEntry, type FieldKey, type Settings } from '@/types'

const ENTRIES_KEY = 'entries'
const SETTINGS_KEY = 'settings'

export function defaultSettings(): Settings {
  return {
    med1Label: hu.settings.med1Default,
    med2Label: hu.settings.med2Default,
    reminderEnabled: true,
    reminderHour: 21,
    reminderMinute: 0,
    enabledFields: Object.fromEntries(ALL_FIELDS.map((field) => [field, true])) as Record<
      FieldKey,
      boolean
    >,
    lastReviewOpen: null,
  }
}

export async function loadEntries(): Promise<Record<string, DayEntry>> {
  const { value } = await Preferences.get({ key: ENTRIES_KEY })
  return value ? JSON.parse(value) : {}
}

export async function persistEntries(entries: Record<string, DayEntry>): Promise<void> {
  await Preferences.set({ key: ENTRIES_KEY, value: JSON.stringify(entries) })
}

export async function loadSettings(): Promise<Settings> {
  const { value } = await Preferences.get({ key: SETTINGS_KEY })
  if (!value) return defaultSettings()
  const stored = JSON.parse(value) as Partial<Settings>
  const base = defaultSettings()
  return {
    ...base,
    ...stored,
    enabledFields: { ...base.enabledFields, ...stored.enabledFields },
  }
}

export async function persistSettings(settings: Settings): Promise<void> {
  await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(settings) })
}
