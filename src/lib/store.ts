import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { emptyDocument, type ParseError, parseDocument, parseJson } from '@/lib/document'
import type { BackupChoice, N1Document } from '@/types'

export const DOCUMENT_PATH = 'n1naplo.json'
const TMP_PATH = `${DOCUMENT_PATH}.tmp`

// A napló a mentésből kizárt könyvtárban él (iOS: Library/NoCloud; Androidon az app
// saját fájljai, amiket a manifest szabályai zárnak ki a mentésből).
const home = Directory.LibraryNoCloud
const encoding = Encoding.UTF8

// A rendszer mentésébe csak a felhasználó kérésére kerül másolat, a Directory.Data alá.
// Androidon célonként külön mappa, mert a manifest mappánként engedi a felhős mentést
// és az átköltözést; iOS-en egy mappa, mert ott a kettő ugyanaz a mentés.
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
    super(`A tárolt napló nem olvasható (${reason}).`)
    this.name = 'StoreCorruptError'
    this.reason = reason
  }
}

// Betöltés sorrendje: a fő fájl; ha nincs, a félbemaradt mentés (tmp); ha az sincs, a
// rendszer mentéséből visszaállt másolat (új vagy visszaállított telefon); végül üres
// napló. Sérült fájlt sosem írunk felül: félretesszük egy másolatba, és jelezzük.
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

// Egyetlen író: a mentések sorban futnak, mindegyik akkor teljesül, amikor az ő
// dokumentuma (és a kért másolatai) a lemezen vannak. Egy elbukott mentés nem akasztja
// meg a következőt.
export function createSaver(platform = currentPlatform()): (doc: N1Document) => Promise<void> {
  let queue: Promise<void> = Promise.resolve()
  return (doc) => {
    const write = queue.then(() => writeDocument(doc, platform))
    queue = write.catch(() => undefined)
    return write
  }
}

async function writeDocument(doc: N1Document, platform: Platform): Promise<void> {
  const data = JSON.stringify(doc)
  await writeAtomically(home, DOCUMENT_PATH, data)
  const wanted = mirrorPaths(doc.settings.backup, platform)
  for (const path of platformMirrors(platform)) {
    if (wanted.includes(path)) await writeAtomically(mirrors, path, data)
    else await removeIfPresent(mirrors, path)
  }
}

async function writeAtomically(directory: Directory, path: string, data: string): Promise<void> {
  const tmp = `${path}.tmp`
  await Filesystem.writeFile({ path: tmp, data, directory, encoding, recursive: true })
  try {
    await rename(directory, tmp, path)
  } catch {
    // Ahol a rename nem ír felül: törlés, aztán csere. Ha közben megszakad, a tmp marad
    // meg, és a betöltés azt emeli elő.
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

// A nem létező könyvtárban nincs semmi (a napló könyvtára az első mentésig nem létezik).
async function listFiles(directory: Directory, path = ''): Promise<Set<string>> {
  try {
    const { files } = await Filesystem.readdir({ path, directory })
    return new Set(files.map((file) => file.name))
  } catch {
    return new Set()
  }
}
