import { describe, expect, it } from 'vitest'
import type { DayEntry, N1Document } from '@/types'
import { addDays } from './dates'
import { emptyDocument, withEntry, withSettings, withTopics } from './document'
import { medName } from './meds'
import { buildSummary, summaryDocument } from './summary'

const END = '2026-10-28'
const base = { endDate: END, days: 14 as const, includeNotes: true, includeCraving: true }

function diary(entries: Omit<DayEntry, 'date'>[], end = END): N1Document {
  let doc = emptyDocument()
  doc = withSettings(doc, {
    ...doc.settings,
    meds: [
      { id: 'med1', label: 'XR', unit: '10 mg', enabled: true },
      { id: 'med2', label: '', unit: '', enabled: false },
    ],
  })
  entries.forEach((entry, i) => {
    doc = withEntry(doc, { ...entry, date: addDays(end, -i) })
  })
  return doc
}

describe('buildSummary', () => {
  it('buildSummary counts recorded and missing days in a 14-day range', () => {
    const doc = diary([{ izgalom: 3 }, {}, { izgalom: 2 }])
    const summary = buildSummary(doc, base, medName)
    expect(summary).toMatchObject({ from: '2026-10-15', to: END, daysRecorded: 2, daysMissing: 12 })
  })

  it('buildSummary uses the mean of the middle pair as an even-count median', () => {
    const doc = diary([{ izgalom: 1 }, { izgalom: 5 }, { izgalom: 2 }, { izgalom: 4 }])
    const stat = buildSummary(doc, base, medName).fields.find((f) => f.key === 'izgalom')
    expect(stat).toEqual({ key: 'izgalom', recorded: 4, min: 1, median: 3, max: 5 })
  })

  it('buildSummary leaves craving out when includeCraving is false', () => {
    const doc = diary([{ sovargas: 4, unalom: 2 }])
    const summary = buildSummary(doc, { ...base, includeCraving: false }, medName)
    expect(summary.fields.map((f) => f.key)).toEqual(['unalom'])
  })

  it('buildSummary lists only open topics', () => {
    const doc = withTopics(diary([]), [
      { id: 'a', text: 'Délutáni mélypont', done: false },
      { id: 'b', text: 'Már megbeszéltük', done: true },
    ])
    expect(buildSummary(doc, base, medName).openTopics).toEqual(['Délutáni mélypont'])
  })

  it('buildSummary picks the right 90 days out of 1,100', () => {
    const doc = diary(Array.from({ length: 1100 }, () => ({ hangulat: 3 })))
    const summary = buildSummary(doc, { ...base, days: 90 }, medName)
    expect(summary).toMatchObject({ from: '2026-07-31', to: END, daysRecorded: 90, daysMissing: 0 })
  })

  it('shows enabled medications by name and unit, one value per day, oldest first', () => {
    const doc = diary([{ meds: { med1: 2 } }, {}, { meds: { med1: 0.5, med2: 9 } }])
    const meds = buildSummary(doc, base, medName).meds
    expect(meds).toHaveLength(1)
    expect(meds[0]).toMatchObject({ name: 'XR', unit: '10 mg' })
    expect(meds[0].values.slice(-3)).toEqual([0.5, null, 2])
  })

  it('includes notes only on request', () => {
    const doc = diary([{ jegyzet: 'ma jobb' }])
    expect(buildSummary(doc, base, medName).notes).toEqual([{ date: END, text: 'ma jobb' }])
    expect(buildSummary(doc, { ...base, includeNotes: false }, medName).notes).toEqual([])
  })
})

describe('summaryDocument', () => {
  it('keeps only the summary days and leaves out what the summary leaves out', () => {
    const doc = diary([
      { sovargas: 3, jegyzet: 'x', izgalom: 2 },
      ...Array(20).fill({ izgalom: 1 }),
    ])
    const narrowed = summaryDocument(
      doc,
      { ...base, includeNotes: false, includeCraving: false },
      medName,
    )
    expect(Object.keys(narrowed.entries)).toHaveLength(14)
    expect(narrowed.entries[END]).toEqual({ date: END, izgalom: 2 })
  })

  it('leaves out disabled medications, disabled fields and hidden notes, like the PDF', () => {
    let doc = diary([{ meds: { med1: 1, med2: 9 }, alvas: 7, izgalom: 2, jegyzet: 'titok' }])
    doc = withSettings(doc, {
      ...doc.settings,
      enabledFields: { ...doc.settings.enabledFields, alvas: false, jegyzet: false },
    })
    const narrowed = summaryDocument(doc, base, medName)
    expect(narrowed.settings.meds.map((med) => med.id)).toEqual(['med1'])
    expect(narrowed.entries[END]).toEqual({ date: END, meds: { med1: 1 }, izgalom: 2 })
  })
})
