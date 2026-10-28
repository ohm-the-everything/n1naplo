import { beforeEach, describe, expect, it, vi } from 'vitest'

const calls: string[] = []
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }))
vi.mock('@capacitor-community/privacy-screen', () => ({
  PrivacyScreen: {
    enable: async () => calls.push('enable'),
    disable: async () => calls.push('disable'),
  },
}))

const { applyScreenProtection } = await import('./protection')

beforeEach(() => {
  calls.length = 0
})

describe('applyScreenProtection', () => {
  it('blocks screen capture unless the user allowed screenshots', async () => {
    await applyScreenProtection({ allowScreenshots: false, appLock: false })
    await applyScreenProtection({ allowScreenshots: true, appLock: false })
    expect(calls).toEqual(['enable', 'disable'])
  })
})
