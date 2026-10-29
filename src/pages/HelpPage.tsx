import { useT } from '@/i18n'

type Props = {
  onBack: () => void
}

export default function HelpPage({ onBack }: Props) {
  const t = useT()
  const NUMBERS = [
    { tel: '112', label: '112', text: t.help.emergency },
    { tel: '116123', label: t.help.supportNumber, text: t.help.support },
  ]
  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-sage">
        ← {t.summary.back}
      </button>
      <h1 className="text-lg font-semibold">{t.help.title}</h1>
      <p className="text-[15px] font-medium">{t.help.nobody}</p>
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
      <p className="text-sm">{t.help.abroad}</p>
      <p className="text-xs text-muted">{t.help.checked}</p>
      <p className="text-sm text-muted">{t.help.notMedical}</p>
    </div>
  )
}
