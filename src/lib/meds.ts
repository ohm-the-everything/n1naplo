import { hu } from '@/i18n/hu'
import type { Med } from '@/types'

export function medName(med: Med, index: number): string {
  return med.label.trim() || `${hu.settings.medFallback} ${index + 1}`
}

export function labelWithUnit(name: string, unit: string): string {
  return unit.trim() ? `${name} (${unit.trim()})` : name
}
