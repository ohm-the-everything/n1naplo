import { hu } from '@/i18n/hu'

type Props = {
  onBack: () => void
}

const NUMBERS = [
  { tel: '112', label: '112', text: hu.help.emergency },
  { tel: '116123', label: '116-123', text: hu.help.support },
]

export default function HelpPage({ onBack }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-sage">
        ← {hu.summary.back}
      </button>
      <h1 className="text-lg font-semibold">{hu.help.title}</h1>
      <p className="text-[15px] font-medium">{hu.help.nobody}</p>
      {NUMBERS.map((number) => (
        <a
          key={number.tel}
          href={`tel:${number.tel}`}
          className="rounded-xl border border-line bg-card p-4"
        >
          <span className="block text-2xl font-semibold text-sage tabular-nums">
            {number.label}
          </span>
          <span className="mt-1 block text-sm">{number.text}</span>
        </a>
      ))}
      <p className="text-xs text-muted">{hu.help.checked}</p>
      <p className="text-sm text-muted">{hu.help.notMedical}</p>
    </div>
  )
}
