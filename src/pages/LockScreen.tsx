import { useEffect } from 'react'
import { hu } from '@/i18n/hu'
import { confirmIdentity } from '@/lib/lock'

type Props = {
  onUnlocked: () => void
}

export default function LockScreen({ onUnlocked }: Props) {
  const unlock = async () => {
    if (await confirmIdentity(hu.lock.reason, hu.common.cancel)) onUnlocked()
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
      <p className="text-lg font-semibold">{hu.lock.title}</p>
      <button
        type="button"
        onClick={() => void unlock()}
        className="rounded-xl bg-sage px-6 py-3 text-[15px] font-medium text-paper"
      >
        {hu.lock.unlock}
      </button>
    </div>
  )
}
