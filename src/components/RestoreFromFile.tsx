import { useState } from 'react'
import ConfirmSheet from '@/components/ConfirmSheet'
import PassphraseSheet from '@/components/PassphraseSheet'
import { useT } from '@/i18n'
import { type ImportPlan, readImport } from '@/lib/backup'
import { decryptBackup, isEncryptedBackup } from '@/lib/crypto'
import type { ParseError } from '@/lib/document'
import { pickTextFile } from '@/lib/files'
import { medNamer } from '@/lib/meds'
import { fill } from '@/lib/text'
import type { N1Document } from '@/types'

type Props = {
  current: N1Document
  label: string
  onApply: (next: N1Document) => void
}

export default function RestoreFromFile({ current, label, onApply }: Props) {
  const t = useT()
  const medName = medNamer(t)
  const ERRORS: Record<ParseError, string> = {
    'not-json': t.data.notN1,
    'not-n1': t.data.notN1,
    'newer-version': t.data.newer,
    invalid: t.data.invalid,
  }
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sealed, setSealed] = useState<{ name: string; text: string } | null>(null)
  const [passError, setPassError] = useState<string | null>(null)

  const readPlan = (file: { name: string; text: string }) => {
    const result = readImport(file, current, medName)
    if (result.ok) setPlan(result.value)
    else setError(ERRORS[result.error])
  }

  const pick = async () => {
    setError(null)
    const file = await pickTextFile('.json,.csv,application/json,text/csv,text/plain')
    if (!file) return
    if (isEncryptedBackup(file.text)) setSealed(file)
    else readPlan(file)
  }

  const unlock = async (passphrase: string) => {
    if (!sealed) return
    const opened = await decryptBackup(sealed.text, passphrase)
    if (!opened.ok) return setPassError(t.data.wrongPassphrase)
    setSealed(null)
    setPassError(null)
    readPlan({ name: sealed.name, text: opened.value })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void pick()}
        className="mt-3 w-full rounded-xl border border-line bg-card px-4 py-3 text-[15px]"
      >
        {label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm">
          {error}
        </p>
      )}
      {sealed && (
        <PassphraseSheet
          mode="enter"
          error={passError}
          onSubmit={unlock}
          onCancel={() => {
            setSealed(null)
            setPassError(null)
          }}
        />
      )}
      {plan && (
        <ConfirmSheet
          title={plan.kind === 'restore' ? t.data.restoreTitle : t.data.importTitle}
          body={
            plan.kind === 'restore'
              ? fill(t.data.restoreBody, { before: plan.daysBefore, after: plan.daysAfter })
              : fill(t.data.importBody, { days: plan.days, meds: plan.addedMeds.length })
          }
          confirmLabel={plan.kind === 'restore' ? t.data.restoreConfirm : t.data.importConfirm}
          onConfirm={() => {
            onApply(plan.doc)
            setPlan(null)
          }}
          onCancel={() => setPlan(null)}
        />
      )}
    </>
  )
}
