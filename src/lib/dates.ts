const pad = (n: number) => String(n).padStart(2, '0')

export function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayIso(): string {
  return toIso(new Date())
}

// Helyi időzóna szerint értelmezett ISO-dátum — new Date('yyyy-MM-dd') UTC-ként
// parse-olna, ami éjfél körül napot csúsztatna.
export function parseIso(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDays(iso: string, delta: number): string {
  const date = parseIso(iso)
  date.setDate(date.getDate() + delta)
  return toIso(date)
}

export function daysBetween(fromIso: string, untilIso: string): number {
  return Math.round((parseIso(untilIso).getTime() - parseIso(fromIso).getTime()) / 86_400_000)
}

const huFormat = new Intl.DateTimeFormat('hu-HU', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

export function formatHu(iso: string): string {
  return huFormat.format(parseIso(iso))
}
