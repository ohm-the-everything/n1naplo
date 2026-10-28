import { describe, expect, it } from 'vitest'
import { fill } from './text'

describe('fill', () => {
  it('puts each value in its {placeholder}, every time it appears', () => {
    expect(fill('{a} nap → {b} nap ({a})', { a: 3, b: 10 })).toBe('3 nap → 10 nap (3)')
  })
})
