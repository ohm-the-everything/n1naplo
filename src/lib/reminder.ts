import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Messages } from '@/i18n'
import type { Settings } from '@/types'

// Not the plugin's `on` repeat: it reschedules via a weak setExact(RTC) alarm that Doze
// defers, so reminders silently stopped (Samsung, 2026-08). Instead, 14 one-shot `at`
// alarms (setExactAndAllowWhileIdle, survive reboot), slid forward on every open.
export const REMINDER_WINDOW_DAYS = 14
const REMINDER_ID_BASE = 100
const LEGACY_REMINDER_ID = 1

export function nextOccurrences(now: Date, hour: number, minute: number, count: number): Date[] {
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0)
  if (first <= now) first.setDate(first.getDate() + 1)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(first)
    date.setDate(date.getDate() + index)
    return date
  })
}

export type ReminderStatus = 'off' | 'scheduled' | 'scheduled-inexact' | 'denied' | 'web'

// Never prompts: permission is asked only after the user chose the reminder.
export async function syncReminder(settings: Settings, t: Messages): Promise<ReminderStatus> {
  if (!Capacitor.isNativePlatform()) return 'web'

  const ids = [
    LEGACY_REMINDER_ID,
    ...Array.from({ length: REMINDER_WINDOW_DAYS }, (_, index) => REMINDER_ID_BASE + index),
  ]
  await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) })
  // Opening the app is what the reminder asked for; older ones in the tray are noise.
  await LocalNotifications.removeAllDeliveredNotifications()
  if (!settings.reminderEnabled) return 'off'

  const permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') return 'denied'

  const occurrences = nextOccurrences(
    new Date(),
    settings.reminderHour,
    settings.reminderMinute,
    REMINDER_WINDOW_DAYS,
  )
  const result = await LocalNotifications.schedule({
    notifications: occurrences.map((at, index) => ({
      id: REMINDER_ID_BASE + index,
      title: t.reminder.title,
      body: t.reminder.body,
      schedule: { at, allowWhileIdle: true },
    })),
  })
  return result.warning ? 'scheduled-inexact' : 'scheduled'
}

export async function allowExactReminders(): Promise<void> {
  if (Capacitor.getPlatform() === 'android')
    await LocalNotifications.changeExactNotificationSetting()
}

export async function requestReminderPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false
  const permission = await LocalNotifications.requestPermissions()
  return permission.display === 'granted'
}
