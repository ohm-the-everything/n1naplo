import { describe, expect, it } from 'vitest'
import type { DayEntry, Med } from '@/types'
import { buildCsv, escapeField } from './csv'

const meds: Med[] = [
  { id: 'med1', label: 'XR', unit: '', enabled: true },
  { id: 'med2', label: 'IR', unit: '', enabled: true },
]

describe('buildCsv', () => {
  it('a fejlécben a gyógyszercímkék és a szorongás oszlop is szerepel', () => {
    expect(buildCsv([], meds)).toBe(
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
    expect(buildCsv([entry], meds).split('\n')[1]).toBe('2026-08-17,2,1.5,,3,2,,4,0,')
  })

  it('hozzáadott harmadik gyógyszermezővel is működik', () => {
    const three: Med[] = [...meds, { id: 'm3', label: 'Magnézium', unit: '', enabled: true }]
    const entry: DayEntry = { date: '2026-08-18', meds: { m3: 1 } }
    const rows = buildCsv([entry], three).split('\n')
    expect(rows[0]).toBe(
      'datum,XR,IR,Magnézium,alvas_ora,izgalom,szorongas,unalom,hangulat,sovargas,jegyzet',
    )
    expect(rows[1]).toBe('2026-08-18,,,1,,,,,,,')
  })

  it('a kikapcsolt gyógyszermező is exportálódik — a történeti adat nem vész el', () => {
    const withDisabled: Med[] = [meds[0], { id: 'med2', label: 'IR', unit: '', enabled: false }]
    const entry: DayEntry = { date: '2026-08-17', meds: { med2: 1 } }
    expect(buildCsv([entry], withDisabled).split('\n')[1]).toBe('2026-08-17,,1,,,,,,,')
  })

  it('dátum szerint rendez', () => {
    const rows = buildCsv([{ date: '2026-08-17' }, { date: '2026-08-15' }], meds).split('\n')
    expect(rows[1]).toContain('2026-08-15')
    expect(rows[2]).toContain('2026-08-17')
  })

  it('a vesszős-idézőjeles jegyzetet RFC 4180 szerint escape-eli', () => {
    const entry: DayEntry = { date: '2026-08-17', jegyzet: 'reggel jó, este "zaj"' }
    expect(buildCsv([entry], meds).split('\n')[1]).toBe(
      '2026-08-17,,,,,,,,,"reggel jó, este ""zaj"""',
    )
  })

  it('a szerkeszthető címkét is escape-eli', () => {
    const commaLabel: Med[] = [
      { id: 'med1', label: 'XR, reggel', unit: '', enabled: true },
      meds[1],
    ]
    expect(buildCsv([], commaLabel).startsWith('datum,"XR, reggel",IR')).toBe(true)
  })
})

describe('escapeField', () => {
  it('sortörést is idézőjelez', () => {
    expect(escapeField('két\nsor')).toBe('"két\nsor"')
  })
})
