import { describe, expect, it } from 'vitest'
import { nextOccurrences } from './reminder'

describe('nextOccurrences', () => {
  it('ha az időpont ma még nem jött el, ma kezd', () => {
    const now = new Date(2026, 7, 25, 20, 0)
    const dates = nextOccurrences(now, 21, 0, 3)
    expect(dates.map((d) => d.toISOString())).toEqual([
      new Date(2026, 7, 25, 21, 0).toISOString(),
      new Date(2026, 7, 26, 21, 0).toISOString(),
      new Date(2026, 7, 27, 21, 0).toISOString(),
    ])
  })

  it('ha az időpont ma már elmúlt, holnap kezd', () => {
    const now = new Date(2026, 7, 25, 21, 30)
    const dates = nextOccurrences(now, 21, 0, 2)
    expect(dates[0].getDate()).toBe(26)
    expect(dates[1].getDate()).toBe(27)
  })

  it('pontban az időpontban már a holnapit adja', () => {
    const now = new Date(2026, 7, 25, 21, 0)
    expect(nextOccurrences(now, 21, 0, 1)[0].getDate()).toBe(26)
  })

  it('hónapátlépésnél is jó napokat ad', () => {
    const now = new Date(2026, 7, 30, 22, 0)
    const dates = nextOccurrences(now, 21, 0, 3)
    expect(dates.map((d) => [d.getMonth(), d.getDate()])).toEqual([
      [7, 31],
      [8, 1],
      [8, 2],
    ])
  })
})
