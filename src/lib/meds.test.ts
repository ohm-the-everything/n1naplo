import { describe, expect, it } from 'vitest'
import { hu } from '@/i18n/hu'
import { labelWithUnit, medNamer } from './meds'

const medName = medNamer(hu)

describe('medName', () => {
  it('uses the label the user gave', () => {
    expect(medName({ id: 'a', label: ' XR ', unit: '', enabled: true }, 0)).toBe('XR')
  })

  it('numbers an unlabelled field by its place in the list', () => {
    expect(medName({ id: 'b', label: '  ', unit: '', enabled: true }, 1)).toBe('Gyógyszer 2')
  })
})

describe('labelWithUnit', () => {
  it('adds the unit in parentheses, and nothing when there is none', () => {
    expect(labelWithUnit('XR', ' 10 mg ')).toBe('XR (10 mg)')
    expect(labelWithUnit('XR', '')).toBe('XR')
  })
})
