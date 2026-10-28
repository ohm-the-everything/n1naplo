import { parseIso, toIso } from '@/lib/dates'
import {
  ALL_FIELDS,
  type DayEntry,
  DOCUMENT_VERSION,
  type FieldKey,
  isEmptyEntry,
  type Locale,
  type Med,
  type N1Document,
  NUMERIC_FIELDS,
  type NumericField,
  type Settings,
  type Topic,
} from '@/types'

export type ParseError = 'not-json' | 'not-n1' | 'newer-version' | 'invalid'
export type Parsed<T> = { ok: true; value: T } | { ok: false; error: ParseError }

type Raw = Record<string, unknown>

const fail = (error: ParseError): { ok: false; error: ParseError } => ({ ok: false, error })

export function parseJson(text: string): Parsed<unknown> {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch {
    return fail('not-json')
  }
}

function allFieldsOn(): Record<FieldKey, boolean> {
  return Object.fromEntries(ALL_FIELDS.map((field) => [field, true])) as Record<FieldKey, boolean>
}

export function emptyDocument(): N1Document {
  return {
    version: DOCUMENT_VERSION,
    entries: {},
    settings: {
      meds: [
        { id: 'med1', label: '', unit: '', enabled: true },
        { id: 'med2', label: '', unit: '', enabled: true },
      ],
      reminderEnabled: false,
      reminderHour: 21,
      reminderMinute: 0,
      enabledFields: allFieldsOn(),
      lastReviewOpen: null,
      onboardedAt: null,
      locale: 'auto',
    },
    topics: [],
  }
}

// Az egyetlen kapu: a tárolt fájl, egy mentés és egy CSV-import is ezen megy át.
// Érvénytelen állapotot elutasít, sosem dob el csendben; az ismeretlen kulcsokat elhagyja.
export function parseDocument(raw: unknown): Parsed<N1Document> {
  if (!isRecord(raw) || typeof raw.version !== 'number') return fail('not-n1')
  if (raw.version > DOCUMENT_VERSION) return fail('newer-version')
  if (raw.version !== DOCUMENT_VERSION) return fail('not-n1')
  const entries = parseEntries(raw.entries)
  const settings = parseSettings(raw.settings)
  const topics = parseList(raw.topics, parseTopic)
  if (!entries || !settings || !topics) return fail('invalid')
  return { ok: true, value: { version: DOCUMENT_VERSION, entries, settings, topics } }
}

export function withEntry(doc: N1Document, entry: DayEntry): N1Document {
  const others = Object.entries(doc.entries).filter(([date]) => date !== entry.date)
  const entries = isEmptyEntry(entry) ? others : [...others, [entry.date, entry] as const]
  return { ...doc, entries: Object.fromEntries(entries) }
}

export function withTopics(doc: N1Document, topics: Topic[]): N1Document {
  return { ...doc, topics }
}

export function withSettings(doc: N1Document, settings: Settings): N1Document {
  return { ...doc, settings }
}

export function medHasValues(doc: N1Document, medId: string): boolean {
  return Object.values(doc.entries).some((entry) => entry.meds?.[medId] !== undefined)
}

const oneToFive = (value: number) => Number.isInteger(value) && value >= 1 && value <= 5

const SCALES: Record<NumericField, (value: number) => boolean> = {
  alvas: (value) => value >= 0 && value <= 24 && Number.isInteger(value * 2),
  izgalom: oneToFive,
  szorongas: oneToFive,
  unalom: oneToFive,
  hangulat: oneToFive,
  sovargas: (value) => Number.isInteger(value) && value >= 0 && value <= 5,
}

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isString = (value: unknown): value is string => typeof value === 'string'
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

// Valódi naptári nap: a 2026-02-30 nem az, mert a Date átfordítaná március 2-re.
function isRealDate(value: unknown): value is string {
  return isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && toIso(parseIso(value)) === value
}

function isIntIn(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max
}

function parseList<T>(raw: unknown, parseItem: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(raw)) return null
  const items = raw.map(parseItem)
  return items.every((item) => item !== null) ? (items as T[]) : null
}

function parseEntries(raw: unknown): Record<string, DayEntry> | null {
  if (!isRecord(raw)) return null
  const entries: Record<string, DayEntry> = {}
  for (const [date, value] of Object.entries(raw)) {
    const entry = isRealDate(date) ? parseEntry(date, value) : null
    if (!entry) return null
    entries[date] = entry
  }
  return entries
}

function parseEntry(date: string, raw: unknown): DayEntry | null {
  if (!isRecord(raw) || raw.date !== date) return null
  const entry: DayEntry = { date }
  for (const field of NUMERIC_FIELDS) {
    const value = raw[field]
    if (value === undefined) continue
    if (typeof value !== 'number' || !SCALES[field](value)) return null
    entry[field] = value
  }
  const meds = raw.meds === undefined ? undefined : parseMedValues(raw.meds)
  if (meds === null || (raw.jegyzet !== undefined && !isString(raw.jegyzet))) return null
  if (meds) entry.meds = meds
  if (raw.jegyzet !== undefined) entry.jegyzet = raw.jegyzet as string
  return entry
}

function parseMedValues(raw: unknown): Record<string, number> | null {
  if (!isRecord(raw)) return null
  const values = Object.entries(raw)
  const valid = values.every(
    ([id, value]) => id !== '' && typeof value === 'number' && Number.isFinite(value) && value >= 0,
  )
  return valid ? (Object.fromEntries(values) as Record<string, number>) : null
}

function parseSettings(raw: unknown): Settings | null {
  if (!isRecord(raw)) return null
  const meds = parseList(raw.meds, parseMed)
  const enabledFields = parseEnabledFields(raw.enabledFields)
  const reminder = parseReminder(raw)
  const marks = parseMarks(raw)
  if (!meds || new Set(meds.map((med) => med.id)).size !== meds.length) return null
  if (!enabledFields || !reminder || !marks) return null
  return { meds, enabledFields, ...reminder, ...marks }
}

function parseMed(raw: unknown): Med | null {
  if (!isRecord(raw)) return null
  const { id, label, unit, enabled } = raw
  if (!isString(id) || id === '' || !isString(label) || !isString(unit)) return null
  return isBoolean(enabled) ? { id, label, unit, enabled } : null
}

function parseTopic(raw: unknown): Topic | null {
  if (!isRecord(raw)) return null
  const { id, text, done } = raw
  return isString(id) && isString(text) && isBoolean(done) ? { id, text, done } : null
}

// Egy később hozzáadott mező alapból bekapcsolva jön, ha a tárolt beállítás még nem ismeri.
function parseEnabledFields(raw: unknown): Record<FieldKey, boolean> | null {
  if (!isRecord(raw)) return null
  const fields = allFieldsOn()
  for (const field of ALL_FIELDS) {
    const value = raw[field]
    if (value === undefined) continue
    if (!isBoolean(value)) return null
    fields[field] = value
  }
  return fields
}

function parseReminder(raw: Raw) {
  const { reminderEnabled, reminderHour, reminderMinute } = raw
  if (!isBoolean(reminderEnabled)) return null
  if (!isIntIn(reminderHour, 0, 23) || !isIntIn(reminderMinute, 0, 59)) return null
  return { reminderEnabled, reminderHour, reminderMinute }
}

const LOCALE_SETTINGS: readonly ('auto' | Locale)[] = ['auto', 'hu', 'en']

function parseMarks(raw: Raw) {
  const { lastReviewOpen, onboardedAt, locale } = raw
  if (lastReviewOpen !== null && !isRealDate(lastReviewOpen)) return null
  if (onboardedAt !== null && !isString(onboardedAt)) return null
  const localeSetting = LOCALE_SETTINGS.find((value) => value === locale)
  return localeSetting ? { lastReviewOpen, onboardedAt, locale: localeSetting } : null
}
