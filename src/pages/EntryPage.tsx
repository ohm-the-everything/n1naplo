import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'
import Stepper from '@/components/Stepper'
import { hu } from '@/i18n/hu'
import { addDays, formatHu, todayIso } from '@/lib/dates'
import type { DayEntry, Settings } from '@/types'

type Props = {
  entries: Record<string, DayEntry>
  settings: Settings
  onChange: (entry: DayEntry) => void
}

export default function EntryPage({ entries, settings, onChange }: Props) {
  const [date, setDate] = useState(todayIso())
  const dateInputRef = useRef<HTMLInputElement>(null)
  const today = todayIso()
  const entry: DayEntry = entries[date] ?? { date }
  const fields = settings.enabledFields

  const patch = (changes: Partial<DayEntry>) => onChange({ ...entry, date, ...changes })

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
        {fields.med1 && (
          <Stepper
            label={settings.med1Label}
            value={entry.med1}
            min={0}
            max={20}
            step={0.5}
            onChange={(value) => patch({ med1: value })}
          />
        )}
        {fields.med2 && (
          <Stepper
            label={settings.med2Label}
            value={entry.med2}
            min={0}
            max={20}
            step={0.5}
            onChange={(value) => patch({ med2: value })}
          />
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
          rows={2}
          className="mt-3 w-full rounded-xl border border-line bg-card px-4 py-3 text-[15px] placeholder:text-muted focus:border-sage focus:outline-none"
        />
      )}

      <p className="mt-3 text-center text-xs text-muted">{hu.entry.footer}</p>
    </div>
  )
}
