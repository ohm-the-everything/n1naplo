import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import Stepper from '@/components/Stepper'
import TopicsCard from '@/components/TopicsCard'
import { hu } from '@/i18n/hu'
import { addDays, formatHu, todayIso } from '@/lib/dates'
import { medName } from '@/lib/meds'
import type { DayEntry, Settings, Topic } from '@/types'

type Props = {
  entries: Record<string, DayEntry>
  settings: Settings
  onChange: (entry: DayEntry) => void
  topics: Topic[]
  onTopicsChange: (topics: Topic[]) => void
  onOpenSummary: () => void
}

export default function EntryPage({
  entries,
  settings,
  onChange,
  topics,
  onTopicsChange,
  onOpenSummary,
}: Props) {
  const [date, setDate] = useState(todayIso())
  const dateInputRef = useRef<HTMLInputElement>(null)
  const today = todayIso()
  const entry: DayEntry = entries[date] ?? { date }
  const fields = settings.enabledFields

  const patch = (changes: Partial<DayEntry>) => onChange({ ...entry, date, ...changes })

  const setMed = (id: string, value: number | undefined) => {
    const meds = { ...entry.meds }
    if (value === undefined) {
      delete meds[id]
    } else {
      meds[id] = value
    }
    patch({ meds: Object.keys(meds).length > 0 ? meds : undefined })
  }

  const openDatePicker = () => {
    try {
      dateInputRef.current?.showPicker()
    } catch {
      dateInputRef.current?.focus()
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={hu.entry.prevDay}
          onClick={() => setDate(addDays(date, -1))}
          className="p-3 text-muted"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={openDatePicker}
          className="flex flex-1 items-center justify-center gap-2 py-3 text-[15px] font-medium"
        >
          <CalendarDays size={16} className="text-muted" />
          {formatHu(date)}
        </button>
        <button
          type="button"
          aria-label={hu.entry.nextDay}
          onClick={() => setDate(addDays(date, 1))}
          disabled={date >= today}
          className="p-3 text-muted disabled:opacity-30"
        >
          <ChevronRight size={22} />
        </button>
      </div>
      <input
        ref={dateInputRef}
        type="date"
        value={date}
        max={today}
        onChange={(event) => {
          if (event.target.value) setDate(event.target.value)
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />
      {date !== today && (
        <button
          type="button"
          onClick={() => setDate(today)}
          className="mx-auto block pb-2 text-sm text-sage"
        >
          {hu.entry.backToToday}
        </button>
      )}

      <div className="mt-2 rounded-xl border border-line bg-card px-4 py-1">
        {settings.meds.map(
          (med, index) =>
            med.enabled && (
              <Stepper
                key={med.id}
                label={medName(med, index)}
                hint={med.unit.trim() || undefined}
                value={entry.meds?.[med.id]}
                min={0}
                max={20}
                step={0.5}
                onChange={(value) => setMed(med.id, value)}
              />
            ),
        )}
        {fields.alvas && (
          <Stepper
            label={hu.fields.alvas}
            value={entry.alvas}
            min={0}
            max={24}
            step={0.5}
            onChange={(value) => patch({ alvas: value })}
          />
        )}
        {fields.izgalom && (
          <Stepper
            label={hu.fields.izgalom}
            value={entry.izgalom}
            min={1}
            max={5}
            step={1}
            onChange={(value) => patch({ izgalom: value })}
          />
        )}
        {fields.szorongas && (
          <Stepper
            label={hu.fields.szorongas}
            value={entry.szorongas}
            min={1}
            max={5}
            step={1}
            onChange={(value) => patch({ szorongas: value })}
          />
        )}
        {fields.unalom && (
          <Stepper
            label={hu.fields.unalom}
            value={entry.unalom}
            min={1}
            max={5}
            step={1}
            onChange={(value) => patch({ unalom: value })}
          />
        )}
        {fields.hangulat && (
          <Stepper
            label={hu.fields.hangulat}
            value={entry.hangulat}
            min={1}
            max={5}
            step={1}
            onChange={(value) => patch({ hangulat: value })}
          />
        )}
        {fields.sovargas && (
          <Stepper
            label={hu.fields.sovargas}
            hint={hu.fields.sovargasHint}
            value={entry.sovargas}
            min={0}
            max={5}
            step={1}
            onChange={(value) => patch({ sovargas: value })}
          />
        )}
      </div>

      {fields.jegyzet && (
        <textarea
          value={entry.jegyzet ?? ''}
          onChange={(event) => patch({ jegyzet: event.target.value || undefined })}
          placeholder={hu.entry.notePlaceholder}
          rows={5}
          className="mt-3 w-full resize-y rounded-xl border border-line bg-card px-4 py-3 text-[15px] leading-relaxed placeholder:text-muted focus:border-sage focus:outline-none"
        />
      )}

      <TopicsCard topics={topics} onChange={onTopicsChange} onOpenSummary={onOpenSummary} />

      <p className="mt-3 text-center text-xs text-muted">{hu.entry.footer}</p>
    </div>
  )
}
