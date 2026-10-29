import { useState } from 'react'
import { useT } from '@/i18n'

type Props = {
  mode: 'create' | 'enter'
  error?: string | null
  onSubmit: (passphrase: string) => Promise<void>
  onPlain?: () => void
  onCancel: () => void
}

const MIN_LENGTH = 8

export default function PassphraseSheet({ mode, error, onSubmit, onPlain, onCancel }: Props) {
  const t = useT()
  const [passphrase, setPassphrase] = useState('')
  const [repeat, setRepeat] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const creating = mode === 'create'

  const submit = async () => {
    if (creating && passphrase.length < MIN_LENGTH) return setProblem(t.data.passphraseShort)
    if (creating && passphrase !== repeat) return setProblem(t.data.passphraseMismatch)
    setProblem(null)
    setBusy(true)
    await onSubmit(passphrase)
    setBusy(false)
  }

  const input =
    'mt-3 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[0.9375rem] focus:border-sage focus:outline-none'
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-ink/30" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="passphrase-title"
        className="mx-auto w-full max-w-md rounded-t-2xl bg-card px-5 pt-5"
        style={{ paddingBottom: 'calc(20px + var(--safe-area-bottom))' }}
      >
        <h2 id="passphrase-title" className="text-base font-semibold">
          {creating ? t.data.encryptTitle : t.data.decryptTitle}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {creating ? t.data.encryptBody : t.data.decryptBody}
        </p>
        <input
          type="password"
          autoComplete={creating ? 'new-password' : 'current-password'}
          value={passphrase}
          onChange={(event) => setPassphrase(event.target.value)}
          placeholder={t.data.passphrase}
          aria-label={t.data.passphrase}
          className={input}
        />
        {creating && (
          <input
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
            placeholder={t.data.passphraseRepeat}
            aria-label={t.data.passphraseRepeat}
            className={input}
          />
        )}
        {(problem ?? error) && (
          <p role="alert" className="mt-2 text-sm">
            {problem ?? error}
          </p>
        )}
        <button
          type="button"
          disabled={busy || passphrase === ''}
          onClick={() => void submit()}
          className="mt-4 w-full rounded-xl bg-sage px-4 py-3 text-[0.9375rem] font-medium text-paper disabled:opacity-40"
        >
          {creating ? t.data.saveEncrypted : t.data.decryptConfirm}
        </button>
        <button
          type="button"
          onClick={creating && onPlain ? onPlain : onCancel}
          className="mt-2 w-full rounded-xl border border-line px-4 py-3 text-[0.9375rem]"
        >
          {creating ? t.data.savePlain : t.common.cancel}
        </button>
        {creating && (
          <button type="button" onClick={onCancel} className="mt-1 w-full py-3 text-sm text-muted">
            {t.common.cancel}
          </button>
        )}
      </div>
    </div>
  )
}
