import { useEffect, useState } from 'react'
import TabBar, { type Tab } from '@/components/TabBar'
import { syncReminder } from '@/lib/reminder'
import { loadEntries, loadSettings, persistEntries, persistSettings } from '@/lib/storage'
import EntryPage from '@/pages/EntryPage'
import ReviewPage from '@/pages/ReviewPage'
import SettingsPage from '@/pages/SettingsPage'
import { type DayEntry, isEmptyEntry, type Settings } from '@/types'

export default function App() {
  const [tab, setTab] = useState<Tab>('entry')
  const [entries, setEntries] = useState<Record<string, DayEntry> | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    Promise.all([loadEntries(), loadSettings()]).then(([loadedEntries, loadedSettings]) => {
      setEntries(loadedEntries)
      setSettings(loadedSettings)
      void syncReminder(loadedSettings)
    })
  }, [])

  if (!entries || !settings) return null

  const changeEntry = (entry: DayEntry) => {
    const next = { ...entries }
    if (isEmptyEntry(entry)) {
      delete next[entry.date]
    } else {
      next[entry.date] = entry
    }
    setEntries(next)
    void persistEntries(next)
  }

  const changeSettings = (next: Settings, options?: { resyncReminder?: boolean }) => {
    setSettings(next)
    void persistSettings(next)
    if (options?.resyncReminder) void syncReminder(next)
  }

  return (
    <div style={{ paddingTop: 'var(--safe-area-top)' }}>
      <main className="mx-auto w-full max-w-md px-5 pt-4">
        {tab === 'entry' && (
          <EntryPage entries={entries} settings={settings} onChange={changeEntry} />
        )}
        {tab === 'review' && (
          <ReviewPage entries={entries} settings={settings} onSettings={changeSettings} />
        )}
        {tab === 'settings' && (
          <SettingsPage entries={entries} settings={settings} onSettings={changeSettings} />
        )}
        <div style={{ height: 120 }} aria-hidden="true" />
      </main>
      <TabBar tab={tab} onSelect={setTab} />
    </div>
  )
}
