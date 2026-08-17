import { ChartLine, PenLine, Settings as SettingsIcon } from 'lucide-react'
import { hu } from '@/i18n/hu'

export type Tab = 'entry' | 'review' | 'settings'

const TABS = [
  { id: 'entry', label: hu.tabs.entry, Icon: PenLine },
  { id: 'review', label: hu.tabs.review, Icon: ChartLine },
  { id: 'settings', label: hu.tabs.settings, Icon: SettingsIcon },
] as const

type Props = {
  tab: Tab
  onSelect: (tab: Tab) => void
}

export default function TabBar({ tab, onSelect }: Props) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 border-t border-line bg-card"
      style={{ paddingBottom: 'var(--safe-area-bottom)' }}
    >
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs ${
              tab === id ? 'font-semibold text-sage' : 'text-muted'
            }`}
          >
            <Icon size={22} strokeWidth={tab === id ? 2.4 : 1.8} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  )
}
