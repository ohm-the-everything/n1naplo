import { useState } from 'react'
import Toggle from '@/components/Toggle'
import { hu } from '@/i18n/hu'
import { canLock, confirmIdentity } from '@/lib/lock'

type Props = {
  value: boolean
  onChange: (appLock: boolean) => void
}

// Switching either way needs the phone's own authentication first.
export default function AppLockChoice({ value, onChange }: Props) {
  const [note, setNote] = useState<string | null>(null)

  const toggle = async (on: boolean) => {
    setNote(null)
    if (on && !(await canLock())) return setNote(hu.lock.noDeviceLock)
    if (await confirmIdentity(on ? hu.lock.turnOn : hu.lock.turnOff, hu.common.cancel)) onChange(on)
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-medium">{hu.lock.choiceTitle}</span>
        <Toggle checked={value} onChange={(on) => void toggle(on)} label={hu.lock.choiceTitle} />
      </div>
      <p className="mt-1 text-sm text-muted">{hu.lock.choiceHow}</p>
      {note && (
        <p role="alert" className="mt-1 text-sm">
          {note}
        </p>
      )}
    </div>
  )
}
