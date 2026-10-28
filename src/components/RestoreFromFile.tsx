import { useState } from 'react'
import ConfirmSheet from '@/components/ConfirmSheet'
import { hu } from '@/i18n/hu'
import { type ImportPlan, readImport } from '@/lib/backup'
import type { ParseError } from '@/lib/document'
import { pickTextFile } from '@/lib/files'
import { medName } from '@/lib/meds'
import { fill } from '@/lib/text'
import type { N1Document } from '@/types'

type Props = {
  current: N1Document
  label: string
  onApply: (next: N1Document) => void
}

const ERRORS: Record<ParseError, string> = {
  'not-json': hu.data.notN1,
  'not-n1': hu.data.notN1,
  'newer-version': hu.data.newer,
  invalid: hu.data.invalid,
}

export default function RestoreFromFile({ current, label, onApply }: Props) {
  const [plan, setPlan] = useState<ImportPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  const pick = async () => {
    setError(null)
    const file = await pickTextFile('.json,.csv,application/json,text/csv,text/plain')
    if (!file) return
    const result = readImport(file, current, medName)
    if (result.ok) setPlan(result.value)
    else setError(ERRORS[result.error])
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
      {plan && (
        <ConfirmSheet
          title={plan.kind === 'restore' ? hu.data.restoreTitle : hu.data.importTitle}
          body={
            plan.kind === 'restore'
              ? fill(hu.data.restoreBody, { before: plan.daysBefore, after: plan.daysAfter })
              : fill(hu.data.importBody, { days: plan.days, meds: plan.addedMeds.length })
          }
          confirmLabel={plan.kind === 'restore' ? hu.data.restoreConfirm : hu.data.importConfirm}
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
