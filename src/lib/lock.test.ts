import { describe, expect, it } from 'vitest'
import { needsUnlock } from './lock'

const MINUTE = 60_000

describe('needsUnlock', () => {
  it('never locks when the app lock is off', () => {
    expect(needsUnlock(false, 0, 10 * MINUTE)).toBe(false)
  })

  it('locks after a minute or more in the background', () => {
    expect(needsUnlock(true, 0, MINUTE)).toBe(true)
  })

  it('locks when the clock went backwards while away', () => {
    expect(needsUnlock(true, 10 * MINUTE, 5 * MINUTE)).toBe(true)
  })

  it('stays open after a short switch, such as the share sheet', () => {
    expect(needsUnlock(true, 0, MINUTE - 1)).toBe(false)
  })
})
