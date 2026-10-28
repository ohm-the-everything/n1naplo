import { FileText, Plus } from 'lucide-react'
import { useState } from 'react'
import About from '@/components/About'
import AppLockChoice from '@/components/AppLockChoice'
import BackupChoice from '@/components/BackupChoice'
import PassphraseSheet from '@/components/PassphraseSheet'
import RestoreFromFile from '@/components/RestoreFromFile'
import Toggle from '@/components/Toggle'
import { hu } from '@/i18n/hu'
import { backupFileName, serializeBackup } from '@/lib/backup'
import { encryptBackup } from '@/lib/crypto'
import { todayIso } from '@/lib/dates'
import { medHasValues } from '@/lib/document'
import { shareFile } from '@/lib/files'
import { medName } from '@/lib/meds'
import { allowExactReminders, type ReminderStatus } from '@/lib/reminder'
import { ALL_FIELDS, type Med, type N1Document, type Settings } from '@/types'

type Props = {
  doc: N1Document
  onDocument: (doc: N1Document) => void
  onOpenSummary: () => void
  onOpenHelp: () => void
  reminderStatus: ReminderStatus
  settings: Settings
  onSettings: (settings: Settings, options?: { resyncReminder?: boolean }) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function SettingsPage({
  doc,
  onDocument,
  onOpenSummary,
  onOpenHelp,
  reminderStatus,
  settings,
  onSettings,
}: Props) {
  const [saving, setSaving] = useState(false)
  const changeMed = (index: number, changes: Partial<Med>) => {
    const meds = settings.meds.map((med, i) => (i === index ? { ...med, ...changes } : med))
    onSettings({ ...settings, meds })
  }

  const addMed = () => {
    const med: Med = {
      id: `med-${crypto.randomUUID().slice(0, 8)}`,
      label: '',
      unit: '',
      enabled: true,
    }
    onSettings({ ...settings, meds: [...settings.meds, med] })
  }

  const backupText = () => serializeBackup(doc, new Date().toISOString())
  const saveBackup = async (text: string) => {
    setSaving(false)
    await shareFile(backupFileName(todayIso()), text, 'application/json')
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-xl border border-line bg-card p-4">
        <button
          type="button"
          onClick={onOpenSummary}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-sage py-3 font-medium text-white"
        >
          <FileText size={18} />
          {hu.summary.title}
        </button>
        <p className="mt-2 text-xs text-muted">{hu.settings.summaryHint}</p>
      </section>

      <section className="rounded-xl border border-line bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-sm font-semibold">{hu.settings.reminderLabel}</h2>
            <p className="text-xs text-muted">{hu.settings.reminderHint}</p>
          </div>
          <Toggle
            checked={settings.reminderEnabled}
            onChange={(on) =>
              onSettings({ ...settings, reminderEnabled: on }, { resyncReminder: true })
            }
            label={hu.settings.reminderLabel}
          />
        </div>
        {settings.reminderEnabled && (
          <label className="mt-3 flex items-center justify-between text-sm">
            {hu.settings.reminderTime}
            <input
              type="time"
              value={`${pad(settings.reminderHour)}:${pad(settings.reminderMinute)}`}
              onChange={(event) => {
                const [hour, minute] = event.target.value.split(':').map(Number)
                if (Number.isFinite(hour) && Number.isFinite(minute)) {
                  onSettings(
                    { ...settings, reminderHour: hour, reminderMinute: minute },
                    { resyncReminder: true },
                  )
                }
              }}
              className="rounded-lg border border-line bg-paper px-3 py-2 tabular-nums"
            />
          </label>
        )}
        {settings.reminderEnabled && reminderStatus === 'denied' && (
          <p className="mt-2 text-sm">{hu.settings.reminderDenied}</p>
        )}
        {settings.reminderEnabled && reminderStatus === 'scheduled-inexact' && (
          <div className="mt-2 text-sm">
            <p>{hu.settings.reminderInexact}</p>
            <button
              type="button"
              onClick={() =>
                void allowExactReminders().then(() =>
                  onSettings(settings, { resyncReminder: true }),
                )
              }
              className="mt-1 font-medium text-sage underline"
            >
              {hu.settings.reminderExact}
            </button>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-line bg-card p-4">
        <h2 className="text-sm font-semibold">{hu.settings.medsSection}</h2>
        {settings.meds.map((med, index) => {
          const unitLocked = medHasValues(doc, med.id)
          return (
            <div key={med.id} className="mt-3">
              <div className="flex items-center gap-3">
                <input
                  value={med.label}
                  onChange={(event) => changeMed(index, { label: event.target.value })}
                  placeholder={medName({ ...med, label: '' }, index)}
                  aria-label={medName(med, index)}
                  className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-[15px] focus:border-sage focus:outline-none"
                />
                <Toggle
                  checked={med.enabled}
                  onChange={(on) => changeMed(index, { enabled: on })}
                  label={medName(med, index)}
                />
              </div>
              <input
                value={med.unit}
                readOnly={unitLocked}
                onChange={(event) => changeMed(index, { unit: event.target.value })}
                placeholder={hu.settings.unitPlaceholder}
                aria-label={`${medName(med, index)}: ${hu.settings.unitPlaceholder}`}
                className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-sm read-only:text-muted focus:border-sage focus:outline-none"
              />
              {unitLocked && <p className="mt-1 text-xs text-muted">{hu.settings.unitLocked}</p>}
            </div>
          )
        })}
        <button
          type="button"
          onClick={addMed}
          className="mt-3 flex items-center gap-1.5 text-sm font-medium text-sage"
        >
          <Plus size={16} />
          {hu.settings.addMed}
        </button>
        <p className="mt-2 text-xs text-muted">{hu.settings.medsHint}</p>
      </section>

      <section className="rounded-xl border border-line bg-card p-4">
        <h2 className="text-sm font-semibold">{hu.settings.fieldsSection}</h2>
        <div className="mt-1">
          {ALL_FIELDS.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between border-b border-line py-2.5 last:border-b-0"
            >
              <span className="text-sm">{hu.fields[key]}</span>
              <Toggle
                checked={settings.enabledFields[key]}
                onChange={(on) =>
                  onSettings({
                    ...settings,
                    enabledFields: { ...settings.enabledFields, [key]: on },
                  })
                }
                label={hu.fields[key]}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-card p-4">
        <h2 className="text-sm font-semibold">{hu.data.section}</h2>
        <p className="mt-1 text-sm text-muted">{hu.data.hint}</p>
        <button
          type="button"
          onClick={() => setSaving(true)}
          className="mt-3 w-full rounded-xl bg-sage px-4 py-3 text-[15px] font-medium text-white"
        >
          {hu.data.save}
        </button>
        <RestoreFromFile current={doc} label={hu.data.restore} onApply={onDocument} />
        {saving && (
          <PassphraseSheet
            mode="create"
            onSubmit={async (passphrase) => {
              await saveBackup(await encryptBackup(backupText(), passphrase))
            }}
            onPlain={() => void saveBackup(backupText())}
            onCancel={() => setSaving(false)}
          />
        )}
      </section>

      <section className="rounded-xl border border-line bg-card p-4">
        <h2 className="text-sm font-semibold">{hu.backup.section}</h2>
        <p className="mt-1 text-sm text-muted">{hu.backup.intro}</p>
        <BackupChoice
          value={settings.backup}
          onChange={(backup) => onSettings({ ...settings, backup })}
        />
        <p className="mt-3 text-sm text-muted">{hu.backup.off}</p>
      </section>

      <section className="rounded-xl border border-line bg-card p-4">
        <h2 className="text-sm font-semibold">{hu.protection.section}</h2>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[15px] font-medium">{hu.protection.screenshotsTitle}</span>
          <Toggle
            checked={settings.protection.allowScreenshots}
            onChange={(allowScreenshots) =>
              onSettings({ ...settings, protection: { ...settings.protection, allowScreenshots } })
            }
            label={hu.protection.screenshotsTitle}
          />
        </div>
        <p className="mt-1 text-sm text-muted">{hu.protection.screenshotsHow}</p>
        <p className="mt-1 text-sm">{hu.protection.screenshotsRisk}</p>
        {settings.protection.appLock && settings.protection.allowScreenshots && (
          <p className="mt-1 text-sm text-muted">{hu.protection.screenshotsLocked}</p>
        )}
        <AppLockChoice
          value={settings.protection.appLock}
          onChange={(appLock) =>
            onSettings({ ...settings, protection: { ...settings.protection, appLock } })
          }
        />
      </section>

      <button
        type="button"
        onClick={onOpenHelp}
        className="rounded-xl border border-line bg-card p-4 text-left text-[15px] font-medium"
      >
        {hu.help.title}
      </button>
      <About />

      <p className="px-2 text-center text-xs text-muted">{hu.settings.privacy}</p>
    </div>
  )
}
