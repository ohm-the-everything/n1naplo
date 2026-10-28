import bold from '@/assets/fonts/NotoSans-Bold.subset.ttf?inline'
import regular from '@/assets/fonts/NotoSans-Regular.subset.ttf?inline'

// Bundled as data URLs so the PDF never needs a request.
const bytes = (dataUrl: string) =>
  Uint8Array.from(atob(dataUrl.slice(dataUrl.indexOf(',') + 1)), (char) => char.charCodeAt(0))

export function summaryFonts() {
  return { regular: bytes(regular), bold: bytes(bold) }
}
