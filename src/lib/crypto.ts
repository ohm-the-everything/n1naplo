export const ENCRYPTED_FORMAT = 'n1naplo-backup-encrypted'
const ITERATIONS = 600_000 // OWASP 2023 minimum for PBKDF2-HMAC-SHA256

type Envelope = {
  format: typeof ENCRYPTED_FORMAT
  kdf: 'PBKDF2-SHA256'
  iterations: number
  salt: string
  iv: string
  ciphertext: string
}

export type Decrypted = { ok: true; value: string } | { ok: false; error: 'wrong-passphrase' }

export function isEncryptedBackup(text: string): boolean {
  try {
    return (JSON.parse(text) as { format?: unknown }).format === ENCRYPTED_FORMAT
  } catch {
    return false
  }
}

export async function encryptBackup(text: string, passphrase: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(passphrase, salt, ITERATIONS)
  const sealed = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(text),
  )
  const envelope: Envelope = {
    format: ENCRYPTED_FORMAT,
    kdf: 'PBKDF2-SHA256',
    iterations: ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ciphertext: toBase64(new Uint8Array(sealed)),
  }
  return JSON.stringify(envelope)
}

// AES-GCM cannot tell a wrong passphrase from a damaged file; both fail authentication.
export async function decryptBackup(sealedText: string, passphrase: string): Promise<Decrypted> {
  try {
    const envelope = JSON.parse(sealedText) as Envelope
    const key = await deriveKey(passphrase, fromBase64(envelope.salt), envelope.iterations)
    const plain = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(envelope.iv) },
      key,
      fromBase64(envelope.ciphertext),
    )
    return { ok: true, value: new TextDecoder().decode(plain) }
  } catch {
    return { ok: false, error: 'wrong-passphrase' }
  }
}

async function deriveKey(passphrase: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
  const material = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase.normalize('NFC')),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(text: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(text), (char) => char.charCodeAt(0))
}
