import { describe, expect, it } from 'vitest'
import type { DayEntry } from '@/types'
import { buildCsv, escapeField } from './csv'

describe('buildCsv', () => {
  it('a fejlécben a felhasználó gyógyszercímkéi szerepelnek', () => {
    expect(buildCsv([], 'XR', 'IR')).toBe(
      'datum,XR,IR,alvas_ora,izgalom,unalom,hangulat,sovargas,jegyzet',
    )
  })

  it('a kitöltetlen mező üres cella — adatlyuk, nem nulla', () => {
    const entry: DayEntry = {
      date: '2026-08-17',
      med1: 2,
      med2: 1.5,
      izgalom: 3,
      hangulat: 4,
      sovargas: 0,
    }
    expect(buildCsv([entry], 'XR', 'IR').split('\n')[1]).toBe('2026-08-17,2,1.5,,3,,4,0,')
  })

  it('dátum szerint rendez', () => {
    const rows = buildCsv([{ date: '2026-08-17' }, { date: '2026-08-15' }], 'A', 'B').split('\n')
    expect(rows[1]).toContain('2026-08-15')
    expect(rows[2]).toContain('2026-08-17')
  })

  it('a vesszős-idézőjeles jegyzetet RFC 4180 szerint escape-eli', () => {
    const entry: DayEntry = { date: '2026-08-17', jegyzet: 'reggel jó, este "zaj"' }
    expect(buildCsv([entry], 'A', 'B').split('\n')[1]).toBe(
      '2026-08-17,,,,,,,,"reggel jó, este ""zaj"""',
    )
  })

  it('a szerkeszthető címkét is escape-eli', () => {
    expect(buildCsv([], 'XR, reggel', 'IR').startsWith('datum,"XR, reggel",IR')).toBe(true)
  })
})

describe('escapeField', () => {
  it('sortörést is idézőjelez', () => {
    expect(escapeField('két\nsor')).toBe('"két\nsor"')
  })
})
