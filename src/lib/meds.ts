import type { Messages } from '@/i18n'
import type { MedName } from '@/lib/csv'

export function medNamer(t: Messages): MedName {
  return (med, index) => med.label.trim() || `${t.settings.medFallback} ${index + 1}`
}

export function labelWithUnit(name: string, unit: string): string {
  return unit.trim() ? `${name} (${unit.trim()})` : name
}
