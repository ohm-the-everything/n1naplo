import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { checkAndroidBackup } from './ethics-check.mjs'

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
