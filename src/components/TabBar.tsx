import { ChartLine, PenLine, Settings as SettingsIcon } from 'lucide-react'
import { useT } from '@/i18n'

export type Tab = 'entry' | 'review' | 'settings'

type Props = {
  tab: Tab
  onSelect: (tab: Tab) => void
}

export default function TabBar({ tab, onSelect }: Props) {
  const t = useT()
  const TABS = [
    { id: 'entry', label: t.tabs.entry, Icon: PenLine },
    { id: 'review', label: t.tabs.review, Icon: ChartLine },
    { id: 'settings', label: t.tabs.settings, Icon: SettingsIcon },
  ] as const
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
