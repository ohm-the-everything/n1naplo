import { describe, expect, it } from 'vitest'
import { hu } from '@/i18n/hu'
import type { DayEntry, Med } from '@/types'
import { buildCsv, escapeField, parseCsv } from './csv'
import { emptyDocument } from './document'
import { medNamer } from './meds'

function csvOf(entries: DayEntry[], medList: Med[]): string {
  const base = emptyDocument()
  const doc = {
    ...base,
    entries: Object.fromEntries(entries.map((entry) => [entry.date, entry])),
    settings: { ...base.settings, meds: medList },
  }
  return buildCsv(doc, medName)
}

const medName = medNamer(hu)
const meds: Med[] = [
  { id: 'med1', label: 'XR', unit: '', enabled: true },
  { id: 'med2', label: 'IR', unit: '', enabled: true },
]

describe('buildCsv', () => {
  it('a fejlécben a gyógyszercímkék és a szorongás oszlop is szerepel', () => {
    expect(csvOf([], meds)).toBe(
      'datum,XR,IR,alvas_ora,izgalom,szorongas,unalom,hangulat,sovargas,jegyzet',
    )
  })

  it('minden gyógyszermező külön oszlop, a kitöltetlen mező üres cella', () => {
    const entry: DayEntry = {
      date: '2026-08-17',
      meds: { med1: 2, med2: 1.5 },
      izgalom: 3,
      szorongas: 2,
      hangulat: 4,
      sovargas: 0,
    }
    expect(csvOf([entry], meds).split('\n')[1]).toBe('2026-08-17,2,1.5,,3,2,,4,0,')
  })

  it('hozzáadott harmadik gyógyszermezővel is működik', () => {
    const three: Med[] = [...meds, { id: 'm3', label: 'Magnézium', unit: '', enabled: true }]
    const entry: DayEntry = { date: '2026-08-18', meds: { m3: 1 } }
    const rows = csvOf([entry], three).split('\n')
    expect(rows[0]).toBe(
      'datum,XR,IR,Magnézium,alvas_ora,izgalom,szorongas,unalom,hangulat,sovargas,jegyzet',
    )
    expect(rows[1]).toBe('2026-08-18,,,1,,,,,,,')
  })

  it('a kikapcsolt gyógyszermező is exportálódik — a történeti adat nem vész el', () => {
    const withDisabled: Med[] = [meds[0], { id: 'med2', label: 'IR', unit: '', enabled: false }]
    const entry: DayEntry = { date: '2026-08-17', meds: { med2: 1 } }
    expect(csvOf([entry], withDisabled).split('\n')[1]).toBe('2026-08-17,,1,,,,,,,')
  })

  it('dátum szerint rendez', () => {
    const rows = csvOf([{ date: '2026-08-17' }, { date: '2026-08-15' }], meds).split('\n')
    expect(rows[1]).toContain('2026-08-15')
    expect(rows[2]).toContain('2026-08-17')
  })

  it('a vesszős-idézőjeles jegyzetet RFC 4180 szerint escape-eli', () => {
    const entry: DayEntry = { date: '2026-08-17', jegyzet: 'reggel jó, este "zaj"' }
    expect(csvOf([entry], meds).split('\n')[1]).toBe('2026-08-17,,,,,,,,,"reggel jó, este ""zaj"""')
  })

  it('a szerkeszthető címkét is escape-eli', () => {
    const commaLabel: Med[] = [
      { id: 'med1', label: 'XR, reggel', unit: '', enabled: true },
      meds[1],
    ]
    expect(csvOf([], commaLabel).startsWith('datum,"XR, reggel",IR')).toBe(true)
  })
})

describe('escapeField', () => {
  it('sortörést is idézőjelez', () => {
    expect(escapeField('két\nsor')).toBe('"két\nsor"')
  })
})

describe('buildCsv headers', () => {
  it('names a medication column with its unit when it has one', () => {
    const withUnit: Med[] = [{ id: 'med1', label: 'XR', unit: '10 mg tabletta', enabled: true }]
    expect(csvOf([], withUnit).startsWith('datum,XR (10 mg tabletta),alvas_ora')).toBe(true)
  })

  it('names an unlabelled medication column by its place', () => {
    const unlabelled: Med[] = [{ id: 'med1', label: '', unit: '', enabled: true }]
    expect(csvOf([], unlabelled).startsWith('datum,Gyógyszer 1,alvas_ora')).toBe(true)
  })
})

describe('parseCsv', () => {
  it('parseCsv handles quotes, escaped quotes, embedded newlines, CRLF and BOM', () => {
    const text =
      '\uFEFFdatum,jegyzet\r\n2026-10-27,"azt mondta: ""jó""\r\nmásodik sor, vesszővel"\r\n2026-10-28,sima\n'
    expect(parseCsv(text)).toEqual([
      ['datum', 'jegyzet'],
      ['2026-10-27', 'azt mondta: "jó"\r\nmásodik sor, vesszővel'],
      ['2026-10-28', 'sima'],
    ])
  })

  it('buildCsv then parseCsv round-trips notes with ő, ű and emoji', () => {
    const note = 'ő és ű, "idézet"\nújsor 🙂'
    const rows = parseCsv(csvOf([{ date: '2026-10-27', jegyzet: note }], meds))
    expect(rows[1].at(-1)).toBe(note)
  })
})
