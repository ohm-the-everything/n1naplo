import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { emptyDocument, type ParseError, parseDocument, parseJson } from '@/lib/document'
import type { N1Document } from '@/types'

export const DOCUMENT_PATH = 'n1naplo.json'
const TMP_PATH = `${DOCUMENT_PATH}.tmp`

// A napló a mentésből kizárt könyvtárban él (iOS: Library/NoCloud; Androidon az app
// saját fájljai, amiket a manifest zár ki a mentésből).
const directory = Directory.LibraryNoCloud
const encoding = Encoding.UTF8

export class StoreCorruptError extends Error {
  readonly reason: ParseError

  constructor(reason: ParseError) {
    super(`A tárolt napló nem olvasható (${reason}).`)
    this.name = 'StoreCorruptError'
    this.reason = reason
  }
}

// Betöltés sorrendje: a fő fájl; ha nincs, a félbemaradt mentés (tmp); ha az sincs, üres
// napló. Sérült fő fájlt sosem írunk felül: félretesszük egy másolatba, és jelezzük.
export async function loadDocument(): Promise<N1Document> {
  const files = await listFiles()
  if (files.has(DOCUMENT_PATH)) return readMain()
  if (files.has(TMP_PATH)) {
    const fromTmp = parseText(await readText(TMP_PATH))
    if (fromTmp.ok) {
      await Filesystem.rename({
        from: TMP_PATH,
        to: DOCUMENT_PATH,
        directory,
        toDirectory: directory,
      })
      return fromTmp.value
    }
  }
  return emptyDocument()
}

// Egyetlen író: a mentések sorban futnak, mindegyik akkor teljesül, amikor az ő
// dokumentuma a lemezen van. Egy elbukott mentés nem akasztja meg a következőt.
export function createSaver(): (doc: N1Document) => Promise<void> {
  let queue: Promise<void> = Promise.resolve()
  return (doc) => {
    const write = queue.then(() => writeDocument(doc))
    queue = write.catch(() => undefined)
    return write
  }
}

async function writeDocument(doc: N1Document): Promise<void> {
  const data = JSON.stringify(doc)
  await Filesystem.writeFile({ path: TMP_PATH, data, directory, encoding, recursive: true })
  try {
    await Filesystem.rename({
      from: TMP_PATH,
      to: DOCUMENT_PATH,
      directory,
      toDirectory: directory,
    })
  } catch {
    // Ahol a rename nem ír felül: törlés, aztán csere. Ha közben megszakad, a tmp marad
    // meg, és a betöltés azt emeli elő.
    await Filesystem.deleteFile({ path: DOCUMENT_PATH, directory })
    await Filesystem.rename({
      from: TMP_PATH,
      to: DOCUMENT_PATH,
      directory,
      toDirectory: directory,
    })
  }
}

async function readMain(): Promise<N1Document> {
  const text = await readText(DOCUMENT_PATH)
  const parsed = parseText(text)
  if (parsed.ok) return parsed.value
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  await Filesystem.writeFile({
    path: `n1naplo.corrupt-${stamp}.json`,
    data: text,
    directory,
    encoding,
  })
  throw new StoreCorruptError(parsed.error)
}

function parseText(text: string) {
  const json = parseJson(text)
  return json.ok ? parseDocument(json.value) : json
}

async function readText(path: string): Promise<string> {
  const { data } = await Filesystem.readFile({ path, directory, encoding })
  return typeof data === 'string' ? data : await data.text()
}

// A könyvtár az első mentésig nem létezik — ilyenkor nincs benne semmi.
async function listFiles(): Promise<Set<string>> {
  try {
    const { files } = await Filesystem.readdir({ path: '', directory })
    return new Set(files.map((file) => file.name))
  } catch {
    return new Set()
  }
}
