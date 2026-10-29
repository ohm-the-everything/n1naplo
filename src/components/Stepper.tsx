import { X } from 'lucide-react'
import { useT } from '@/i18n'
import { fill } from '@/lib/text'

type Props = {
  label: string
  hint?: string
  value: number | undefined
  min: number
  max: number
  step: number
  onChange: (value: number | undefined) => void
}

const round = (value: number) => Math.round(value * 10) / 10

export default function Stepper({ label, hint, value, min, max, step, onChange }: Props) {
  const t = useT()
  const decrease = () => {
    if (value !== undefined && value > min) onChange(round(Math.max(min, value - step)))
  }
  const increase = () => {
    onChange(value === undefined ? min : round(Math.min(max, value + step)))
  }

  return (
    <div className="flex items-center gap-2 border-b border-line py-2 last:border-b-0">
      <div className="flex-1">
        <div className="text-[0.9375rem]">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      {value !== undefined && (
        <button
          type="button"
          aria-label={fill(t.a11y.clear, { field: label })}
          onClick={() => onChange(undefined)}
          className="flex h-11 w-11 items-center justify-center text-muted"
        >
          <X size={16} />
        </button>
      )}
      <button
        type="button"
        onClick={decrease}
        aria-label={fill(t.a11y.decrease, { field: label })}
        disabled={value === undefined || value <= min}
        className="h-12 w-12 rounded-full bg-sage-soft text-xl font-medium text-sage disabled:opacity-30"
      >
        −
      </button>
      <div aria-live="polite" className="w-12 text-center text-lg font-semibold tabular-nums">
        {value ?? '–'}
      </div>
      <button
        type="button"
        onClick={increase}
        aria-label={fill(t.a11y.increase, { field: label })}
        disabled={value !== undefined && value >= max}
        className="h-12 w-12 rounded-full bg-sage-soft text-xl font-medium text-sage disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}
