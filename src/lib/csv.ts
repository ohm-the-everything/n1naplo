import type { DayEntry, Med } from '@/types'

// Minden gyógyszermező külön oszlop — a kikapcsoltak is, hogy a történeti
// adat sose maradjon ki a leletbemutatásból.
export function buildCsv(entries: DayEntry[], meds: Med[]): string {
  const header = [
    'datum',
    ...meds.map((med) => med.label),
    'alvas_ora',
    'izgalom',
    'szorongas',
    'unalom',
    'hangulat',
    'sovargas',
    'jegyzet',
  ]
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const rows = sorted.map((entry) => [
    entry.date,
    ...meds.map((med) => num(entry.meds?.[med.id])),
    num(entry.alvas),
    num(entry.izgalom),
    num(entry.szorongas),
    num(entry.unalom),
    num(entry.hangulat),
    num(entry.sovargas),
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
