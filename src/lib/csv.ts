import type { DayEntry } from '@/types'

export function buildCsv(entries: DayEntry[], med1Label: string, med2Label: string): string {
  const header = [
    'datum',
    med1Label,
    med2Label,
    'alvas_ora',
    'izgalom',
    'unalom',
    'hangulat',
    'sovargas',
    'jegyzet',
  ]
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const rows = sorted.map((entry) => [
    entry.date,
    num(entry.med1),
    num(entry.med2),
    num(entry.alvas),
    num(entry.izgalom),
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
