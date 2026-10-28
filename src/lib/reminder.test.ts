import { beforeEach, describe, expect, it, vi } from 'vitest'
import { hu } from '@/i18n/hu'
import type { Settings } from '@/types'
import { emptyDocument } from './document'

const plugin = {
  display: 'granted' as string,
  warning: undefined as undefined | { code: string; message: string },
  requested: 0,
  scheduled: 0,
}
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }))
vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    cancel: async () => undefined,
    removeAllDeliveredNotifications: async () => undefined,
    checkPermissions: async () => ({ display: plugin.display }),
    requestPermissions: async () => {
      plugin.requested++
      return { display: plugin.display }
    },
    schedule: async ({ notifications }: { notifications: unknown[] }) => {
      plugin.scheduled += notifications.length
      return { notifications, warning: plugin.warning }
    },
  },
}))

const { nextOccurrences, requestReminderPermission, syncReminder } = await import('./reminder')

const reminderOn: Settings = { ...emptyDocument().settings, reminderEnabled: true }

beforeEach(() => {
  Object.assign(plugin, { display: 'granted', warning: undefined, requested: 0, scheduled: 0 })
})

describe('syncReminder', () => {
  it('syncReminder does not request permission', async () => {
    plugin.display = 'prompt'
    expect(await syncReminder(reminderOn, hu)).toBe('denied')
    expect(plugin.requested).toBe(0)
    expect(plugin.scheduled).toBe(0)
  })

  it('syncReminder returns off when reminders are disabled', async () => {
    expect(await syncReminder({ ...reminderOn, reminderEnabled: false }, hu)).toBe('off')
    expect(plugin.scheduled).toBe(0)
  })

  it('schedules the 14-day window when allowed', async () => {
    expect(await syncReminder(reminderOn, hu)).toBe('scheduled')
    expect(plugin.scheduled).toBe(14)
  })

  it('syncReminder reports scheduled-inexact when the plugin returns a warning', async () => {
    plugin.warning = { code: 'OS-PLUG-LNOT-0013', message: 'inexact' }
    expect(await syncReminder(reminderOn, hu)).toBe('scheduled-inexact')
  })

  it('asks for permission only through requestReminderPermission', async () => {
    expect(await requestReminderPermission()).toBe(true)
    expect(plugin.requested).toBe(1)
  })
})

describe('nextOccurrences', () => {
  it('nextOccurrences keeps 21:00 local across DST end (Europe/Budapest, 2026-10-25)', () => {
    const times = nextOccurrences(new Date(2026, 9, 24, 12, 0), 21, 0, 3)
    expect(times.map((time) => time.toISOString())).toEqual([
      '2026-10-24T19:00:00.000Z',
      '2026-10-25T20:00:00.000Z',
      '2026-10-26T20:00:00.000Z',
    ])
  })

  it('ha az időpont ma még nem jött el, ma kezd', () => {
    const now = new Date(2026, 7, 25, 20, 0)
    const dates = nextOccurrences(now, 21, 0, 3)
    expect(dates.map((d) => d.toISOString())).toEqual([
      new Date(2026, 7, 25, 21, 0).toISOString(),
      new Date(2026, 7, 26, 21, 0).toISOString(),
      new Date(2026, 7, 27, 21, 0).toISOString(),
    ])
  })

  it('ha az időpont ma már elmúlt, holnap kezd', () => {
    const now = new Date(2026, 7, 25, 21, 30)
    const dates = nextOccurrences(now, 21, 0, 2)
    expect(dates[0].getDate()).toBe(26)
    expect(dates[1].getDate()).toBe(27)
  })

  it('pontban az időpontban már a holnapit adja', () => {
    const now = new Date(2026, 7, 25, 21, 0)
    expect(nextOccurrences(now, 21, 0, 1)[0].getDate()).toBe(26)
  })

  it('hónapátlépésnél is jó napokat ad', () => {
    const now = new Date(2026, 7, 30, 22, 0)
    const dates = nextOccurrences(now, 21, 0, 3)
    expect(dates.map((d) => [d.getMonth(), d.getDate()])).toEqual([
      [7, 31],
      [8, 1],
      [8, 2],
    ])
  })
})
