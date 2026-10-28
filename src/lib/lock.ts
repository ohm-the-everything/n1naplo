import { BiometricAuth } from '@aparajita/capacitor-biometric-auth'

const LOCK_AFTER_MS = 60_000

export function needsUnlock(appLock: boolean, hiddenAt: number, now: number): boolean {
  return appLock && now - hiddenAt >= LOCK_AFTER_MS
}

export async function canLock(): Promise<boolean> {
  const info = await BiometricAuth.checkBiometry()
  return info.isAvailable || info.deviceIsSecure
}

export async function confirmIdentity(reason: string, cancelTitle: string): Promise<boolean> {
  try {
    await BiometricAuth.authenticate({
      reason,
      cancelTitle,
      allowDeviceCredential: true,
      androidTitle: reason,
    })
    return true
  } catch {
    return false
  }
}
