import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import { hu } from '@/i18n/hu'
import type { Settings } from '@/types'

const REMINDER_ID = 1

// Napi ismétlődő jelzés. Doze alatt is él (allowWhileIdle), reboot után a
// plugin boot-receivere állítja vissza.
export async function syncReminder(settings: Settings): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] })
  if (!settings.reminderEnabled) return

  const permission = await LocalNotifications.requestPermissions()
  if (permission.display !== 'granted') return

  await LocalNotifications.schedule({
    notifications: [
      {
        id: REMINDER_ID,
        title: hu.reminder.title,
        body: hu.reminder.body,
        schedule: {
          on: { hour: settings.reminderHour, minute: settings.reminderMinute },
          allowWhileIdle: true,
        },
      },
    ],
  })
}
