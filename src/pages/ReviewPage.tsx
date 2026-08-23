import { useEffect, useState } from 'react'
import Scatter from '@/components/Scatter'
import Sparkline from '@/components/Sparkline'
import { hu } from '@/i18n/hu'
import { addDays, daysBetween, todayIso } from '@/lib/dates'
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
  const [days, setDays] = useState<7 | 30>(7)
  const [unlocked, setUnlocked] = useState(false)
  const today = todayIso()

  const hasData = Object.keys(entries).length > 0
  const lastOpen = settings.lastReviewOpen
  const gated =
    !unlocked && lastOpen !== null && lastOpen !== today && daysBetween(lastOpen, today) < 7

  // A visszanézés hetente egyszer "nyílik" igazán — a valódi megnyitás napját
  // jegyezzük fel, a kapu ahhoz méri a hetet.
  useEffect(() => {
    if (hasData && !gated && lastOpen !== today) {
      onSettings({ ...settings, lastReviewOpen: today })
    }
  }, [hasData, gated, lastOpen, today, settings, onSettings])

  if (!hasData) {
    return <p className="py-24 text-center text-[15px] text-muted">{hu.review.empty}</p>
  }

  if (gated) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="font-medium">{hu.review.gateTitle}</p>
        <p className="max-w-xs text-sm text-muted">{hu.review.gateBody}</p>
        <button
          type="button"
          onClick={() => setUnlocked(true)}
          className="mt-2 rounded-full bg-sage-soft px-5 py-2.5 text-sm font-medium text-sage"
        >
          {hu.review.gateOpen}
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
  for (const med of settings.meds.filter((m) => m.enabled)) {
    pushCard(
      `med-${med.id}`,
      med.label || hu.settings.medLabelPlaceholder,
      dates.map((date) => entries[date]?.meds?.[med.id]),
      0,
      1,
    )
  }
  addCard('alvas', hu.fields.alvas, 0, 8)
  addCard('izgalom', hu.fields.izgalom, 1, 5)
  addCard('szorongas', hu.fields.szorongas, 1, 5)
  addCard('unalom', hu.fields.unalom, 1, 5)
  addCard('hangulat', hu.fields.hangulat, 1, 5)
  addCard('sovargas', hu.fields.sovargas, 0, 5)

  const dosePoints = dates.flatMap((date) => {
    const entry = entries[date]
    if (!entry || entry.izgalom === undefined) return []
    const doses = Object.values(entry.meds ?? {})
    if (doses.length === 0) return []
    return [{ x: doses.reduce((sum, dose) => sum + dose, 0), y: entry.izgalom }]
  })
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
            {option === 7 ? hu.review.days7 : hu.review.days30}
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

      <div className="rounded-xl border border-line bg-card p-3">
        <p className="mb-1 text-sm font-medium">{hu.review.crossDose}</p>
        {dosePoints.length >= 3 ? (
          <Scatter
            points={dosePoints}
            xMin={0}
            xMax={Math.max(1, ...dosePoints.map((p) => p.x))}
            yMin={1}
            yMax={5}
            xLabel={hu.review.doseAxis}
            yLabel={hu.fields.izgalom}
          />
        ) : (
          <p className="text-xs text-muted">{hu.review.noPoints}</p>
        )}
      </div>

      <div className="rounded-xl border border-line bg-card p-3">
        <p className="mb-1 text-sm font-medium">{hu.review.crossBoredom}</p>
        {boredomPoints.length >= 3 ? (
          <Scatter
            points={boredomPoints}
            xMin={1}
            xMax={5}
            yMin={0}
            yMax={5}
            xLabel={hu.fields.unalom}
            yLabel={hu.fields.sovargas}
          />
        ) : (
          <p className="text-xs text-muted">{hu.review.noPoints}</p>
        )}
      </div>
    </div>
  )
}
