import { useState } from 'react'
import ConfirmSheet from '@/components/ConfirmSheet'
import RestoreFromFile from '@/components/RestoreFromFile'
import { hu } from '@/i18n/hu'
import { emptyDocument } from '@/lib/document'
import type { N1Document } from '@/types'

type Props = {
  onStartEmpty: () => void
  onRestore: (doc: N1Document) => void
}

export default function RecoveryPage({ onStartEmpty, onRestore }: Props) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div
      className="mx-auto w-full max-w-md px-5"
      style={{ paddingTop: 'calc(48px + var(--safe-area-top))' }}
    >
      <h1 className="text-lg font-semibold">{hu.recovery.title}</h1>
      <p className="mt-3 text-[15px] text-muted">{hu.recovery.body}</p>
      <RestoreFromFile current={emptyDocument()} label={hu.recovery.restore} onApply={onRestore} />
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
