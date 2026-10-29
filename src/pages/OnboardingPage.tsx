import { useState } from 'react'
import AppLockChoice from '@/components/AppLockChoice'
import BackupChoice from '@/components/BackupChoice'
import { useT } from '@/i18n'
import { fill } from '@/lib/text'
import type { Settings } from '@/types'

type Props = {
  settings: Settings
  onDone: (settings: Settings) => void
}

const STEPS = 5

export default function OnboardingPage({ settings, onDone }: Props) {
  const t = useT()
  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState(settings)
  const finish = (reminderEnabled: boolean) =>
    onDone({ ...draft, reminderEnabled, onboardedAt: new Date().toISOString() })

  return (
    <main
      className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5"
      style={{
        paddingTop: 'calc(32px + var(--safe-area-top))',
        paddingBottom: 'calc(24px + var(--safe-area-bottom))',
      }}
    >
      <p className="text-xs text-muted">{fill(t.onboarding.step, { n: step, total: STEPS })}</p>
      <div className="mt-6 flex-1">
        {step === 1 && (
          <>
            <Title>{t.onboarding.whatTitle}</Title>
            <Body>{t.onboarding.whatBody}</Body>
            <Title>{t.onboarding.notTitle}</Title>
            <Body>{t.onboarding.notBody}</Body>
          </>
        )}
        {step === 2 && (
          <>
            <Title>{t.onboarding.dataTitle}</Title>
            <Body>{t.onboarding.dataBody}</Body>
          </>
        )}
        {step === 3 && (
          <>
            <Title>{t.onboarding.backupTitle}</Title>
            <Body>{t.backup.intro}</Body>
            <BackupChoice
              value={draft.backup}
              onChange={(backup) => setDraft({ ...draft, backup })}
            />
          </>
        )}
        {step === 4 && (
          <>
            <Title>{t.onboarding.lockTitle}</Title>
            <AppLockChoice
              value={draft.protection.appLock}
              onChange={(appLock) =>
                setDraft({ ...draft, protection: { ...draft.protection, appLock } })
              }
            />
          </>
        )}
        {step === 5 && (
          <>
            <Title>{t.onboarding.reminderTitle}</Title>
            <Body>{t.onboarding.reminderBody}</Body>
          </>
        )}
      </div>
      {step < STEPS ? (
        <button type="button" onClick={() => setStep(step + 1)} className={PRIMARY}>
          {t.onboarding.next}
        </button>
      ) : (
        <>
          <button type="button" onClick={() => finish(true)} className={PRIMARY}>
            {t.onboarding.reminderYes}
          </button>
          <button type="button" onClick={() => finish(false)} className={SECONDARY}>
            {t.onboarding.reminderNo}
          </button>
        </>
      )}
      {step > 1 && (
        <button
          type="button"
          onClick={() => setStep(step - 1)}
          className="mt-2 py-2 text-sm text-muted"
        >
          {t.onboarding.back}
        </button>
      )}
    </main>
  )
}

const PRIMARY = 'w-full rounded-xl bg-sage px-4 py-3 text-[0.9375rem] font-medium text-white'
const SECONDARY = 'mt-2 w-full rounded-xl border border-line bg-card px-4 py-3 text-[0.9375rem]'

function Title({ children }: { children: string }) {
  return <h1 className="mt-4 text-xl font-semibold first:mt-0">{children}</h1>
}

function Body({ children }: { children: string }) {
  return <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted">{children}</p>
}
