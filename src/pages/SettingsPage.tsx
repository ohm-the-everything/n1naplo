import { Share2 } from 'lucide-react'
import Toggle from '@/components/Toggle'
import { hu } from '@/i18n/hu'
import { exportCsv } from '@/lib/export'
import { ALL_FIELDS, type DayEntry, type FieldKey, type Settings } from '@/types'

type Props = {
  entries: Record<string, DayEntry>
  settings: Settings
  onSettings: (settings: Settings, options?: { resyncReminder?: boolean }) => void
}

const pad = (n: number) => String(n).padStart(2, '0')

export default function SettingsPage({ entries, settings, onSettings }: Props) {
  const fieldLabel = (key: FieldKey): string => {
    if (key === 'med1') return settings.med1Label
    if (key === 'med2') return settings.med2Label
    return hu.fields[key]
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-xl border border-line bg-card p-4">
        <h2 className="text-sm font-semibold">{hu.settings.exportSection}</h2>
        <button
          type="button"
          onClick={() => void exportCsv(entries, settings)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-sage py-3 font-medium text-white"
        >
          <Share2 size={18} />
          {hu.settings.exportButton}
        </button>
        <p className="mt-2 text-xs text-muted">{hu.settings.exportHint}</p>
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
      </section>

      <section className="rounded-xl border border-line bg-card p-4">
        <h2 className="text-sm font-semibold">{hu.settings.medsSection}</h2>
        <input
          value={settings.med1Label}
          onChange={(event) => onSettings({ ...settings, med1Label: event.target.value })}
          placeholder={hu.settings.medLabelPlaceholder}
          className="mt-3 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[15px] focus:border-sage focus:outline-none"
        />
        <input
          value={settings.med2Label}
          onChange={(event) => onSettings({ ...settings, med2Label: event.target.value })}
          placeholder={hu.settings.medLabelPlaceholder}
          className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-[15px] focus:border-sage focus:outline-none"
        />
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
              <span className="text-sm">{fieldLabel(key)}</span>
              <Toggle
                checked={settings.enabledFields[key]}
                onChange={(on) =>
                  onSettings({
                    ...settings,
                    enabledFields: { ...settings.enabledFields, [key]: on },
                  })
                }
                label={fieldLabel(key)}
              />
            </div>
          ))}
        </div>
      </section>

      <p className="px-2 text-center text-xs text-muted">{hu.settings.privacy}</p>
    </div>
  )
}
