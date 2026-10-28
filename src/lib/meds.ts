import { hu } from '@/i18n/hu'
import type { Med } from '@/types'

// A gyógyszermező megjelenített neve: a felhasználó címkéje, vagy „Gyógyszer N" a
// listabeli helye szerint. Felület, export és összefoglaló mind ezt használja.
export function medName(med: Med, index: number): string {
  return med.label.trim() || `${hu.settings.medFallback} ${index + 1}`
}
