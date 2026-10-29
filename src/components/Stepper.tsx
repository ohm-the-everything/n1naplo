import { X } from 'lucide-react'
import { useT } from '@/i18n'

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
        <div className="text-[15px]">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      {value !== undefined && (
        <button
          type="button"
          aria-label={t.entry.clear}
          onClick={() => onChange(undefined)}
          className="p-2 text-muted"
        >
          <X size={16} />
        </button>
      )}
      <button
        type="button"
        onClick={decrease}
        disabled={value === undefined || value <= min}
        className="h-12 w-12 rounded-full bg-sage-soft text-xl font-medium text-sage disabled:opacity-30"
      >
        −
      </button>
      <div className="w-12 text-center text-lg font-semibold tabular-nums">{value ?? '–'}</div>
      <button
        type="button"
        onClick={increase}
        disabled={value !== undefined && value >= max}
        className="h-12 w-12 rounded-full bg-sage-soft text-xl font-medium text-sage disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}
