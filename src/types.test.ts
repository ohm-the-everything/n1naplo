import { describe, expect, it } from 'vitest'
import { isEmptyEntry } from './types'

describe('isEmptyEntry', () => {
  it('a csak gyógyszeradatot tartalmazó sor nem üres', () => {
    expect(isEmptyEntry({ date: '2026-08-23', meds: { med1: 1 } })).toBe(false)
  })

  it('az üres meds térkép önmagában nem tesz kitöltötté', () => {
    expect(isEmptyEntry({ date: '2026-08-23', meds: {} })).toBe(true)
  })

  it('a szorongás kitöltése kitöltötté teszi a sort', () => {
    expect(isEmptyEntry({ date: '2026-08-23', szorongas: 3 })).toBe(false)
  })

  it('a mindenütt üres sor üres', () => {
    expect(isEmptyEntry({ date: '2026-08-23' })).toBe(true)
  })
})
