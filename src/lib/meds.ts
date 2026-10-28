import { hu } from '@/i18n/hu'
import type { Med } from '@/types'

export function medName(med: Med, index: number): string {
  return med.label.trim() || `${hu.settings.medFallback} ${index + 1}`
}
