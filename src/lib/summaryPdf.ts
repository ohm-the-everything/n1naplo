import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, type PDFFont, type PDFPage, rgb } from 'pdf-lib'
import type { Messages } from '@/i18n'
import { addDays } from '@/lib/dates'
import { labelWithUnit } from '@/lib/meds'
import type { Summary } from '@/lib/summary'
import { fill } from '@/lib/text'

type Fonts = { regular: Uint8Array; bold: Uint8Array }

const A4: [number, number] = [595.28, 841.89]
const MARGIN = 48
const WIDTH = A4[0] - 2 * MARGIN
const INK = rgb(0.17, 0.15, 0.14)
const MUTED = rgb(0.48, 0.45, 0.4)
const CELLS_PER_ROW = 15

class Writer {
  pages: PDFPage[] = []
  page!: PDFPage
  y = 0

  constructor(
    private pdf: PDFDocument,
    readonly regular: PDFFont,
    readonly bold: PDFFont,
    private continuation: string,
  ) {
    this.newPage()
  }

  newPage() {
    this.page = this.pdf.addPage(A4)
    this.pages.push(this.page)
    this.y = A4[1] - MARGIN
    if (this.pages.length > 1) this.line(this.continuation, { size: 8, color: MUTED, gap: 14 })
  }

  ensure(height: number) {
    if (this.y - height < MARGIN + 24) this.newPage()
  }

  line(
    text: string,
    o: { size?: number; font?: PDFFont; color?: typeof INK; x?: number; gap?: number } = {},
  ) {
    const size = o.size ?? 10
    this.ensure(size + 4)
    this.y -= size
    this.page.drawText(printable(text, o.font ?? this.regular), {
      x: MARGIN + (o.x ?? 0),
      y: this.y,
      size,
      font: o.font ?? this.regular,
      color: o.color ?? INK,
    })
    this.y -= o.gap ?? 5
  }

  paragraph(text: string, indent = 0) {
    for (const row of wrap(text, this.regular, 10, WIDTH - indent)) this.line(row, { x: indent })
  }

  heading(text: string) {
    this.ensure(40)
    this.y -= 10
    this.line(text, { size: 12, font: this.bold, gap: 8 })
  }

  cells(texts: string[], widths: number[], font = this.regular) {
    this.ensure(15)
    this.y -= 10
    let x = MARGIN
    texts.forEach((text, i) => {
      this.page.drawText(printable(text, font), { x, y: this.y, size: 9, font, color: INK })
      x += widths[i]
    })
    this.y -= 5
  }
}

// Characters the embedded font cannot draw (emoji, CJK) become "?" instead of failing.
function printable(text: string, font: PDFFont): string {
  const known = new Set(font.getCharacterSet())
  return [...text.replace(/\s+/g, ' ')]
    .map((char) => (known.has(char.codePointAt(0) ?? 0) ? char : '?'))
    .join('')
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const rows: string[] = []
  for (const paragraph of text.split(/\r?\n/)) {
    let row = ''
    for (const word of paragraph.split(' ')) {
      const next = row ? `${row} ${word}` : word
      if (font.widthOfTextAtSize(printable(next, font), size) <= width) row = next
      else {
        if (row) rows.push(row)
        row = word
      }
    }
    rows.push(row)
  }
  return rows
}

export async function renderSummaryPdf(
  summary: Summary,
  t: Messages,
  fonts: Fonts,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const regular = await pdf.embedFont(fonts.regular, { subset: true })
  const bold = await pdf.embedFont(fonts.bold, { subset: true })
  const range = `${summary.from} – ${summary.to}`
  const w = new Writer(pdf, regular, bold, `${t.appName} · ${t.summary.title} · ${range}`)
  const num = (value: number) => String(value).replace('.', t.summary.decimal)

  w.line(t.summary.title, { size: 16, font: bold, gap: 6 })
  w.line(`${t.appName} · ${range}`, { gap: 3 })
  w.line(fill(t.summary.generated, { date: new Date().toISOString().slice(0, 10) }), {
    color: MUTED,
    gap: 3,
  })
  w.line(t.summary.disclaimer, { color: MUTED, gap: 10 })
  const total = summary.daysRecorded + summary.daysMissing
  w.paragraph(
    fill(t.summary.days, { total, recorded: summary.daysRecorded, missing: summary.daysMissing }),
  )

  if (summary.fields.length > 0) {
    w.heading(t.summary.fieldsTitle)
    const widths = [170, 60, 60, 70, 60]
    const head = [
      t.summary.colField,
      t.summary.colDays,
      t.summary.colMin,
      t.summary.colMedian,
      t.summary.colMax,
    ]
    w.cells(head, widths, bold)
    for (const f of summary.fields) {
      w.cells([t.fields[f.key], String(f.recorded), num(f.min), num(f.median), num(f.max)], widths)
    }
  }

  if (summary.openTopics.length > 0) {
    w.heading(t.summary.topicsTitle)
    for (const topic of summary.openTopics) w.paragraph(`• ${topic}`, 0)
  }

  if (summary.meds.length > 0) {
    w.heading(t.summary.medsTitle)
    w.line(t.summary.medsLegend, { size: 8, color: MUTED })
    const cell = (WIDTH - 50) / CELLS_PER_ROW
    for (const med of summary.meds) {
      w.line(labelWithUnit(med.name, med.unit), { font: bold, gap: 2 })
      for (let start = 0; start < med.values.length; start += CELLS_PER_ROW) {
        const row = med.values.slice(start, start + CELLS_PER_ROW)
        const day = addDays(summary.from, start).slice(5)
        w.cells([day, ...row.map((v) => (v === null ? '·' : num(v)))], [50, ...row.map(() => cell)])
      }
      w.y -= 4
    }
  }

  if (summary.notes.length > 0) {
    w.heading(t.summary.notesTitle)
    for (const note of summary.notes) {
      w.line(note.date, { font: bold, gap: 2 })
      w.paragraph(note.text)
      w.y -= 3
    }
  }

  w.pages.forEach((page, i) => {
    page.drawText(t.summary.site, {
      x: MARGIN,
      y: MARGIN - 18,
      size: 8,
      font: regular,
      color: MUTED,
    })
    const label = `${i + 1}/${w.pages.length}`
    const x = A4[0] - MARGIN - regular.widthOfTextAtSize(label, 8)
    page.drawText(label, { x, y: MARGIN - 18, size: 8, font: regular, color: MUTED })
  })
  return pdf.save()
}
