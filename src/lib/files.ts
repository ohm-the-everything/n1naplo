import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export async function shareFile(name: string, data: string | Uint8Array, mime: string) {
  if (Capacitor.isNativePlatform()) {
    const text = typeof data === 'string'
    const written = await Filesystem.writeFile({
      path: name,
      data: text ? data : toBase64(data),
      directory: Directory.Cache,
      ...(text ? { encoding: Encoding.UTF8 } : {}),
    })
    await Share.share({ title: name, files: [written.uri] })
    return
  }
  const blob = new Blob([typeof data === 'string' ? data : new Uint8Array(data)], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function pickTextFile(accept: string): Promise<{ name: string; text: string } | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.addEventListener('change', async () => {
      const file = input.files?.[0]
      resolve(file ? { name: file.name, text: await file.text() } : null)
    })
    input.addEventListener('cancel', () => resolve(null))
    input.click()
  })
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}
