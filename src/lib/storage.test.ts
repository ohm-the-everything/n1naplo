import { describe, expect, it } from 'vitest'
import { migrateEntry, migrateSettings } from './storage'

describe('migrateEntry', () => {
  it('a régi med1/med2 mezőket a meds térképbe emeli át', () => {
    const migrated = migrateEntry({ date: '2026-08-18', med1: 2, med2: 1.5, izgalom: 3 })
    expect(migrated).toEqual({ date: '2026-08-18', meds: { med1: 2, med2: 1.5 }, izgalom: 3 })
  })

  it('az új formátumú bejegyzésen nem változtat', () => {
    const entry = { date: '2026-08-20', meds: { med1: 1 }, szorongas: 2 }
    expect(migrateEntry(entry)).toEqual(entry)
  })

  it('a részleges régi sort is átemeli (csak med2)', () => {
    expect(migrateEntry({ date: '2026-08-19', med2: 0.5 })).toEqual({
      date: '2026-08-19',
      meds: { med2: 0.5 },
    })
  })
})

describe('migrateSettings', () => {
  it('a régi med1Label/med2Label beállításból meds listát épít, a régi kapcsolóállást megtartva', () => {
    const migrated = migrateSettings({
      med1Label: 'XR',
      med2Label: 'IR',
      enabledFields: { med1: true, med2: false, izgalom: true },
    })
    expect(migrated.meds).toEqual([
      { id: 'med1', label: 'XR', enabled: true },
      { id: 'med2', label: 'IR', enabled: false },
    ])
  })

  it('tárolt beállítás nélkül az alapértelmezett két gyógyszermezőt adja', () => {
    const migrated = migrateSettings(null)
    expect(migrated.meds).toHaveLength(2)
    expect(migrated.meds.every((med) => med.enabled)).toBe(true)
  })

  it('az új szorongás mező alapból bekapcsolva jön régi beállítás mellé is', () => {
    const migrated = migrateSettings({ enabledFields: { izgalom: false } })
    expect(migrated.enabledFields.szorongas).toBe(true)
    expect(migrated.enabledFields.izgalom).toBe(false)
  })

  it('a már meds-listás beállítást változatlanul hagyja', () => {
    const meds = [{ id: 'abc', label: 'Retard', enabled: true }]
    expect(migrateSettings({ meds }).meds).toEqual(meds)
  })
})
