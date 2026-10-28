import { useState } from 'react'
import { hu } from '@/i18n/hu'
import { buildCsv } from '@/lib/csv'
import { todayIso } from '@/lib/dates'
import { shareFile } from '@/lib/files'
import { labelWithUnit, medName } from '@/lib/meds'
import {
  buildSummary,
  type SummaryOptions,
  type SummaryRange,
  summaryDocument,
} from '@/lib/summary'
import { fill } from '@/lib/text'
import type { N1Document } from '@/types'

type Props = {
  doc: N1Document
  onBack: () => void
}

const RANGES: [SummaryRange, string][] = [
  [14, hu.summary.days14],
  [30, hu.summary.days30],
  [90, hu.summary.days90],
]

export default function SummaryPage({ doc, onBack }: Props) {
  const [days, setDays] = useState<SummaryRange>(30)
  const [includeNotes, setIncludeNotes] = useState(false)
  const [includeCraving, setIncludeCraving] = useState(false)
  const options: SummaryOptions = { endDate: todayIso(), days, includeNotes, includeCraving }
  const summary = buildSummary(doc, options, medName)
  const num = (value: number) => String(value).replace('.', hu.summary.decimal)

  const sharePdf = async () => {
    const [{ renderSummaryPdf }, { summaryFonts }] = await Promise.all([
      import('@/lib/summaryPdf'),
      import('@/lib/fonts'),
    ])
    const bytes = await renderSummaryPdf(summary, hu, summaryFonts())
    await shareFile(`n1naplo-osszefoglalo-${options.endDate}.pdf`, bytes, 'application/pdf')
  }
  const shareCsv = () =>
    shareFile(
      `n1naplo-${options.endDate}.csv`,
      buildCsv(summaryDocument(doc, options, medName), medName),
      'text/csv',
    )

  const chip = (on: boolean) =>
    `rounded-full px-4 py-1.5 text-sm ${on ? 'bg-sage text-white' : 'bg-sage-soft text-sage'}`
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-sage">
        ← {hu.summary.back}
      </button>
      <h1 className="text-lg font-semibold">{hu.summary.title}</h1>
      <div className="flex flex-wrap gap-2">
        {RANGES.map(([range, label]) => (
          <button
            key={range}
            type="button"
            onClick={() => setDays(range)}
            className={chip(days === range)}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIncludeNotes(!includeNotes)}
          className={chip(includeNotes)}
          aria-pressed={includeNotes}
        >
          {hu.summary.includeNotes}
        </button>
        <button
          type="button"
          onClick={() => setIncludeCraving(!includeCraving)}
          className={chip(includeCraving)}
          aria-pressed={includeCraving}
        >
          {hu.summary.includeCraving}
        </button>
      </div>

      <section className="rounded-xl border border-line bg-card p-4 text-sm">
        <p className="text-muted">
          {summary.from} – {summary.to} · {hu.summary.disclaimer}
        </p>
        <p className="mt-2">
          {fill(hu.summary.days, {
            total: days,
            recorded: summary.daysRecorded,
            missing: summary.daysMissing,
          })}
        </p>
        {summary.daysRecorded === 0 && <p className="mt-2 text-muted">{hu.summary.empty}</p>}
        {summary.fields.length > 0 && (
          <table className="mt-3 w-full text-left tabular-nums">
            <thead>
              <tr className="text-xs text-muted">
                <th className="font-medium">{hu.summary.colField}</th>
                <th className="font-medium">{hu.summary.colDays}</th>
                <th className="font-medium">{hu.summary.colMin}</th>
                <th className="font-medium">{hu.summary.colMedian}</th>
                <th className="font-medium">{hu.summary.colMax}</th>
              </tr>
            </thead>
            <tbody>
              {summary.fields.map((f) => (
                <tr key={f.key}>
                  <td>{hu.fields[f.key]}</td>
                  <td>{f.recorded}</td>
                  <td>{num(f.min)}</td>
                  <td>{num(f.median)}</td>
                  <td>{num(f.max)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {summary.meds.map((med) => (
          <p key={med.name} className="mt-2">
            {labelWithUnit(med.name, med.unit)}: {med.values.filter((v) => v !== null).length} /{' '}
            {days}
          </p>
        ))}
        {summary.openTopics.length > 0 && (
          <>
            <h2 className="mt-3 font-medium">{hu.summary.topicsTitle}</h2>
            <ul className="list-disc pl-5">
              {summary.openTopics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </>
        )}
        {summary.notes.length > 0 && (
          <>
            <h2 className="mt-3 font-medium">{hu.summary.notesTitle}</h2>
            {summary.notes.map((note) => (
              <p key={note.date} className="mt-1">
                <span className="text-muted">{note.date}</span> {note.text}
              </p>
            ))}
          </>
        )}
      </section>

      <button
        type="button"
        onClick={() => void sharePdf()}
        className="rounded-xl bg-sage px-4 py-3 text-[15px] font-medium text-white"
      >
        {hu.summary.sharePdf}
      </button>
      <button
        type="button"
        onClick={() => void shareCsv()}
        className="rounded-xl border border-line bg-card px-4 py-3 text-[15px]"
      >
        {hu.summary.shareCsv}
      </button>
      <p className="text-xs text-muted">{hu.summary.plain}</p>
    </div>
  )
}
