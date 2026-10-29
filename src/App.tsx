import { App as CapApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import TabBar, { type Tab } from '@/components/TabBar'
import { I18nProvider, messages, pickLocale } from '@/i18n'
import { emptyDocument, withEntry, withSettings, withTopics } from '@/lib/document'
import { needsUnlock } from '@/lib/lock'
import { applyScreenProtection } from '@/lib/protection'
import { type ReminderStatus, requestReminderPermission, syncReminder } from '@/lib/reminder'
import { createSaver, loadDocument, StoreCorruptError } from '@/lib/store'
import EntryPage from '@/pages/EntryPage'
import HelpPage from '@/pages/HelpPage'
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

const messagesFor = (settings: Settings) =>
  messages[pickLocale(settings.locale, navigator.languages)]

export default function App() {
  const [tab, setTab] = useState<Tab>('entry')
  const [overlay, setOverlay] = useState<'summary' | 'help' | null>(null)
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
        void syncReminder(loaded.settings, messagesFor(loaded.settings)).then(setReminderStatus)
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
      void syncReminder(latest.current.settings, messagesFor(latest.current.settings)).then(
        setReminderStatus,
      )
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
    void syncReminder(next.settings, messagesFor(next.settings)).then(setReminderStatus)
  }

  const locale = pickLocale(doc.settings.locale, navigator.languages)
  const t = messages[locale]
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])
  const ui = (node: ReactNode) => <I18nProvider locale={locale}>{node}</I18nProvider>

  if (loadState === 'loading') return null
  if (loadState === 'corrupt') {
    return ui(
      <RecoveryPage
        onStartEmpty={() => {
          commit(emptyDocument())
          setLoadState('ready')
        }}
        onRestore={(restored) => {
          replaceDocument(restored)
          setLoadState('ready')
        }}
      />,
    )
  }
  if (locked) return ui(<LockScreen onUnlocked={() => setLocked(false)} />)
  if (concealed) return null
  if (loadState === 'failed') {
    return ui(
      <div
        className="mx-auto w-full max-w-md px-5"
        style={{ paddingTop: 'calc(48px + var(--safe-area-top))' }}
      >
        <p className="text-[0.9375rem]">{t.store.loadFailed}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 rounded-xl border border-line bg-card px-4 py-3 text-[0.9375rem]"
        >
          {t.store.retry}
        </button>
      </div>,
    )
  }

  const changeEntry = (entry: DayEntry) => commit(withEntry(latest.current, entry))
  const changeTopics = (topics: Topic[]) => commit(withTopics(latest.current, topics))
  const changeSettings = (settings: Settings, options?: { resyncReminder?: boolean }) => {
    commit(withSettings(latest.current, settings))
    if (!options?.resyncReminder) return
    const allowed = settings.reminderEnabled ? requestReminderPermission() : Promise.resolve(false)
    void allowed.then(() => syncReminder(settings, messagesFor(settings))).then(setReminderStatus)
  }

  if (doc.settings.onboardedAt === null) {
    return ui(
      <OnboardingPage
        settings={doc.settings}
        onDone={(settings) => changeSettings(settings, { resyncReminder: true })}
      />,
    )
  }

  return ui(
    <div style={{ paddingTop: 'var(--safe-area-top)' }}>
      {saveFailed && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 bg-sage-soft px-5 py-2 text-sm"
        >
          <span>{t.store.saveFailed}</span>
          <button
            type="button"
            onClick={() => commit(latest.current)}
            className="font-medium underline"
          >
            {t.store.retry}
          </button>
        </div>
      )}
      <main className="mx-auto w-full max-w-md px-5 pt-4">
        {overlay === null && <h1 className="sr-only">{t.tabs[tab]}</h1>}
        {overlay === 'summary' && <SummaryPage doc={doc} onBack={() => setOverlay(null)} />}
        {overlay === 'help' && <HelpPage onBack={() => setOverlay(null)} />}
        {overlay === null && tab === 'entry' && (
          <EntryPage
            entries={doc.entries}
            settings={doc.settings}
            onChange={changeEntry}
            topics={doc.topics}
            onTopicsChange={changeTopics}
            onOpenSummary={() => setOverlay('summary')}
            onOpenHelp={() => setOverlay('help')}
          />
        )}
        {overlay === null && tab === 'review' && (
          <ReviewPage entries={doc.entries} settings={doc.settings} onSettings={changeSettings} />
        )}
        {overlay === null && tab === 'settings' && (
          <SettingsPage
            doc={doc}
            onDocument={replaceDocument}
            onOpenSummary={() => setOverlay('summary')}
            onOpenHelp={() => setOverlay('help')}
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
          setOverlay(null)
          setTab(next)
        }}
      />
    </div>,
  )
}
