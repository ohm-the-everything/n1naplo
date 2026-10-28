import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect, useRef, useState } from 'react'
import TabBar, { type Tab } from '@/components/TabBar'
import { hu } from '@/i18n/hu'
import { emptyDocument, withEntry, withSettings, withTopics } from '@/lib/document'
import { needsUnlock } from '@/lib/lock'
import { applyScreenProtection } from '@/lib/protection'
import { type ReminderStatus, requestReminderPermission, syncReminder } from '@/lib/reminder'
import { createSaver, loadDocument, StoreCorruptError } from '@/lib/store'
import EntryPage from '@/pages/EntryPage'
import LockScreen from '@/pages/LockScreen'
import OnboardingPage from '@/pages/OnboardingPage'
import RecoveryPage from '@/pages/RecoveryPage'
import ReviewPage from '@/pages/ReviewPage'
import SettingsPage from '@/pages/SettingsPage'
import SummaryPage from '@/pages/SummaryPage'
import type { DayEntry, N1Document, Settings, Topic } from '@/types'

type LoadState = 'loading' | 'ready' | 'corrupt' | 'failed'

// Single writer for the whole app.
const save = createSaver()

export default function App() {
  const [tab, setTab] = useState<Tab>('entry')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [doc, setDoc] = useState<N1Document>(emptyDocument)
  const [saveFailed, setSaveFailed] = useState(false)
  const [locked, setLocked] = useState(false)
  const [reminderStatus, setReminderStatus] = useState<ReminderStatus>('off')
  const [concealed, setConcealed] = useState(false)
  const hiddenAt = useRef(0)
  // Latest document, for rapid successive edits and the resume handler.
  const latest = useRef(doc)

  useEffect(() => {
    loadDocument().then(
      (loaded) => {
        latest.current = loaded
        setDoc(loaded)
        setLocked(loaded.settings.protection.appLock)
        setLoadState('ready')
        void syncReminder(loaded.settings, hu).then(setReminderStatus)
      },
      (error: unknown) => setLoadState(error instanceof StoreCorruptError ? 'corrupt' : 'failed'),
    )
  }, [])

  const { protection } = doc.settings
  useEffect(() => {
    void applyScreenProtection(protection)
  }, [protection])

  // Each resume slides the 14-day reminder window forward.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const resumed = CapApp.addListener('resume', () => {
      void syncReminder(latest.current.settings, hu).then(setReminderStatus)
      if (needsUnlock(latest.current.settings.protection.appLock, hiddenAt.current, Date.now())) {
        setLocked(true)
      }
      setConcealed(false)
    })
    // Hide the diary as soon as the app leaves the screen, not after the resume re-render.
    const paused = CapApp.addListener('pause', () => {
      hiddenAt.current = Date.now()
      if (latest.current.settings.protection.appLock) setConcealed(true)
    })
    return () => {
      for (const listener of [resumed, paused]) void listener.then((handle) => handle.remove())
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
    void syncReminder(next.settings, hu).then(setReminderStatus)
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
  if (locked) return <LockScreen onUnlocked={() => setLocked(false)} />
  if (concealed) return null
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
    if (!options?.resyncReminder) return
    const allowed = settings.reminderEnabled ? requestReminderPermission() : Promise.resolve(false)
    void allowed.then(() => syncReminder(settings, hu)).then(setReminderStatus)
  }

  if (doc.settings.onboardedAt === null) {
    return (
      <OnboardingPage
        settings={doc.settings}
        onDone={(settings) => changeSettings(settings, { resyncReminder: true })}
      />
    )
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
        {summaryOpen && <SummaryPage doc={doc} onBack={() => setSummaryOpen(false)} />}
        {!summaryOpen && tab === 'entry' && (
          <EntryPage
            entries={doc.entries}
            settings={doc.settings}
            onChange={changeEntry}
            topics={doc.topics}
            onTopicsChange={changeTopics}
            onOpenSummary={() => setSummaryOpen(true)}
          />
        )}
        {!summaryOpen && tab === 'review' && (
          <ReviewPage entries={doc.entries} settings={doc.settings} onSettings={changeSettings} />
        )}
        {!summaryOpen && tab === 'settings' && (
          <SettingsPage
            doc={doc}
            onDocument={replaceDocument}
            onOpenSummary={() => setSummaryOpen(true)}
            settings={doc.settings}
            onSettings={changeSettings}
            reminderStatus={reminderStatus}
          />
        )}
        <div style={{ height: 120 }} aria-hidden="true" />
      </main>
      <TabBar
        tab={tab}
        onSelect={(next) => {
          setSummaryOpen(false)
          setTab(next)
        }}
      />
    </div>
  )
}
