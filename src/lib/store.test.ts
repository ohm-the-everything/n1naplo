import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BackupChoice } from '@/types'
import { emptyDocument, withEntry, withSettings } from './document'

// Memóriabeli fájlrendszer a @capacitor/filesystem helyett: "könyvtár|útvonal" → tartalom.
const disk = new Map<string, string>()
const failures = new Set<string>()
let renameOverwrites = true

type At = { path: string; directory: string }
const key = ({ directory, path }: At) => `${directory}|${path}`

vi.mock('@capacitor/filesystem', () => ({
  Directory: { LibraryNoCloud: 'LIBRARY_NO_CLOUD', Data: 'DATA' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: {
    // Mint a valódi: a nem létező könyvtár listázása hibát dob.
    readdir: async ({ path, directory }: At) => {
      const prefix = `${directory}|${path ? `${path}/` : ''}`
      const names = [...disk.keys()]
        .filter((name) => name.startsWith(prefix))
        .map((name) => name.slice(prefix.length))
        .filter((name) => !name.includes('/'))
      if (path && names.length === 0) throw new Error('Directory does not exist')
      return { files: names.map((name) => ({ name })) }
    },
    readFile: async (at: At) => {
      const data = disk.get(key(at))
      if (data === undefined) throw new Error('File does not exist')
      return { data }
    },
    writeFile: async (at: At & { data: string }) => {
      await Promise.resolve()
      if (failures.has(`write:${key(at)}`)) throw new Error('disk full')
      disk.set(key(at), at.data)
      return { uri: at.path }
    },
    rename: async ({ from, to, directory }: { from: string; to: string; directory: string }) => {
      const data = disk.get(key({ directory, path: from }))
      if (data === undefined) throw new Error('File does not exist')
      if (!renameOverwrites && disk.has(key({ directory, path: to }))) {
        throw new Error('Destination exists')
      }
      disk.delete(key({ directory, path: from }))
      disk.set(key({ directory, path: to }), data)
    },
    deleteFile: async (at: At) => {
      if (!disk.delete(key(at))) throw new Error('File does not exist')
    },
  },
}))

const { DOCUMENT_PATH, StoreCorruptError, createSaver, loadDocument, mirrorPaths } = await import(
  './store'
)

const MAIN = `LIBRARY_NO_CLOUD|${DOCUMENT_PATH}`
const TMP = `${MAIN}.tmp`
const CLOUD_COPY = 'DATA|backup/cloud/n1naplo.json'
const TRANSFER_COPY = 'DATA|backup/transfer/n1naplo.json'
const IOS_COPY = 'DATA|backup/n1naplo.json'

function docWithDay(date: string, izgalom: number, backup?: BackupChoice) {
  const doc = withEntry(emptyDocument(), { date, izgalom })
  return backup ? withSettings(doc, { ...doc.settings, backup }) : doc
}

beforeEach(() => {
  disk.clear()
  failures.clear()
  renameOverwrites = true
})

describe('loadDocument', () => {
  it('starts with an empty diary when nothing is stored', async () => {
    expect(await loadDocument('android')).toEqual(emptyDocument())
    expect(disk.size).toBe(0)
  })

  it('reads the saved document back', async () => {
    const doc = docWithDay('2026-10-27', 3)
    await createSaver('android')(doc)
    expect(await loadDocument('android')).toEqual(doc)
  })

  it('recovers from tmp when the main file is missing', async () => {
    const doc = docWithDay('2026-10-27', 4)
    disk.set(TMP, JSON.stringify(doc))
    expect(await loadDocument('android')).toEqual(doc)
    expect(disk.has(MAIN)).toBe(true)
    expect(disk.has(TMP)).toBe(false)
  })

  it('a corrupt file throws StoreCorruptError and is preserved', async () => {
    disk.set(MAIN, '{"version": 2, "entries": ')
    const error = await loadDocument('android').catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(StoreCorruptError)
    expect((error as InstanceType<typeof StoreCorruptError>).reason).toBe('not-json')
    expect(disk.get(MAIN)).toBe('{"version": 2, "entries": ')
    const copies = [...disk.keys()].filter((name) => name.includes('n1naplo.corrupt-'))
    expect(copies).toHaveLength(1)
    expect(disk.get(copies[0])).toBe('{"version": 2, "entries": ')
  })

  it('prefers a readable main file over a leftover tmp', async () => {
    const saved = docWithDay('2026-10-27', 2)
    disk.set(MAIN, JSON.stringify(saved))
    disk.set(TMP, JSON.stringify(docWithDay('2026-10-27', 5)))
    expect(await loadDocument('android')).toEqual(saved)
  })

  it('a restored phone opens the diary from its backup copy', async () => {
    const backedUp = docWithDay('2026-10-27', 4, { cloud: true, transfer: false })
    disk.set(CLOUD_COPY, JSON.stringify(backedUp))
    expect(await loadDocument('android')).toEqual(backedUp)
  })

  it('a corrupt backup copy is preserved and reported, never treated as empty', async () => {
    disk.set(TRANSFER_COPY, 'nem napló')
    await expect(loadDocument('android')).rejects.toBeInstanceOf(StoreCorruptError)
    expect(disk.get(TRANSFER_COPY)).toBe('nem napló')
  })
})

describe('createSaver', () => {
  it('keeps the old file when the write fails', async () => {
    const save = createSaver('android')
    const old = docWithDay('2026-10-26', 2)
    await save(old)
    failures.add(`write:${TMP}`)
    await expect(save(docWithDay('2026-10-27', 5))).rejects.toThrow('disk full')
    expect(await loadDocument('android')).toEqual(old)
  })

  it('replaces the main file where rename refuses to overwrite', async () => {
    renameOverwrites = false
    const save = createSaver('android')
    await save(docWithDay('2026-10-26', 1))
    const next = docWithDay('2026-10-27', 4)
    await save(next)
    expect(await loadDocument('android')).toEqual(next)
    expect(disk.has(TMP)).toBe(false)
  })

  it('three unawaited saves end with the last document on disk', async () => {
    const save = createSaver('android')
    const last = docWithDay('2026-10-28', 5)
    const writes = [
      save(docWithDay('2026-10-26', 1)),
      save(docWithDay('2026-10-27', 2)),
      save(last),
    ]
    await Promise.all(writes)
    expect(await loadDocument('android')).toEqual(last)
    expect(disk.has(TMP)).toBe(false)
  })

  it('a failed save does not block the next one', async () => {
    const save = createSaver('android')
    failures.add(`write:${TMP}`)
    const failed = save(docWithDay('2026-10-26', 1))
    const next = docWithDay('2026-10-27', 3)
    const succeeded = failed
      .catch(() => undefined)
      .then(() => {
        failures.clear()
        return save(next)
      })
    await expect(failed).rejects.toThrow('disk full')
    await succeeded
    expect(await loadDocument('android')).toEqual(next)
  })

  it('writes no backup copy unless the user chose one', async () => {
    await createSaver('android')(docWithDay('2026-10-27', 3))
    expect([...disk.keys()].filter((name) => name.startsWith('DATA|'))).toEqual([])
  })

  it('keeps a copy only for the backups the user chose', async () => {
    const doc = docWithDay('2026-10-27', 3, { cloud: true, transfer: false })
    await createSaver('android')(doc)
    expect(JSON.parse(disk.get(CLOUD_COPY) ?? 'null')).toEqual(doc)
    expect(disk.has(TRANSFER_COPY)).toBe(false)
  })

  it('removes the copy when the user turns a backup off', async () => {
    const save = createSaver('android')
    await save(docWithDay('2026-10-27', 3, { cloud: true, transfer: true }))
    await save(docWithDay('2026-10-27', 3, { cloud: false, transfer: true }))
    expect(disk.has(CLOUD_COPY)).toBe(false)
    expect(disk.has(TRANSFER_COPY)).toBe(true)
  })

  it('on iOS one copy serves both choices', async () => {
    await createSaver('ios')(docWithDay('2026-10-27', 3, { cloud: false, transfer: true }))
    expect(disk.has(IOS_COPY)).toBe(true)
    expect(disk.has(CLOUD_COPY) || disk.has(TRANSFER_COPY)).toBe(false)
  })
})

describe('mirrorPaths', () => {
  it('maps each choice to its own folder on Android and to one folder on iOS', () => {
    const both = { cloud: true, transfer: true }
    expect(mirrorPaths(both, 'android')).toEqual([
      'backup/cloud/n1naplo.json',
      'backup/transfer/n1naplo.json',
    ])
    expect(mirrorPaths(both, 'ios')).toEqual(['backup/n1naplo.json'])
    expect(mirrorPaths({ cloud: false, transfer: false }, 'ios')).toEqual([])
    expect(mirrorPaths(both, 'web')).toEqual([])
  })
})
