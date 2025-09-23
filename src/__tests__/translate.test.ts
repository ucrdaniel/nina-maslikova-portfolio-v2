import { describe, it, expect } from 'vitest'
import { translate } from '../App'

const scanStrings = (obj: any) => {
  for (const v of Object.values(obj)) {
    if (typeof v === 'string') {
      expect(v.includes('\\')).toBe(false)
    } else if (v && typeof v === 'object') {
      scanStrings(v)
    }
  }
}

describe('translate()', () => {
  it('returns object with required keys (ru/en)', () => {
    const must = ['nav','cta','hero','about','projects','skills','awards','contact','footer']
    const ru = translate('ru')
    const en = translate('en')
    must.forEach(k => { expect(ru).toHaveProperty(k); expect(en).toHaveProperty(k) })
  })

  it('hero names differ across languages', () => {
    expect(translate('ru').hero.name).not.toBe(translate('en').hero.name)
  })

  it('has 3 project cards in both languages', () => {
    expect(translate('ru').projects.cards).toHaveLength(3)
    expect(translate('en').projects.cards).toHaveLength(3)
  })

  it('no stray backslashes in any translation string', () => {
    scanStrings(translate('ru'))
    scanStrings(translate('en'))
  })
})