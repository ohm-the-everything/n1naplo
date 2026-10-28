import { Capacitor } from '@capacitor/core'
import { PrivacyScreen } from '@capacitor-community/privacy-screen'
import type { Protection } from '@/types'

export async function applyScreenProtection(protection: Protection): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  if (protection.allowScreenshots) await PrivacyScreen.disable()
  else await PrivacyScreen.enable()
}
