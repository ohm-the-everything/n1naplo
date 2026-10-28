import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { hu } from '@/i18n/hu'
import { buildCsv } from '@/lib/csv'
import { todayIso } from '@/lib/dates'
import { medName } from '@/lib/meds'
import type { DayEntry, Settings } from '@/types'

export async function exportCsv(
  entries: Record<string, DayEntry>,
  settings: Settings,
): Promise<void> {
  const meds = settings.meds.map((med, index) => ({ ...med, label: medName(med, index) }))
  const csv = buildCsv(Object.values(entries), meds)
  const fileName = `n1naplo-${todayIso()}.csv`

  if (Capacitor.isNativePlatform()) {
    const written = await Filesystem.writeFile({
      path: fileName,
      data: csv,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    await Share.share({ title: hu.settings.exportButton, files: [written.uri] })
    return
  }

  // Böngészőben (fejlesztés közben): sima letöltés.
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}
