import { readFileSync } from 'node:fs'
import fontkit from '@pdf-lib/fontkit'
import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { hu } from '@/i18n/hu'
import type { Summary } from './summary'
import { renderSummaryPdf } from './summaryPdf'

const font = (weight: string) =>
  new Uint8Array(
    readFileSync(new URL(`../assets/fonts/NotoSans-${weight}.subset.ttf`, import.meta.url)),
  )
const fonts = { regular: font('Regular'), bold: font('Bold') }

function summary(days: number, note = ''): Summary {
  const dates = Array.from(
    { length: days },
    (_, i) => `2026-08-${String((i % 28) + 1).padStart(2, '0')}`,
  )
  return {
    from: '2026-07-31',
    to: '2026-10-28',
    daysRecorded: days,
    daysMissing: 0,
    meds: [{ name: 'Gyógyszer 1', unit: '10 mg', values: dates.map((_, i) => (i % 3 ? 1 : null)) }],
    fields: [{ key: 'izgalom', recorded: days, min: 1, median: 2.5, max: 5 }],
    notes: note ? dates.map((date) => ({ date, text: note })) : [],
    openTopics: ['Délutáni mélypont — ő, ű'],
  }
}

describe('renderSummaryPdf', () => {
  it('renderSummaryPdf returns a PDF that renders Hungarian glyphs', async () => {
    const bytes = await renderSummaryPdf(summary(14, 'őszi fáradtság, ű'), hu, fonts)
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('%PDF')
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThanOrEqual(1)
    const regular = fontkit.create(fonts.regular)
    expect(regular.hasGlyphForCodePoint(0x151)).toBe(true)
    expect(regular.hasGlyphForCodePoint(0x171)).toBe(true)
  })

  it('renderSummaryPdf spreads 90 days of long notes over several pages', async () => {
    const long = 'Hosszú jegyzet a napról, ami több sorba tördelődik. '.repeat(6)
    const bytes = await renderSummaryPdf(summary(90, long), hu, fonts)
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThan(2)
  })

  it('draws text the font cannot show without failing', async () => {
    const bytes = await renderSummaryPdf(summary(14, 'emoji 🙂 és 漢字'), hu, fonts)
    expect((await PDFDocument.load(bytes)).getPageCount()).toBeGreaterThanOrEqual(1)
  })
})
