import { useEffect } from 'react'
import { useT } from '@/i18n'
import { confirmIdentity } from '@/lib/lock'

type Props = {
  onUnlocked: () => void
}

export default function LockScreen({ onUnlocked }: Props) {
  const t = useT()
  const unlock = async () => {
    if (await confirmIdentity(t.lock.reason, t.common.cancel)) onUnlocked()
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: prompt once, on showing the lock
  useEffect(() => {
    void unlock()
  }, [])

  return (
    <div
      className="mx-auto flex w-full max-w-md flex-col items-center gap-4 px-5 text-center"
      style={{ paddingTop: 'calc(120px + var(--safe-area-top))' }}
    >
      <p className="text-lg font-semibold">{t.lock.title}</p>
      <button
        type="button"
        onClick={() => void unlock()}
        className="rounded-xl bg-sage px-6 py-3 text-[0.9375rem] font-medium text-paper"
      >
        {t.lock.unlock}
      </button>
    </div>
  )
}
