import {
  DATE_COLUMN,
  FIELD_COLUMNS,
  type MedName,
  medColumn,
  NOTE_COLUMN,
  parseCsv,
} from '@/lib/csv'
import { type Parsed, parseDocument, parseJson, withEntry, withSettings } from '@/lib/document'
import type { DayEntry, Med, N1Document } from '@/types'

export const BACKUP_FORMAT = 'n1naplo-backup'

export function backupFileName(today: string): string {
  return `n1naplo-mentes-${today}.json`
}

export function serializeBackup(doc: N1Document, exportedAt: string): string {
  return JSON.stringify({ format: BACKUP_FORMAT, exportedAt, document: doc }, null, 2)
}

export function readBackup(text: string): Parsed<N1Document> {
  const json = parseJson(text)
  if (!json.ok) return json
  const raw = json.value as { format?: unknown; document?: unknown } | null
  if (typeof raw !== 'object' || raw === null || raw.format !== BACKUP_FORMAT) {
    return { ok: false, error: 'not-n1' }
  }
  return parseDocument(raw.document)
}

// The backup and onboarding choices belong to this phone, not to the file.
export function applyRestore(current: N1Document, restored: N1Document): N1Document {
  const { backup, onboardedAt } = current.settings
  return withSettings(restored, { ...restored.settings, backup, onboardedAt })
}

export type CsvMerge = { doc: N1Document; days: number; addedMeds: string[] }

type Reader = (entry: DayEntry, cell: string) => void

// Each row replaces its day; one bad value rejects the whole import.
export function mergeCsv(text: string, doc: N1Document, medName: MedName): Parsed<CsvMerge> {
  const [header, ...rows] = parseCsv(text)
  if (!header || header[0].trim().toLowerCase() !== DATE_COLUMN) {
    return { ok: false, error: 'not-n1' }
  }
  const meds = [...doc.settings.meds]
  const addedMeds: string[] = []
  const readers = header.slice(1).map((name) => {
    const reader = knownColumn(name.trim().toLowerCase())
    if (reader) return reader
    const med = findMed(meds, name, medName) ?? addMed(meds, addedMeds, name.trim())
    return medReader(med.id)
  })

  let merged = withSettings(doc, { ...doc.settings, meds })
  const dates = new Set<string>()
  for (const row of rows) {
    const entry: DayEntry = { date: row[0].trim() }
    for (const [index, read] of readers.entries()) read(entry, row[index + 1] ?? '')
    dates.add(entry.date)
    merged = withEntry(merged, entry)
  }
  const checked = parseDocument(merged)
  if (!checked.ok) return { ok: false, error: 'invalid' }
  return { ok: true, value: { doc: checked.value, days: dates.size, addedMeds } }
}

function knownColumn(name: string): Reader | null {
  if (name === NOTE_COLUMN) {
    return (entry, cell) => {
      if (cell !== '') entry.jegyzet = cell
    }
  }
  const field = FIELD_COLUMNS.find(([, column]) => column === name)?.[0]
  if (!field) return null
  return (entry, cell) => {
    const value = toNumber(cell)
    if (value !== undefined) entry[field] = value
  }
}

function medReader(id: string): Reader {
  return (entry, cell) => {
    const value = toNumber(cell)
    if (value !== undefined) entry.meds = { ...entry.meds, [id]: value }
  }
}

function findMed(meds: Med[], name: string, medName: MedName): Med | undefined {
  const wanted = name.trim().toLowerCase()
  return meds.find((med, index) => medColumn(med, index, medName).toLowerCase() === wanted)
}

function addMed(meds: Med[], addedMeds: string[], label: string): Med {
  const med: Med = { id: `med-${crypto.randomUUID().slice(0, 8)}`, label, unit: '', enabled: true }
  meds.push(med)
  addedMeds.push(label)
  return med
}

function toNumber(cell: string): number | undefined {
  const trimmed = cell.trim()
  return trimmed === '' ? undefined : Number(trimmed)
}

export type ImportPlan =
  | { kind: 'restore'; doc: N1Document; daysBefore: number; daysAfter: number }
  | ({ kind: 'csv' } & CsvMerge)

// A CSV is recognised by its header, not its file name.
export function readImport(
  file: { name: string; text: string },
  current: N1Document,
  medName: MedName,
): Parsed<ImportPlan> {
  if (/^﻿?datum\b/i.test(file.text.trimStart())) {
    const merged = mergeCsv(file.text, current, medName)
    return merged.ok ? { ok: true, value: { kind: 'csv', ...merged.value } } : merged
  }
  const restored = readBackup(file.text)
  if (!restored.ok) return restored
  const doc = applyRestore(current, restored.value)
  const daysBefore = Object.keys(current.entries).length
  const daysAfter = Object.keys(doc.entries).length
  return { ok: true, value: { kind: 'restore', doc, daysBefore, daysAfter } }
}
