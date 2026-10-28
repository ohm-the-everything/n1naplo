import { useState } from 'react'
import ConfirmSheet from '@/components/ConfirmSheet'
import { hu } from '@/i18n/hu'

type Props = {
  onStartEmpty: () => void
}

// Sérült naplófájl után: a másolat már elkészült, itt csak az dől el, hogyan tovább.
export default function RecoveryPage({ onStartEmpty }: Props) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div
      className="mx-auto w-full max-w-md px-5"
      style={{ paddingTop: 'calc(48px + var(--safe-area-top))' }}
    >
      <h1 className="text-lg font-semibold">{hu.recovery.title}</h1>
      <p className="mt-3 text-[15px] text-muted">{hu.recovery.body}</p>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="mt-6 w-full rounded-xl border border-line bg-card px-4 py-3 text-[15px]"
      >
        {hu.recovery.startEmpty}
      </button>
      {confirming && (
        <ConfirmSheet
          title={hu.recovery.confirmTitle}
          body={hu.recovery.confirmBody}
          confirmLabel={hu.recovery.confirmLabel}
          onConfirm={onStartEmpty}
          onCancel={() => setConfirming(false)}
        />
      )}
    </div>
  )
}
