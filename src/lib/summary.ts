import type { MedName } from '@/lib/csv'
import { addDays } from '@/lib/dates'
import {
  type DayEntry,
  isEmptyEntry,
  type N1Document,
  NUMERIC_FIELDS,
  type NumericField,
} from '@/types'

export type SummaryRange = 14 | 30 | 90
export type SummaryOptions = {
  endDate: string
  days: SummaryRange
  includeNotes: boolean
  includeCraving: boolean
}
export type FieldStat = {
  key: NumericField
  recorded: number
  min: number
  median: number
  max: number
}
export type Summary = {
  from: string
  to: string
  daysRecorded: number
  daysMissing: number
  meds: { name: string; unit: string; values: (number | null)[] }[]
  fields: FieldStat[]
  notes: { date: string; text: string }[]
  openTopics: string[]
}

function rangeDates({ endDate, days }: SummaryOptions): string[] {
  return Array.from({ length: days }, (_, i) => addDays(endDate, i - days + 1))
}

function shownFields(doc: N1Document, options: SummaryOptions): NumericField[] {
  return NUMERIC_FIELDS.filter(
    (field) =>
      doc.settings.enabledFields[field] && (field !== 'sovargas' || options.includeCraving),
  )
}

export function buildSummary(doc: N1Document, options: SummaryOptions, medName: MedName): Summary {
  const dates = rangeDates(options)
  const entries = dates.map((date) => doc.entries[date]).filter((entry) => entry !== undefined)
  const recorded = entries.filter((entry) => !isEmptyEntry(entry)).length
  const notesShown = options.includeNotes && doc.settings.enabledFields.jegyzet
  return {
    from: dates[0],
    to: options.endDate,
    daysRecorded: recorded,
    daysMissing: dates.length - recorded,
    meds: doc.settings.meds
      .map((med, index) => ({ med, name: medName(med, index) }))
      .filter(({ med }) => med.enabled)
      .map(({ med, name }) => ({
        name,
        unit: med.unit.trim(),
        values: dates.map((date) => doc.entries[date]?.meds?.[med.id] ?? null),
      })),
    fields: shownFields(doc, options)
      .map((key) => stat(key, entries))
      .filter((field): field is FieldStat => field !== null),
    notes: notesShown
      ? entries.flatMap((entry) =>
          entry.jegyzet?.trim() ? [{ date: entry.date, text: entry.jegyzet }] : [],
        )
      : [],
    openTopics: doc.topics.filter((topic) => !topic.done).map((topic) => topic.text),
  }
}

function stat(key: NumericField, entries: DayEntry[]): FieldStat | null {
  const values = entries.flatMap((entry) => (entry[key] === undefined ? [] : [entry[key]]))
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
  return { key, recorded: values.length, min: sorted[0], median, max: sorted[sorted.length - 1] }
}

// The CSV that goes with a summary holds the same days and leaves out the same things.
export function summaryDocument(
  doc: N1Document,
  options: SummaryOptions,
  medName: MedName,
): N1Document {
  // Name unlabelled medications before filtering, so "Gyógyszer 2" keeps its number.
  const meds = doc.settings.meds
    .map((med, index) => ({ ...med, label: medName(med, index) }))
    .filter((med) => med.enabled)
  const fields = shownFields(doc, options)
  const notes = options.includeNotes && doc.settings.enabledFields.jegyzet
  const entries: Record<string, DayEntry> = {}
  for (const date of rangeDates(options)) {
    const entry = doc.entries[date]
    if (!entry) continue
    const kept: DayEntry = { date }
    const medValues = meds.flatMap((med) => {
      const value = entry.meds?.[med.id]
      return value === undefined ? [] : [[med.id, value] as const]
    })
    if (medValues.length > 0) kept.meds = Object.fromEntries(medValues)
    for (const field of fields) if (entry[field] !== undefined) kept[field] = entry[field]
    if (notes && entry.jegyzet) kept.jegyzet = entry.jegyzet
    entries[date] = kept
  }
  return { ...doc, entries, settings: { ...doc.settings, meds } }
}
