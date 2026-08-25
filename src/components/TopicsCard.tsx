import { Check, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { hu } from '@/i18n/hu'
import type { Topic } from '@/types'

type Props = {
  topics: Topic[]
  onChange: (topics: Topic[]) => void
}

export default function TopicsCard({ topics, onChange }: Props) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const text = draft.trim()
    if (!text) return
    onChange([...topics, { id: `t-${crypto.randomUUID().slice(0, 8)}`, text, done: false }])
    setDraft('')
  }

  const toggle = (id: string) => {
    onChange(topics.map((topic) => (topic.id === id ? { ...topic, done: !topic.done } : topic)))
  }

  const remove = (id: string) => {
    onChange(topics.filter((topic) => topic.id !== id))
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-card p-4">
      <h2 className="text-sm font-semibold">{hu.topics.title}</h2>
      {topics.length === 0 && <p className="mt-2 text-xs text-muted">{hu.topics.empty}</p>}
      {topics.map((topic) => (
        <div
          key={topic.id}
          className="flex items-center gap-2 border-b border-line py-2 last:border-b-0"
        >
          <button
            type="button"
            aria-label={hu.topics.done}
            aria-pressed={topic.done}
            onClick={() => toggle(topic.id)}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
              topic.done
                ? 'border-sage bg-sage text-white'
                : 'border-line bg-paper text-transparent'
            }`}
          >
            <Check size={14} />
          </button>
          <span className={`flex-1 text-[15px] ${topic.done ? 'text-muted line-through' : ''}`}>
            {topic.text}
          </span>
          <button
            type="button"
            aria-label={hu.topics.remove}
            onClick={() => remove(topic.id)}
            className="p-2 text-muted"
          >
            <X size={16} />
          </button>
        </div>
      ))}
      <div className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') add()
          }}
          placeholder={hu.topics.placeholder}
          className="min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-[15px] placeholder:text-muted focus:border-sage focus:outline-none"
        />
        <button
          type="button"
          aria-label={hu.topics.add}
          onClick={add}
          disabled={!draft.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-white disabled:opacity-30"
        >
          <Plus size={20} />
        </button>
      </div>
    </div>
  )
}
