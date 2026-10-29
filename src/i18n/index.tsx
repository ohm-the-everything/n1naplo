import { createContext, type ReactNode, useContext } from 'react'
import type { Locale } from '@/types'
import { en } from './en'
import { hu } from './hu'

type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> }
export type Messages = Widen<typeof hu>

export const messages: Record<Locale, Messages> = { hu, en }

// Automatic: Hungarian only when the phone's first language is Hungarian.
export function pickLocale(setting: 'auto' | Locale, languages: readonly string[]): Locale {
  if (setting !== 'auto') return setting
  return languages[0]?.toLowerCase().startsWith('hu') ? 'hu' : 'en'
}

const I18nContext = createContext<Messages>(hu)

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <I18nContext.Provider value={messages[locale]}>{children}</I18nContext.Provider>
}

export function useT(): Messages {
  return useContext(I18nContext)
}
