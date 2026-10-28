import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef, useState } from 'react'
import TabBar, { type Tab } from '@/components/TabBar'
import { hu } from '@/i18n/hu'
import { emptyDocument, withEntry, withSettings, withTopics } from '@/lib/document'
import { syncReminder } from '@/lib/reminder'
import { createSaver, loadDocument, StoreCorruptError } from '@/lib/store'
import EntryPage from '@/pages/EntryPage'
import RecoveryPage from '@/pages/RecoveryPage'
import ReviewPage from '@/pages/ReviewPage'
import SettingsPage from '@/pages/SettingsPage'
import type { DayEntry, N1Document, Settings, Topic } from '@/types'

type LoadState = 'loading' | 'ready' | 'corrupt' | 'failed'

// Single writer for the whole app.
const save = createSaver()

export default function App() {
  const [tab, setTab] = useState<Tab>('entry')
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [doc, setDoc] = useState<N1Document>(emptyDocument)
  const [saveFailed, setSaveFailed] = useState(false)
  // Latest document, for rapid successive edits and the resume handler.
  const latest = useRef(doc)

  useEffect(() => {
    loadDocument().then(
      (loaded) => {
        latest.current = loaded
        setDoc(loaded)
        setLoadState('ready')
        void syncReminder(loaded.settings)
      },
      (error: unknown) => setLoadState(error instanceof StoreCorruptError ? 'corrupt' : 'failed'),
    )
  }, [])

  // Each resume slides the 14-day reminder window forward.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const listener = CapApp.addListener('resume', () => {
      void syncReminder(latest.current.settings)
    })
    return () => {
      void listener.then((handle) => handle.remove())
    }
  }, [])

  const commit = (next: N1Document) => {
    latest.current = next
    setDoc(next)
    save(next).then(
      () => setSaveFailed(false),
      () => setSaveFailed(true),
    )
  }

  const replaceDocument = (next: N1Document) => {
    commit(next)
    void syncReminder(next.settings)
  }

  if (loadState === 'loading') return null
  if (loadState === 'corrupt') {
    return (
      <RecoveryPage
        onStartEmpty={() => {
          commit(emptyDocument())
          setLoadState('ready')
        }}
        onRestore={(restored) => {
          replaceDocument(restored)
          setLoadState('ready')
        }}
      />
    )
  }
  if (loadState === 'failed') {
    return (
      <div
        className="mx-auto w-full max-w-md px-5"
        style={{ paddingTop: 'calc(48px + var(--safe-area-top))' }}
      >
        <p className="text-[15px]">{hu.store.loadFailed}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl border border-line bg-card px-4 py-3 text-[15px]"
        >
          {hu.store.retry}
        </button>
      </div>
    )
  }

  const changeEntry = (entry: DayEntry) => commit(withEntry(latest.current, entry))
  const changeTopics = (topics: Topic[]) => commit(withTopics(latest.current, topics))
  const changeSettings = (settings: Settings, options?: { resyncReminder?: boolean }) => {
    commit(withSettings(latest.current, settings))
    if (options?.resyncReminder) void syncReminder(settings)
  }

  return (
    <div style={{ paddingTop: 'var(--safe-area-top)' }}>
      {saveFailed && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 bg-sage-soft px-5 py-2 text-sm"
        >
          <span>{hu.store.saveFailed}</span>
          <button
            type="button"
            onClick={() => commit(latest.current)}
            className="font-medium underline"
          >
            {hu.store.retry}
          </button>
        </div>
      )}
      <main className="mx-auto w-full max-w-md px-5 pt-4">
        {tab === 'entry' && (
          <EntryPage
            entries={doc.entries}
            settings={doc.settings}
            onChange={changeEntry}
            topics={doc.topics}
            onTopicsChange={changeTopics}
          />
        )}
        {tab === 'review' && (
          <ReviewPage entries={doc.entries} settings={doc.settings} onSettings={changeSettings} />
        )}
        {tab === 'settings' && (
          <SettingsPage
            doc={doc}
            onDocument={replaceDocument}
            settings={doc.settings}
            onSettings={changeSettings}
          />
        )}
        <div style={{ height: 120 }} aria-hidden="true" />
      </main>
      <TabBar tab={tab} onSelect={setTab} />
    </div>
  )
}
