const pad = (n: number) => String(n).padStart(2, '0')

export function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayIso(): string {
  return toIso(new Date())
}

// Local time: new Date('yyyy-MM-dd') parses as UTC and shifts the day near midnight.
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
