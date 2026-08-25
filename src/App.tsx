import { useEffect, useState } from 'react'
import TabBar, { type Tab } from '@/components/TabBar'
import { syncReminder } from '@/lib/reminder'
import {
  loadEntries,
  loadSettings,
  loadTopics,
  persistEntries,
  persistSettings,
  persistTopics,
} from '@/lib/storage'
import EntryPage from '@/pages/EntryPage'
import ReviewPage from '@/pages/ReviewPage'
import SettingsPage from '@/pages/SettingsPage'
import { type DayEntry, isEmptyEntry, type Settings, type Topic } from '@/types'

export default function App() {
  const [tab, setTab] = useState<Tab>('entry')
  const [entries, setEntries] = useState<Record<string, DayEntry> | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [topics, setTopics] = useState<Topic[] | null>(null)

  useEffect(() => {
    Promise.all([loadEntries(), loadSettings(), loadTopics()]).then(
      ([loadedEntries, loadedSettings, loadedTopics]) => {
        setEntries(loadedEntries)
        setSettings(loadedSettings)
        setTopics(loadedTopics)
        void syncReminder(loadedSettings)
      },
    )
  }, [])

  if (!entries || !settings || !topics) return null

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

  const changeTopics = (next: Topic[]) => {
    setTopics(next)
    void persistTopics(next)
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
          <EntryPage
            entries={entries}
            settings={settings}
            onChange={changeEntry}
            topics={topics}
            onTopicsChange={changeTopics}
          />
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
