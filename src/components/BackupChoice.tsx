import { Capacitor } from '@capacitor/core'
import Toggle from '@/components/Toggle'
import { useT } from '@/i18n'
import type { BackupChoice as Choice } from '@/types'

type Props = {
  value: Choice
  onChange: (value: Choice) => void
}

// One switch on iOS: iCloud backup and migration are the same mechanism there.
export default function BackupChoice({ value, onChange }: Props) {
  const t = useT()
  if (Capacitor.getPlatform() === 'ios') {
    const on = value.cloud || value.transfer
    return (
      <Option
        title={t.backup.iosTitle}
        how={t.backup.iosHow}
        risk={t.backup.iosRisk}
        checked={on}
        onChange={(next) => onChange({ cloud: next, transfer: next })}
      />
    )
  }
  return (
    <>
      <Option
        title={t.backup.cloudTitle}
        how={t.backup.cloudHow}
        risk={t.backup.cloudRisk}
        checked={value.cloud}
        onChange={(cloud) => onChange({ ...value, cloud })}
      />
      <Option
        title={t.backup.transferTitle}
        how={t.backup.transferHow}
        risk={t.backup.transferRisk}
        checked={value.transfer}
        onChange={(transfer) => onChange({ ...value, transfer })}
      />
    </>
  )
}

type OptionProps = {
  title: string
  how: string
  risk: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function Option({ title, how, risk, checked, onChange }: OptionProps) {
  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.9375rem] font-medium">{title}</span>
        <Toggle checked={checked} onChange={onChange} label={title} />
      </div>
      <p className="mt-1 text-sm text-muted">{how}</p>
      <p className="mt-1 text-sm">{risk}</p>
    </div>
  )
}
