import { Capacitor } from '@capacitor/core'
import Toggle from '@/components/Toggle'
import { hu } from '@/i18n/hu'
import type { BackupChoice as Choice } from '@/types'

type Props = {
  value: Choice
  onChange: (value: Choice) => void
}

// One switch on iOS: iCloud backup and migration are the same mechanism there.
export default function BackupChoice({ value, onChange }: Props) {
  if (Capacitor.getPlatform() === 'ios') {
    const on = value.cloud || value.transfer
    return (
      <Option
        title={hu.backup.iosTitle}
        how={hu.backup.iosHow}
        risk={hu.backup.iosRisk}
        checked={on}
        onChange={(next) => onChange({ cloud: next, transfer: next })}
      />
    )
  }
  return (
    <>
      <Option
        title={hu.backup.cloudTitle}
        how={hu.backup.cloudHow}
        risk={hu.backup.cloudRisk}
        checked={value.cloud}
        onChange={(cloud) => onChange({ ...value, cloud })}
      />
      <Option
        title={hu.backup.transferTitle}
        how={hu.backup.transferHow}
        risk={hu.backup.transferRisk}
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
        <span className="text-[15px] font-medium">{title}</span>
        <Toggle checked={checked} onChange={onChange} label={title} />
      </div>
      <p className="mt-1 text-sm text-muted">{how}</p>
      <p className="mt-1 text-sm">{risk}</p>
    </div>
  )
}
