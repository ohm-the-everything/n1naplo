#!/usr/bin/env node
// Guards for ETHICS.md: pure checks plus a CLI that exits 1 on any violation.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Only the opt-in copy folders may be backed up; a section without an include means everything.
const CLOUD = 'file:backup/cloud/'
const TRANSFER = 'file:backup/transfer/'

function section(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(\\s[^>]*)?>([\\s\\S]*?)</${tag}>`))
  return match ? { attrs: match[1] ?? '', body: match[2] } : null
}

function includes(body) {
  return [...body.matchAll(/<include\b([^>]*?)\/?>/g)].map(([, attrs]) => ({
    target: `${attr(attrs, 'domain')}:${attr(attrs, 'path')}`,
    requireFlags: attr(attrs, 'requireFlags'),
  }))
}

function attr(attrs, name) {
  return attrs.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? ''
}

function onlyIncludes(found, expected, where) {
  const targets = found.map((include) => include.target)
  const ok = targets.length === 1 && targets[0] === expected
  return ok ? [] : [`${where}: only "${expected}" allowed, found [${targets.join(', ')}]`]
}

export function checkAndroidBackup({ manifest, extractionRules, backupRules }) {
  const violations = []
  if (!manifest.includes('android:dataExtractionRules="@xml/data_extraction_rules"')) {
    violations.push('manifest: android:dataExtractionRules is missing')
  }
  if (!manifest.includes('android:fullBackupContent="@xml/backup_rules"')) {
    violations.push('manifest: android:fullBackupContent is missing')
  }

  const cloud = section(extractionRules, 'cloud-backup')
  const transfer = section(extractionRules, 'device-transfer')
  if (!cloud) violations.push('data_extraction_rules: no cloud-backup section')
  else {
    violations.push(...onlyIncludes(includes(cloud.body), CLOUD, 'cloud-backup'))
    if (attr(cloud.attrs, 'disableIfNoEncryptionCapabilities') !== 'true') {
      violations.push('cloud-backup: would run unencrypted (disableIfNoEncryptionCapabilities)')
    }
  }
  if (!transfer) violations.push('data_extraction_rules: no device-transfer section')
  else violations.push(...onlyIncludes(includes(transfer.body), TRANSFER, 'device-transfer'))

  // Android 9–11: requireFlags separates encrypted cloud from phone-to-phone.
  const old = section(backupRules, 'full-backup-content')
  violations.push(...checkOldRules(old ? includes(old.body) : []))
  return violations
}

const OLD_RULES = { [CLOUD]: 'clientSideEncryption', [TRANSFER]: 'deviceToDeviceTransfer' }

function checkOldRules(found) {
  const targets = found.map((include) => include.target).sort()
  const expected = Object.keys(OLD_RULES).sort()
  if (targets.join() !== expected.join()) {
    return [`backup_rules: only ${expected.join(' and ')} allowed, found [${targets.join(', ')}]`]
  }
  const loose = found.filter((include) => include.requireFlags !== OLD_RULES[include.target])
  return loose.map((include) => `backup_rules: ${include.target} requireFlags is not ${OLD_RULES[include.target]}`)
}

function readRepo(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
}

function main() {
  const violations = checkAndroidBackup({
    manifest: readRepo('android/app/src/main/AndroidManifest.xml'),
    extractionRules: readRepo('android/app/src/main/res/xml/data_extraction_rules.xml'),
    backupRules: readRepo('android/app/src/main/res/xml/backup_rules.xml'),
  })
  for (const violation of violations) console.error(`ethics-check: ${violation}`)
  if (violations.length > 0) process.exit(1)
  console.log('ethics-check: OK')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
