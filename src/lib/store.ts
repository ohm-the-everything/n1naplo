import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { emptyDocument, type ParseError, parseDocument, parseJson } from '@/lib/document'
import type { BackupChoice, N1Document } from '@/types'

export const DOCUMENT_PATH = 'n1naplo.json'
const TMP_PATH = `${DOCUMENT_PATH}.tmp`

const home = Directory.LibraryNoCloud
const encoding = Encoding.UTF8

// Opt-in backup copies: a folder per target on Android (backup rules are per folder), one on iOS.
const CLOUD_MIRROR = 'backup/cloud/n1naplo.json'
const TRANSFER_MIRROR = 'backup/transfer/n1naplo.json'
const IOS_MIRROR = 'backup/n1naplo.json'
const mirrors = Directory.Data

export type Platform = 'android' | 'ios' | 'web'
const currentPlatform = () => Capacitor.getPlatform() as Platform

export function mirrorPaths(backup: BackupChoice, platform: Platform): string[] {
  if (platform === 'ios') return backup.cloud || backup.transfer ? [IOS_MIRROR] : []
  if (platform !== 'android') return []
  return [backup.cloud ? CLOUD_MIRROR : '', backup.transfer ? TRANSFER_MIRROR : ''].filter(Boolean)
}

function platformMirrors(platform: Platform): string[] {
  return mirrorPaths({ cloud: true, transfer: true }, platform)
}

export class StoreCorruptError extends Error {
  readonly reason: ParseError

  constructor(reason: ParseError) {
    super(`Stored diary is unreadable (${reason}).`)
    this.name = 'StoreCorruptError'
    this.reason = reason
  }
}

// Main file, then an interrupted save, then a copy restored by system backup, then empty.
// A corrupt file is never overwritten: it is copied aside and reported.
export async function loadDocument(platform = currentPlatform()): Promise<N1Document> {
  const files = await listFiles(home)
  if (files.has(DOCUMENT_PATH)) return readStrict(home, DOCUMENT_PATH)
  if (files.has(TMP_PATH)) {
    const fromTmp = parseText(await readText(home, TMP_PATH))
    if (fromTmp.ok) {
      await rename(home, TMP_PATH, DOCUMENT_PATH)
      return fromTmp.value
    }
  }
  for (const path of platformMirrors(platform)) {
    if (await exists(mirrors, path)) return readStrict(mirrors, path)
  }
  return emptyDocument()
}

// Saves run in order; a failed one does not block the next.
export function createSaver(platform = currentPlatform()): (doc: N1Document) => Promise<void> {
  let queue: Promise<void> = Promise.resolve()
  return (doc) => {
    const write = queue.then(() => writeDocument(doc, platform))
    queue = write.catch(() => undefined)
    return write
  }
}

// Revoke first, so an opt-out holds even if the diary write fails.
async function writeDocument(doc: N1Document, platform: Platform): Promise<void> {
  const data = JSON.stringify(doc)
  const wanted = mirrorPaths(doc.settings.backup, platform)
  const unwanted = platformMirrors(platform).filter((path) => !wanted.includes(path))
  for (const path of unwanted) {
    await removeIfPresent(mirrors, path)
    await removeIfPresent(mirrors, `${path}.tmp`)
  }
  await writeAtomically(home, DOCUMENT_PATH, data)
  for (const path of wanted) await writeAtomically(mirrors, path, data)
}

async function writeAtomically(directory: Directory, path: string, data: string): Promise<void> {
  const tmp = `${path}.tmp`
  await Filesystem.writeFile({ path: tmp, data, directory, encoding, recursive: true })
  try {
    await rename(directory, tmp, path)
  } catch {
    // Where rename won't overwrite. A crash in between leaves tmp, which load promotes.
    await Filesystem.deleteFile({ path, directory })
    await rename(directory, tmp, path)
  }
}

function rename(directory: Directory, from: string, to: string): Promise<void> {
  return Filesystem.rename({ from, to, directory, toDirectory: directory })
}

async function removeIfPresent(directory: Directory, path: string): Promise<void> {
  if (await exists(directory, path)) await Filesystem.deleteFile({ path, directory })
}

async function readStrict(directory: Directory, path: string): Promise<N1Document> {
  const text = await readText(directory, path)
  const parsed = parseText(text)
  if (parsed.ok) return parsed.value
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  await Filesystem.writeFile({
    path: `n1naplo.corrupt-${stamp}.json`,
    data: text,
    directory: home,
    encoding,
  })
  throw new StoreCorruptError(parsed.error)
}

function parseText(text: string) {
  const json = parseJson(text)
  return json.ok ? parseDocument(json.value) : json
}

async function readText(directory: Directory, path: string): Promise<string> {
  const { data } = await Filesystem.readFile({ path, directory, encoding })
  return typeof data === 'string' ? data : await data.text()
}

async function exists(directory: Directory, path: string): Promise<boolean> {
  const slash = path.lastIndexOf('/')
  const files = await listFiles(directory, path.slice(0, Math.max(slash, 0)))
  return files.has(path.slice(slash + 1))
}

// The directory does not exist before the first save.
async function listFiles(directory: Directory, path = ''): Promise<Set<string>> {
  try {
    const { files } = await Filesystem.readdir({ path, directory })
    return new Set(files.map((file) => file.name))
  } catch {
    return new Set()
  }
}
