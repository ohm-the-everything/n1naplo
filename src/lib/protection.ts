import { Capacitor } from '@capacitor/core'
import { PrivacyScreen } from '@capacitor-community/privacy-screen'
import type { Protection } from '@/types'

export async function applyScreenProtection(protection: Protection): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  // With the app lock on, the app switcher must not show the diary either.
  if (protection.allowScreenshots && !protection.appLock) await PrivacyScreen.disable()
  else await PrivacyScreen.enable()
}
