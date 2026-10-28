import { describe, expect, it } from 'vitest'
import { medName } from './meds'

describe('medName', () => {
  it('uses the label the user gave', () => {
    expect(medName({ id: 'a', label: ' XR ', unit: '', enabled: true }, 0)).toBe('XR')
  })

  it('numbers an unlabelled field by its place in the list', () => {
    expect(medName({ id: 'b', label: '  ', unit: '', enabled: true }, 1)).toBe('Gyógyszer 2')
  })
})
