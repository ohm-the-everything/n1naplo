import { labelWithUnit } from '@/lib/meds'
import type { Med, N1Document, NumericField } from '@/types'

export type MedName = (med: Med, index: number) => string

export const FIELD_COLUMNS: readonly (readonly [NumericField, string])[] = [
  ['alvas', 'alvas_ora'],
  ['izgalom', 'izgalom'],
  ['szorongas', 'szorongas'],
  ['unalom', 'unalom'],
  ['hangulat', 'hangulat'],
  ['sovargas', 'sovargas'],
]
export const NOTE_COLUMN = 'jegyzet'
export const DATE_COLUMN = 'datum'

export function medColumn(med: Med, index: number, medName: MedName): string {
  return labelWithUnit(medName(med, index), med.unit)
}

// Disabled medication fields are exported too.
export function buildCsv(doc: N1Document, medName: MedName): string {
  const { meds } = doc.settings
  const header = [
    DATE_COLUMN,
    ...meds.map((med, index) => medColumn(med, index, medName)),
    ...FIELD_COLUMNS.map(([, column]) => column),
    NOTE_COLUMN,
  ]
  const sorted = Object.values(doc.entries).sort((a, b) => a.date.localeCompare(b.date))
  const rows = sorted.map((entry) => [
    entry.date,
    ...meds.map((med) => num(entry.meds?.[med.id])),
    ...FIELD_COLUMNS.map(([field]) => num(entry[field])),
    entry.jegyzet ?? '',
  ])
  return [header, ...rows].map((row) => row.map(escapeField).join(',')).join('\n')
}

export function num(value: number | undefined): string {
  return value === undefined ? '' : String(value)
}

export function escapeField(field: string): string {
  return /[",\n\r]/.test(field) ? `"${field.replaceAll('"', '""')}"` : field
}

// RFC 4180, with optional BOM; empty rows are dropped.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const input = text.replace(/^\uFEFF/, '')
  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') {
        field += '"'
        i++
      } else if (char === '"') quoted = false
      else field += char
    } else if (char === '"') quoted = true
    else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else field += char
  }
  if (field !== '' || row.length > 0) rows.push([...row, field])
  return rows.filter((cells) => cells.some((cell) => cell !== ''))
}
