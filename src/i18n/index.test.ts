import { describe, expect, it } from 'vitest'
import { en } from './en'
import { hu } from './hu'
import { pickLocale } from './index'

function keys(tree: object, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'object' ? keys(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  )
}

describe('pickLocale', () => {
  it('pickLocale returns hu for hu-HU and en for de-DE', () => {
    expect(pickLocale('auto', ['hu-HU', 'en-US'])).toBe('hu')
    expect(pickLocale('auto', ['de-DE', 'hu-HU'])).toBe('en')
    expect(pickLocale('auto', [])).toBe('en')
  })

  it('pickLocale respects an explicit setting', () => {
    expect(pickLocale('hu', ['de-DE'])).toBe('hu')
    expect(pickLocale('en', ['hu-HU'])).toBe('en')
  })
})

describe('messages', () => {
  it('en has exactly the keys of hu', () => {
    expect(keys(en).sort()).toEqual(keys(hu).sort())
  })

  it('en keeps every {placeholder} of hu', () => {
    const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort()
    const flat = (tree: object): Record<string, string> =>
      Object.fromEntries(
        Object.entries(tree).flatMap(([key, value]) =>
          typeof value === 'object'
            ? Object.entries(flat(value)).map(([k, v]) => [`${key}.${k}`, v])
            : [[key, value]],
        ),
      )
    const huFlat = flat(hu)
    for (const [key, text] of Object.entries(flat(en))) {
      expect([key, placeholders(text)]).toEqual([key, placeholders(huFlat[key])])
    }
  })
})
