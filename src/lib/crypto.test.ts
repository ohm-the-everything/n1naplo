import { describe, expect, it } from 'vitest'
import { decryptBackup, encryptBackup, isEncryptedBackup } from './crypto'

const PASS = 'kék bicikli 42'

describe('encrypted backups', () => {
  it('decrypts with the right passphrase to the exact text', async () => {
    const text = '{"format":"n1naplo-backup","note":"ő ű 🙂"}'
    const sealed = await encryptBackup(text, PASS)
    expect(isEncryptedBackup(sealed)).toBe(true)
    expect(sealed).not.toContain('n1naplo-backup","note')
    expect(await decryptBackup(sealed, PASS)).toEqual({ ok: true, value: text })
  })

  it('rejects a wrong passphrase', async () => {
    const sealed = await encryptBackup('{}', PASS)
    expect(await decryptBackup(sealed, 'kék bicikli 43')).toEqual({
      ok: false,
      error: 'wrong-passphrase',
    })
  })

  it('rejects a tampered file', async () => {
    const sealed = JSON.parse(await encryptBackup('{"a":1}', PASS))
    const bytes = atob(sealed.ciphertext)
    sealed.ciphertext = btoa(String.fromCharCode(bytes.charCodeAt(0) ^ 1) + bytes.slice(1))
    expect(await decryptBackup(JSON.stringify(sealed), PASS)).toEqual({
      ok: false,
      error: 'wrong-passphrase',
    })
  })

  it('does not take a plain backup for an encrypted one', () => {
    expect(isEncryptedBackup('{"format":"n1naplo-backup","document":{}}')).toBe(false)
    expect(isEncryptedBackup('datum,izgalom')).toBe(false)
  })
})
