import { useState } from 'react'
import Toggle from '@/components/Toggle'
import { useT } from '@/i18n'
import { canLock, confirmIdentity } from '@/lib/lock'

type Props = {
  value: boolean
  onChange: (appLock: boolean) => void
}

// Switching either way needs the phone's own authentication first.
export default function AppLockChoice({ value, onChange }: Props) {
  const t = useT()
  const [note, setNote] = useState<string | null>(null)

  const toggle = async (on: boolean) => {
    setNote(null)
    if (on && !(await canLock())) return setNote(t.lock.noDeviceLock)
    if (await confirmIdentity(on ? t.lock.turnOn : t.lock.turnOff, t.common.cancel)) onChange(on)
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.9375rem] font-medium">{t.lock.choiceTitle}</span>
        <Toggle checked={value} onChange={(on) => void toggle(on)} label={t.lock.choiceTitle} />
      </div>
      <p className="mt-1 text-sm text-muted">{t.lock.choiceHow}</p>
      {note && (
        <p role="alert" className="mt-1 text-sm">
          {note}
        </p>
      )}
    </div>
  )
}
