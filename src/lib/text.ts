// Fills {name} placeholders in a message. Messages stay plain strings, so the i18n files
// remain data that can be typed and compared key by key.
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  )
}
