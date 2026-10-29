import { useEffect, useState } from 'react'
import Scatter from '@/components/Scatter'
import Sparkline from '@/components/Sparkline'
import { useT } from '@/i18n'
import { addDays, daysBetween, todayIso } from '@/lib/dates'
import { labelWithUnit, medNamer } from '@/lib/meds'
import type { DayEntry, NumericField, Settings } from '@/types'

type Props = {
  entries: Record<string, DayEntry>
  settings: Settings
  onSettings: (settings: Settings, options?: { resyncReminder?: boolean }) => void
}

type Card = {
  key: string
  label: string
  values: (number | undefined)[]
  min: number
  max: number
}

function lastValue(values: (number | undefined)[]): number | undefined {
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i] !== undefined) return values[i]
  }
  return undefined
}

export default function ReviewPage({ entries, settings, onSettings }: Props) {
  const t = useT()
  const medName = medNamer(t)
  const [days, setDays] = useState<7 | 30>(7)
  const [unlocked, setUnlocked] = useState(false)
  const today = todayIso()

  const hasData = Object.keys(entries).length > 0
  const lastOpen = settings.lastReviewOpen
  const gated =
    !unlocked && lastOpen !== null && lastOpen !== today && daysBetween(lastOpen, today) < 7

  // The weekly gate measures from the last real open.
  useEffect(() => {
    if (hasData && !gated && lastOpen !== today) {
      onSettings({ ...settings, lastReviewOpen: today })
    }
  }, [hasData, gated, lastOpen, today, settings, onSettings])

  if (!hasData) {
    return <p className="py-24 text-center text-[15px] text-muted">{t.review.empty}</p>
  }

  if (gated) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="font-medium">{t.review.gateTitle}</p>
        <p className="max-w-xs text-sm text-muted">{t.review.gateBody}</p>
        <button
          type="button"
          onClick={() => setUnlocked(true)}
          className="mt-2 rounded-full bg-sage-soft px-5 py-2.5 text-sm font-medium text-sage"
        >
          {t.review.gateOpen}
        </button>
      </div>
    )
  }

  const dates: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    dates.push(addDays(today, -i))
  }

  const series = (field: NumericField) => dates.map((date) => entries[date]?.[field])

  const cards: Card[] = []
  const pushCard = (
    key: string,
    label: string,
    values: (number | undefined)[],
    min: number,
    fallbackMax: number,
  ) => {
    const filled = values.filter((v): v is number => v !== undefined)
    const max = filled.length > 0 ? Math.max(fallbackMax, ...filled) : fallbackMax
    cards.push({ key, label, values, min, max })
  }
  const addCard = (key: NumericField, label: string, min: number, fallbackMax: number) => {
    if (!settings.enabledFields[key]) return
    pushCard(key, label, series(key), min, fallbackMax)
  }
  for (const [index, med] of settings.meds.entries()) {
    if (!med.enabled) continue
    pushCard(
      `med-${med.id}`,
      labelWithUnit(medName(med, index), med.unit),
      dates.map((date) => entries[date]?.meds?.[med.id]),
      0,
      1,
    )
  }
  addCard('alvas', t.fields.alvas, 0, 8)
  addCard('izgalom', t.fields.izgalom, 1, 5)
  addCard('szorongas', t.fields.szorongas, 1, 5)
  addCard('unalom', t.fields.unalom, 1, 5)
  addCard('hangulat', t.fields.hangulat, 1, 5)
  addCard('sovargas', t.fields.sovargas, 0, 5)

  const boredomPoints = dates.flatMap((date) => {
    const entry = entries[date]
    if (!entry || entry.unalom === undefined || entry.sovargas === undefined) return []
    return [{ x: entry.unalom, y: entry.sovargas }]
  })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center gap-2">
        {([7, 30] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setDays(option)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              days === option ? 'bg-sage text-white' : 'bg-sage-soft text-sage'
            }`}
          >
            {option === 7 ? t.review.days7 : t.review.days30}
          </button>
        ))}
      </div>

      {cards.map((card) => (
        <div key={card.key} className="rounded-xl border border-line bg-card p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">{card.label}</span>
            <span className="text-xs text-muted tabular-nums">{lastValue(card.values) ?? '–'}</span>
          </div>
          <Sparkline values={card.values} min={card.min} max={card.max} />
        </div>
      ))}

      {settings.enabledFields.unalom && settings.enabledFields.sovargas && (
        <div className="rounded-xl border border-line bg-card p-3">
          <p className="text-sm font-medium">{t.review.crossBoredom}</p>
          <p className="mb-1 text-xs text-muted">{t.review.crossCaption}</p>
          {boredomPoints.length >= 3 ? (
            <Scatter
              points={boredomPoints}
              xMin={1}
              xMax={5}
              yMin={0}
              yMax={5}
              xLabel={t.fields.unalom}
              yLabel={t.fields.sovargas}
            />
          ) : (
            <p className="text-xs text-muted">{t.review.noPoints}</p>
          )}
        </div>
      )}
    </div>
  )
}
