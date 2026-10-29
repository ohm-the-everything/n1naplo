import { useT } from '@/i18n'

type Props = {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

// Never window.confirm: it blocks the WebView and cannot be styled.
export default function ConfirmSheet({ title, body, confirmLabel, onConfirm, onCancel }: Props) {
  const t = useT()
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/30" role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="mx-auto w-full max-w-md rounded-t-2xl bg-card px-5 pt-5"
        style={{ paddingBottom: 'calc(20px + var(--safe-area-bottom))' }}
      >
        <h2 id="confirm-title" className="text-base font-semibold">
          {title}
        </h2>
        <p id="confirm-body" className="mt-2 text-sm text-muted">
          {body}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-line px-4 py-3 text-[15px]"
          >
            {t.common.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-sage px-4 py-3 text-[15px] font-medium text-paper"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
