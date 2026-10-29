import { useState } from 'react'
import { useT } from '@/i18n'
import { buildCsv } from '@/lib/csv'
import { todayIso } from '@/lib/dates'
import { shareFile } from '@/lib/files'
import { labelWithUnit, medNamer } from '@/lib/meds'
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

export default function SummaryPage({ doc, onBack }: Props) {
  const t = useT()
  const medName = medNamer(t)
  const RANGES: [SummaryRange, string][] = [
    [14, t.summary.days14],
    [30, t.summary.days30],
    [90, t.summary.days90],
  ]
  const [days, setDays] = useState<SummaryRange>(30)
  const [includeNotes, setIncludeNotes] = useState(false)
  const [includeCraving, setIncludeCraving] = useState(false)
  const options: SummaryOptions = { endDate: todayIso(), days, includeNotes, includeCraving }
  const summary = buildSummary(doc, options, medName)
  const num = (value: number) => String(value).replace('.', t.summary.decimal)

  const sharePdf = async () => {
    const [{ renderSummaryPdf }, { summaryFonts }] = await Promise.all([
      import('@/lib/summaryPdf'),
      import('@/lib/fonts'),
    ])
    const bytes = await renderSummaryPdf(summary, t, summaryFonts())
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
        ← {t.summary.back}
      </button>
      <h1 className="text-lg font-semibold">{t.summary.title}</h1>
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
          {t.summary.includeNotes}
        </button>
        <button
          type="button"
          onClick={() => setIncludeCraving(!includeCraving)}
          className={chip(includeCraving)}
          aria-pressed={includeCraving}
        >
          {t.summary.includeCraving}
        </button>
      </div>

      <section className="rounded-xl border border-line bg-card p-4 text-sm">
        <p className="text-muted">
          {summary.from} – {summary.to} · {t.summary.disclaimer}
        </p>
        <p className="mt-2">
          {fill(t.summary.days, {
            total: days,
            recorded: summary.daysRecorded,
            missing: summary.daysMissing,
          })}
        </p>
        {summary.daysRecorded === 0 && <p className="mt-2 text-muted">{t.summary.empty}</p>}
        {summary.fields.length > 0 && (
          <table className="mt-3 w-full text-left tabular-nums">
            <thead>
              <tr className="text-xs text-muted">
                <th className="font-medium">{t.summary.colField}</th>
                <th className="font-medium">{t.summary.colDays}</th>
                <th className="font-medium">{t.summary.colMin}</th>
                <th className="font-medium">{t.summary.colMedian}</th>
                <th className="font-medium">{t.summary.colMax}</th>
              </tr>
            </thead>
            <tbody>
              {summary.fields.map((f) => (
                <tr key={f.key}>
                  <td>{t.fields[f.key]}</td>
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
            <h2 className="mt-3 font-medium">{t.summary.topicsTitle}</h2>
            <ul className="list-disc pl-5">
              {summary.openTopics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
          </>
        )}
        {summary.notes.length > 0 && (
          <>
            <h2 className="mt-3 font-medium">{t.summary.notesTitle}</h2>
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
        {t.summary.sharePdf}
      </button>
      <button
        type="button"
        onClick={() => void shareCsv()}
        className="rounded-xl border border-line bg-card px-4 py-3 text-[15px]"
      >
        {t.summary.shareCsv}
      </button>
      <p className="text-xs text-muted">{t.summary.plain}</p>
    </div>
  )
}
