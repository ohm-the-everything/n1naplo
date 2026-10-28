import { describe, expect, it } from 'vitest'
import { DOCUMENT_VERSION, type N1Document } from '@/types'
import { emptyDocument, medHasValues, parseDocument, parseJson, withEntry } from './document'

function sampleDocument(): N1Document {
  return {
    version: DOCUMENT_VERSION,
    entries: {
      '2026-10-27': {
        date: '2026-10-27',
        meds: { med1: 1, med2: 0.5 },
        alvas: 7.5,
        izgalom: 3,
        szorongas: 2,
        unalom: 4,
        hangulat: 3,
        sovargas: 0,
        jegyzet: 'ő ű 🙂',
      },
    },
    settings: {
      meds: [
        { id: 'med1', label: 'XR', unit: '10 mg tabletta', enabled: true },
        { id: 'med2', label: '', unit: '', enabled: false },
      ],
      reminderEnabled: true,
      reminderHour: 21,
      reminderMinute: 30,
      enabledFields: {
        alvas: true,
        izgalom: true,
        szorongas: true,
        unalom: true,
        hangulat: true,
        sovargas: false,
        jegyzet: true,
      },
      lastReviewOpen: '2026-10-20',
      onboardedAt: '2026-10-01T19:00:00.000Z',
      locale: 'hu',
      backup: { cloud: true, transfer: false },
      protection: { allowScreenshots: true, appLock: true },
    },
    topics: [{ id: 't1', text: 'Délutáni mélypont', done: false }],
  }
}

function withRawEntry(entry: Record<string, unknown>, key = '2026-10-27') {
  const doc = sampleDocument() as unknown as { entries: Record<string, unknown> }
  return { ...doc, entries: { [key]: { date: key, ...entry } } }
}

describe('parseDocument', () => {
  it('parseDocument accepts a v2 document unchanged', () => {
    const doc = sampleDocument()
    expect(parseDocument(structuredClone(doc))).toEqual({ ok: true, value: doc })
  })

  it('parseDocument rejects version 3 with newer-version', () => {
    expect(parseDocument({ ...sampleDocument(), version: 3 })).toEqual({
      ok: false,
      error: 'newer-version',
    })
  })

  it('parseDocument rejects an entry with izgalom 7 as invalid', () => {
    expect(parseDocument(withRawEntry({ izgalom: 7 }))).toEqual({ ok: false, error: 'invalid' })
  })

  it('parseDocument rejects the key "2026-02-30"', () => {
    expect(parseDocument(withRawEntry({ alvas: 8 }, '2026-02-30'))).toEqual({
      ok: false,
      error: 'invalid',
    })
  })

  it('rejects sleep that is not a half-hour step', () => {
    expect(parseDocument(withRawEntry({ alvas: 7.25 }))).toEqual({ ok: false, error: 'invalid' })
  })

  it('rejects a negative medication amount', () => {
    expect(parseDocument(withRawEntry({ meds: { med1: -1 } }))).toEqual({
      ok: false,
      error: 'invalid',
    })
  })

  it('drops unknown keys in an entry', () => {
    const parsed = parseDocument(withRawEntry({ izgalom: 2, mood: 'great' }))
    expect(parsed.ok && parsed.value.entries['2026-10-27']).toEqual({
      date: '2026-10-27',
      izgalom: 2,
    })
  })

  it('calls an object without a version not-n1', () => {
    expect(parseDocument({ entries: {} })).toEqual({ ok: false, error: 'not-n1' })
    expect(parseDocument([1, 2])).toEqual({ ok: false, error: 'not-n1' })
  })
})

describe('backup choices', () => {
  it('start off in a new diary', () => {
    expect(emptyDocument().settings.backup).toEqual({ cloud: false, transfer: false })
  })

  it('read as off when an older document does not have them', () => {
    const doc = sampleDocument() as unknown as { settings: Record<string, unknown> }
    const { backup: _dropped, ...settings } = doc.settings
    const parsed = parseDocument({ ...doc, settings })
    expect(parsed.ok && parsed.value.settings.backup).toEqual({ cloud: false, transfer: false })
  })

  it('reject a choice that is not true or false', () => {
    const doc = sampleDocument()
    const raw = { ...doc, settings: { ...doc.settings, backup: { cloud: 'yes', transfer: false } } }
    expect(parseDocument(raw)).toEqual({ ok: false, error: 'invalid' })
  })
})

describe('protection settings', () => {
  it('start with screenshots blocked and no app lock', () => {
    expect(emptyDocument().settings.protection).toEqual({ allowScreenshots: false, appLock: false })
  })

  it('read as the safe defaults when an older document does not have them', () => {
    const doc = sampleDocument() as unknown as { settings: Record<string, unknown> }
    const { protection: _dropped, ...settings } = doc.settings
    const parsed = parseDocument({ ...doc, settings })
    expect(parsed.ok && parsed.value.settings.protection).toEqual({
      allowScreenshots: false,
      appLock: false,
    })
  })

  it('reject a value that is not true or false', () => {
    const doc = sampleDocument()
    const protection = { allowScreenshots: 1, appLock: false }
    expect(parseDocument({ ...doc, settings: { ...doc.settings, protection } })).toEqual({
      ok: false,
      error: 'invalid',
    })
  })
})

describe('parseJson', () => {
  it('calls text that is not JSON not-json', () => {
    expect(parseJson('datum,izgalom\n2026-10-27,3')).toEqual({ ok: false, error: 'not-json' })
  })
})

describe('emptyDocument', () => {
  it('emptyDocument has reminders off and onboarding pending', () => {
    const { settings } = emptyDocument()
    expect(settings.reminderEnabled).toBe(false)
    expect(settings.onboardedAt).toBeNull()
    expect(settings.locale).toBe('auto')
    expect(settings.meds.map((med) => med.label)).toEqual(['', ''])
  })
})

describe('withEntry', () => {
  it('withEntry removes the day when the entry is empty', () => {
    const doc = sampleDocument()
    const next = withEntry(doc, { date: '2026-10-27', meds: {} })
    expect(next.entries).toEqual({})
    expect(Object.keys(doc.entries)).toEqual(['2026-10-27'])
  })
})

describe('medHasValues', () => {
  it('medHasValues is false for a new medication and true after one entry', () => {
    const doc = emptyDocument()
    expect(medHasValues(doc, 'med1')).toBe(false)
    const next = withEntry(doc, { date: '2026-10-28', meds: { med1: 0 } })
    expect(medHasValues(next, 'med1')).toBe(true)
    expect(medHasValues(next, 'med2')).toBe(false)
  })
})
