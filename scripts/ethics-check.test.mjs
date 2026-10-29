import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  checkAndroidBackup,
  checkIosPrivacyManifest,
  checkRepository,
  findBannedClaims,
  findMissingProofs,
  findNetworkCalls,
  findTrackerDependencies,
} from './ethics-check.mjs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const repo = () => ({
  manifest: read('android/app/src/main/AndroidManifest.xml'),
  extractionRules: read('android/app/src/main/res/xml/data_extraction_rules.xml'),
  backupRules: read('android/app/src/main/res/xml/backup_rules.xml'),
})

const CLOUD = '<include domain="file" path="backup/cloud/" />'
const TRANSFER = '<include domain="file" path="backup/transfer/" />'
const extraction = ({ cloudAttrs = ' disableIfNoEncryptionCapabilities="true"', cloud = CLOUD, transfer = TRANSFER } = {}) =>
  `<data-extraction-rules><cloud-backup${cloudAttrs}>${cloud}</cloud-backup><device-transfer>${transfer}</device-transfer></data-extraction-rules>`

describe('checkAndroidBackup', () => {
  it('the current repository passes', () => {
    expect(checkAndroidBackup(repo())).toEqual([])
  })

  it('flags a cloud section without an include, which would back up everything', () => {
    const violations = checkAndroidBackup({ ...repo(), extractionRules: extraction({ cloud: '' }) })
    expect(violations).toHaveLength(1)
  })

  it('flags an include outside the opt-in backup folders', () => {
    const cloud = `${CLOUD}<include domain="file" path="." />`
    expect(checkAndroidBackup({ ...repo(), extractionRules: extraction({ cloud }) })).toHaveLength(1)
  })

  it('flags cloud backup that may run unencrypted', () => {
    const violations = checkAndroidBackup({ ...repo(), extractionRules: extraction({ cloudAttrs: '' }) })
    expect(violations).toHaveLength(1)
  })

  it('flags a missing device-transfer section, which would transfer everything', () => {
    const extractionRules = `<data-extraction-rules><cloud-backup disableIfNoEncryptionCapabilities="true">${CLOUD}</cloud-backup></data-extraction-rules>`
    expect(checkAndroidBackup({ ...repo(), extractionRules })).toHaveLength(1)
  })

  it('flags old-Android rules whose cloud include may run unencrypted', () => {
    const backupRules = `<full-backup-content><include domain="file" path="backup/cloud/" /><include domain="file" path="backup/transfer/" requireFlags="deviceToDeviceTransfer" /></full-backup-content>`
    expect(checkAndroidBackup({ ...repo(), backupRules })).toHaveLength(1)
  })

  it('flags old-Android rules that include more than the two backup folders', () => {
    const backupRules = repo().backupRules.replace(
      '</full-backup-content>',
      '<include domain="sharedpref" path="." /></full-backup-content>',
    )
    expect(checkAndroidBackup({ ...repo(), backupRules })).toHaveLength(1)
  })

  it('flags a manifest that does not point at the rules', () => {
    const manifest = repo().manifest.replace(/android:dataExtractionRules="[^"]*"/, '')
    expect(checkAndroidBackup({ ...repo(), manifest })).toHaveLength(1)
  })
})

describe('findTrackerDependencies', () => {
  it('flags firebase in the lockfile', () => {
    const lockfile = { packages: { '': {}, 'node_modules/@firebase/analytics': {}, 'node_modules/react': {} } }
    expect(findTrackerDependencies(lockfile)).toEqual(['@firebase/analytics'])
  })
})

describe('findNetworkCalls', () => {
  it('flags fetch() in src', () => {
    const files = [
      { path: 'src/lib/x.ts', text: 'const r = await fetch(url)' },
      { path: 'src/lib/x.test.ts', text: 'await fetch(url)' },
      { path: 'src/lib/y.ts', text: 'navigator.sendBeacon(u, d)' },
    ]
    expect(findNetworkCalls(files).map((hit) => hit.path)).toEqual(['src/lib/x.ts', 'src/lib/y.ts'])
  })
})

describe('checkIosPrivacyManifest', () => {
  const plist = (tracking, types) =>
    `<plist><dict><key>NSPrivacyTracking</key>${tracking}<key>NSPrivacyCollectedDataTypes</key>${types}</dict></plist>`

  it('flags a privacy manifest that collects data', () => {
    expect(checkIosPrivacyManifest(plist('<false/>', '<array/>'))).toEqual([])
    expect(checkIosPrivacyManifest(plist('<true/>', '<array/>'))).toHaveLength(1)
    expect(checkIosPrivacyManifest(plist('<false/>', '<array><dict/></array>'))).toHaveLength(1)
  })
})

describe('findBannedClaims', () => {
  it('flags a banned claim in copy', () => {
    expect(findBannedClaims([{ a: { b: 'Megtaláljuk az optimális adagot.' } }])).toEqual([
      'optimális adag',
    ])
    expect(findBannedClaims(['This app treats ADHD.'])).toEqual(['treats ADHD'])
  })

  it('allows the required disclaimers but not a claim built on the same word', () => {
    expect(findBannedClaims(['Nem diagnosztizál.', 'It doesn’t diagnose.', 'secure'])).toEqual([])
    expect(findBannedClaims(['Az app diagnosztizálja a hangulatzavart.'])).toEqual(['diagnóz/diagnos'])
  })
})

describe('findMissingProofs', () => {
  it('flags a path ETHICS.md cites that does not exist', () => {
    const md = 'proof: `src/lib/store.ts` and `src/lib/nope.ts`'
    expect(findMissingProofs(md, (path) => path === 'src/lib/store.ts')).toEqual(['src/lib/nope.ts'])
  })
})

describe('the current repository', () => {
  it('the current repository passes', () => {
    expect(checkRepository(new URL('..', import.meta.url))).toEqual([])
  })
})
