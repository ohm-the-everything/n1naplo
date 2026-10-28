import { beforeEach, describe, expect, it, vi } from 'vitest'
import { emptyDocument, withEntry } from './document'

// Memóriabeli fájlrendszer a @capacitor/filesystem helyett: path → tartalom.
const disk = new Map<string, string>()
const failures = new Set<string>()
let renameOverwrites = true

vi.mock('@capacitor/filesystem', () => ({
  Directory: { LibraryNoCloud: 'LIBRARY_NO_CLOUD' },
  Encoding: { UTF8: 'utf8' },
  Filesystem: {
    readdir: async () => ({ files: [...disk.keys()].map((name) => ({ name })) }),
    readFile: async ({ path }: { path: string }) => {
      const data = disk.get(path)
      if (data === undefined) throw new Error('File does not exist')
      return { data }
    },
    writeFile: async ({ path, data }: { path: string; data: string }) => {
      await Promise.resolve()
      if (failures.has(`write:${path}`)) throw new Error('disk full')
      disk.set(path, data)
      return { uri: path }
    },
    rename: async ({ from, to }: { from: string; to: string }) => {
      const data = disk.get(from)
      if (data === undefined) throw new Error('File does not exist')
      if (!renameOverwrites && disk.has(to)) throw new Error('Destination exists')
      disk.delete(from)
      disk.set(to, data)
    },
    deleteFile: async ({ path }: { path: string }) => {
      disk.delete(path)
    },
  },
}))

const { DOCUMENT_PATH, StoreCorruptError, createSaver, loadDocument } = await import('./store')

const TMP_PATH = `${DOCUMENT_PATH}.tmp`

function docWithDay(date: string, izgalom: number) {
  return withEntry(emptyDocument(), { date, izgalom })
}

beforeEach(() => {
  disk.clear()
  failures.clear()
  renameOverwrites = true
})

describe('loadDocument', () => {
  it('starts with an empty diary when nothing is stored', async () => {
    expect(await loadDocument()).toEqual(emptyDocument())
    expect(disk.size).toBe(0)
  })

  it('reads the saved document back', async () => {
    const doc = docWithDay('2026-10-27', 3)
    await createSaver()(doc)
    expect(await loadDocument()).toEqual(doc)
  })

  it('recovers from tmp when the main file is missing', async () => {
    const doc = docWithDay('2026-10-27', 4)
    disk.set(TMP_PATH, JSON.stringify(doc))
    expect(await loadDocument()).toEqual(doc)
    expect(disk.has(DOCUMENT_PATH)).toBe(true)
    expect(disk.has(TMP_PATH)).toBe(false)
  })

  it('a corrupt file throws StoreCorruptError and is preserved', async () => {
    disk.set(DOCUMENT_PATH, '{"version": 2, "entries": ')
    const error = await loadDocument().catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(StoreCorruptError)
    expect((error as InstanceType<typeof StoreCorruptError>).reason).toBe('not-json')
    expect(disk.get(DOCUMENT_PATH)).toBe('{"version": 2, "entries": ')
    const copies = [...disk.keys()].filter((name) => name.startsWith('n1naplo.corrupt-'))
    expect(copies).toHaveLength(1)
    expect(disk.get(copies[0])).toBe('{"version": 2, "entries": ')
  })

  it('prefers a readable main file over a leftover tmp', async () => {
    const saved = docWithDay('2026-10-27', 2)
    disk.set(DOCUMENT_PATH, JSON.stringify(saved))
    disk.set(TMP_PATH, JSON.stringify(docWithDay('2026-10-27', 5)))
    expect(await loadDocument()).toEqual(saved)
  })
})

describe('createSaver', () => {
  it('keeps the old file when the write fails', async () => {
    const save = createSaver()
    const old = docWithDay('2026-10-26', 2)
    await save(old)
    failures.add(`write:${TMP_PATH}`)
    await expect(save(docWithDay('2026-10-27', 5))).rejects.toThrow('disk full')
    expect(await loadDocument()).toEqual(old)
  })

  it('replaces the main file where rename refuses to overwrite', async () => {
    renameOverwrites = false
    const save = createSaver()
    await save(docWithDay('2026-10-26', 1))
    const next = docWithDay('2026-10-27', 4)
    await save(next)
    expect(await loadDocument()).toEqual(next)
    expect(disk.has(TMP_PATH)).toBe(false)
  })

  it('three unawaited saves end with the last document on disk', async () => {
    const save = createSaver()
    const last = docWithDay('2026-10-28', 5)
    const writes = [
      save(docWithDay('2026-10-26', 1)),
      save(docWithDay('2026-10-27', 2)),
      save(last),
    ]
    await Promise.all(writes)
    expect(await loadDocument()).toEqual(last)
    expect(disk.has(TMP_PATH)).toBe(false)
  })

  it('a failed save does not block the next one', async () => {
    const save = createSaver()
    failures.add(`write:${TMP_PATH}`)
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
    expect(await loadDocument()).toEqual(next)
  })
})
