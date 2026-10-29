import { describe, expect, it } from 'vitest'
import { hu } from '@/i18n/hu'
import type { N1Document } from '@/types'
import {
  applyRestore,
  backupFileName,
  mergeCsv,
  readBackup,
  readImport,
  serializeBackup,
} from './backup'
import { emptyDocument, withEntry, withSettings } from './document'
import { medNamer } from './meds'

const medName = medNamer(hu)

function diary(): N1Document {
  let doc = emptyDocument()
  doc = withSettings(doc, {
    ...doc.settings,
    meds: [
      { id: 'med1', label: 'XR', unit: '10 mg', enabled: true },
      { id: 'med2', label: '', unit: '', enabled: true },
    ],
  })
  doc = withEntry(doc, { date: '2026-10-26', meds: { med1: 1 }, izgalom: 2, jegyzet: 'ő 🙂' })
  return withEntry(doc, { date: '2026-10-27', izgalom: 4 })
}

describe('backup files', () => {
  it('names the file by date', () => {
    expect(backupFileName('2026-10-28')).toBe('n1naplo-mentes-2026-10-28.json')
  })

  it('readBackup(serializeBackup(doc)) equals doc', () => {
    const doc = diary()
    expect(readBackup(serializeBackup(doc, '2026-10-28T20:00:00.000Z'))).toEqual({
      ok: true,
      value: doc,
    })
  })

  it('readBackup rejects newer version / plain text / a CSV file', () => {
    const newer = JSON.stringify({
      format: 'n1naplo-backup',
      exportedAt: '2027-01-01T00:00:00.000Z',
      document: { ...diary(), version: 3 },
    })
    expect(readBackup(newer)).toEqual({ ok: false, error: 'newer-version' })
    expect(readBackup('kedves napló')).toEqual({ ok: false, error: 'not-json' })
    expect(readBackup('datum,izgalom\n2026-10-27,3')).toEqual({ ok: false, error: 'not-json' })
    expect(readBackup(JSON.stringify(diary()))).toEqual({ ok: false, error: 'not-n1' })
  })

  it("restoring keeps this phone's backup choice and onboarding", () => {
    let current = emptyDocument()
    current = withSettings(current, {
      ...current.settings,
      backup: { cloud: false, transfer: true },
      onboardedAt: '2026-10-28T10:00:00.000Z',
    })
    const fromFile = withSettings(diary(), {
      ...diary().settings,
      backup: { cloud: true, transfer: false },
      onboardedAt: null,
    })
    const restored = applyRestore(current, fromFile)
    expect(restored.entries).toEqual(fromFile.entries)
    expect(restored.settings.meds).toEqual(fromFile.settings.meds)
    expect(restored.settings.backup).toEqual({ cloud: false, transfer: true })
    expect(restored.settings.onboardedAt).toBe('2026-10-28T10:00:00.000Z')
  })
})

describe('mergeCsv', () => {
  const merge = (text: string, doc = diary()) => mergeCsv(text, doc, medName)

  it('mergeCsv maps a column to the existing medication by label, case-insensitively', () => {
    const merged = merge('datum,xr (10 MG)\n2026-10-28,2')
    expect(merged.ok && merged.value.doc.entries['2026-10-28']).toEqual({
      date: '2026-10-28',
      meds: { med1: 2 },
    })
    expect(merged.ok && merged.value.addedMeds).toEqual([])
  })

  it('maps an unlabelled medication by its placeholder name', () => {
    const merged = merge('datum,Gyógyszer 2\n2026-10-28,0.5')
    expect(merged.ok && merged.value.doc.entries['2026-10-28']?.meds).toEqual({ med2: 0.5 })
  })

  it('mergeCsv creates a medication for an unknown column', () => {
    const merged = merge('datum,Magnézium\n2026-10-28,1')
    if (!merged.ok) throw new Error(merged.error)
    const added = merged.value.doc.settings.meds.at(-1)
    expect(added).toMatchObject({ label: 'Magnézium', unit: '', enabled: true })
    expect(merged.value.addedMeds).toEqual(['Magnézium'])
    expect(merged.value.doc.entries['2026-10-28']?.meds).toEqual({ [added?.id ?? '']: 1 })
  })

  it('mergeCsv replaces only the days in the file', () => {
    const merged = merge('datum,izgalom,jegyzet\n2026-10-27,1,új')
    if (!merged.ok) throw new Error(merged.error)
    expect(merged.value.days).toBe(1)
    expect(merged.value.doc.entries['2026-10-27']).toEqual({
      date: '2026-10-27',
      izgalom: 1,
      jegyzet: 'új',
    })
    expect(merged.value.doc.entries['2026-10-26']).toEqual(diary().entries['2026-10-26'])
  })

  it('mergeCsv rejects a row with izgalom 9 and changes nothing', () => {
    const doc = diary()
    const before = structuredClone(doc)
    expect(merge('datum,izgalom\n2026-10-28,3\n2026-10-29,9', doc)).toEqual({
      ok: false,
      error: 'invalid',
    })
    expect(doc).toEqual(before)
  })

  it('rejects a file whose header does not start with datum', () => {
    expect(merge('date,izgalom\n2026-10-28,3')).toEqual({ ok: false, error: 'not-n1' })
  })

  it('mergeCsv imports a CSV exported by the v0.1 debug build', () => {
    const v01 = [
      'datum,Gyógyszer 1,Gyógyszer 2,alvas_ora,izgalom,szorongas,unalom,hangulat,sovargas,jegyzet',
      '2026-08-17,2,1.5,7.5,3,2,4,3,1,"fáradt, de jó"',
      '2026-08-18,1,,8,,,,,,',
      '',
    ].join('\n')
    const merged = merge(v01, emptyDocument())
    if (!merged.ok) throw new Error(merged.error)
    expect(merged.value.addedMeds).toEqual([])
    expect(merged.value.days).toBe(2)
    expect(merged.value.doc.entries).toEqual({
      '2026-08-17': {
        date: '2026-08-17',
        meds: { med1: 2, med2: 1.5 },
        alvas: 7.5,
        izgalom: 3,
        szorongas: 2,
        unalom: 4,
        hangulat: 3,
        sovargas: 1,
        jegyzet: 'fáradt, de jó',
      },
      '2026-08-18': { date: '2026-08-18', meds: { med1: 1 }, alvas: 8 },
    })
  })
})

describe('readImport', () => {
  it('reads a backup file as a restore that says how many days it replaces', () => {
    const fromFile = diary()
    const result = readImport(
      { name: 'n1naplo-mentes-2026-10-28.json', text: serializeBackup(fromFile, 'x') },
      emptyDocument(),
      medName,
    )
    expect(result.ok && result.value).toMatchObject({
      kind: 'restore',
      daysBefore: 0,
      daysAfter: 2,
    })
  })

  it('reads a CSV export as an import, whatever its file name', () => {
    const result = readImport(
      { name: 'export (1).txt', text: '﻿datum,izgalom\n2026-10-28,3' },
      diary(),
      medName,
    )
    expect(result.ok && result.value).toMatchObject({ kind: 'csv', days: 1, addedMeds: [] })
  })

  it('passes a rejection through unchanged', () => {
    expect(readImport({ name: 'jegyzet.txt', text: 'semmi' }, diary(), medName)).toEqual({
      ok: false,
      error: 'not-json',
    })
  })
})
