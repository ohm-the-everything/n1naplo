#!/usr/bin/env node
// Guards for ETHICS.md: pure checks plus a CLI that exits 1 on any violation.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
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

const TRACKERS =
  /firebase|sentry|posthog|mixpanel|amplitude|segment|analytics|appsflyer|adjust|branch|onesignal|facebook|admob|google-mobile-ads|datadog|bugsnag|crashlytics|hotjar|logrocket/i

export function findTrackerDependencies(lockfile) {
  const names = Object.keys(lockfile.packages ?? {})
    .filter(Boolean)
    .map((path) => path.replace(/^.*node_modules\//, ''))
  return [...new Set(names.filter((name) => TRACKERS.test(name)))]
}

const NETWORK = /\bfetch\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon/

export function findNetworkCalls(files) {
  return files
    .filter(({ path }) => !/\.test\./.test(path))
    .flatMap(({ path, text }) => {
      const match = text.match(NETWORK)
      return match ? [{ path, text: match[0] }] : []
    })
}

export function checkIosPrivacyManifest(plist) {
  const violations = []
  if (!/<key>NSPrivacyTracking<\/key>\s*<false\/>/.test(plist)) {
    violations.push('PrivacyInfo: NSPrivacyTracking must be false')
  }
  if (!/<key>NSPrivacyCollectedDataTypes<\/key>\s*(<array\/>|<array>\s*<\/array>)/.test(plist)) {
    violations.push('PrivacyInfo: NSPrivacyCollectedDataTypes must be empty')
  }
  return violations
}

// Hungarian stems match inside words; English terms match whole words ("cure" ≠ "secure").
const BANNED = [
  ['optimális adag', /optimális adag/i],
  ['optimal dose', /\boptimal dose/i],
  ['hatékonyság', /hatékonyság/i],
  ['effectiveness', /\beffectiveness\b/i],
  ['diagnóz/diagnos', /diagnóz|diagnos/i],
  ['gyógyít', /gyógyít/i],
  ['cure', /\bcures?\b/i],
  ['klinikailag', /klinikailag/i],
  ['clinically', /\bclinically\b/i],
  ['streak', /\bstreaks?\b/i],
  ['jelvény', /jelvény/i],
  ['badge', /\bbadges?\b/i],
  ['kezeli az ADHD', /kezeli az ADHD/i],
  ['treats ADHD', /\btreats ADHD/i],
  ['Leletbemutatás', /leletbemutatás/i],
]
// The store-required disclaimers say exactly what the app does not do.
const DISCLAIMERS = [/nem diagnosztizál\b/gi, /doesn[’']t diagnose/gi]

function texts(tree) {
  if (typeof tree === 'string') return [tree]
  return Object.values(tree).flatMap(texts)
}

export function findBannedClaims(messageTrees) {
  const copy = messageTrees
    .flatMap(texts)
    .map((text) => DISCLAIMERS.reduce((rest, disclaimer) => rest.replace(disclaimer, ''), text))
    .join('\n')
  return BANNED.filter(([, pattern]) => pattern.test(copy)).map(([name]) => name)
}

export function findMissingProofs(ethicsMd, exists) {
  const cited = [...ethicsMd.matchAll(/`((?:src|scripts|android|ios)\/[^`\s]+|[A-Z]+\.md)`/g)].map((m) => m[1])
  return [...new Set(cited)].filter((path) => !exists(path))
}

function sourceFiles(root, dir) {
  return readdirSync(new URL(dir, root)).flatMap((name) => {
    const path = `${dir}${name}`
    if (statSync(new URL(path, root)).isDirectory()) return sourceFiles(root, `${path}/`)
    return /\.(ts|tsx|js|mjs)$/.test(name) ? [{ path, text: readFileSync(new URL(path, root), 'utf8') }] : []
  })
}

export function checkRepository(root) {
  const read = (path) => readFileSync(new URL(path, root), 'utf8')
  return [
    ...checkAndroidBackup({
      manifest: read('android/app/src/main/AndroidManifest.xml'),
      extractionRules: read('android/app/src/main/res/xml/data_extraction_rules.xml'),
      backupRules: read('android/app/src/main/res/xml/backup_rules.xml'),
    }),
    ...findTrackerDependencies(JSON.parse(read('package-lock.json'))).map((name) => `tracker dependency: ${name}`),
    ...findNetworkCalls(sourceFiles(root, 'src/')).map((hit) => `network call in ${hit.path}: ${hit.text}`),
    ...checkIosPrivacyManifest(read('ios/App/App/PrivacyInfo.xcprivacy')),
    ...findBannedClaims([read('src/i18n/hu.ts'), read('src/i18n/en.ts')]).map((claim) => `banned copy: ${claim}`),
    ...findMissingProofs(read('ETHICS.md'), (path) => existsSync(new URL(path, root))).map(
      (path) => `ETHICS.md cites a missing file: ${path}`,
    ),
  ]
}

function main() {
  const violations = checkRepository(new URL('../', import.meta.url))
  for (const violation of violations) console.error(`ethics-check: ${violation}`)
  if (violations.length > 0) process.exit(1)
  console.log('ethics-check: OK')
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main()
