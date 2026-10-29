import { useT } from '@/i18n'
import { fill } from '@/lib/text'

export default function About() {
  const t = useT()
  const LINKS = [
    { href: 'https://github.com/ohm-the-everything/n1naplo', label: t.about.source },
    { href: 'https://n1naplo.org', label: t.about.site },
    { href: 'https://n1naplo.org/adatvedelem/', label: t.about.privacyLink },
  ]
  return (
    <section className="rounded-xl border border-line bg-card p-4 text-sm">
      <h2 className="font-semibold">{t.about.section}</h2>
      <p className="mt-1 text-muted">{fill(t.about.version, { version: __APP_VERSION__ })}</p>
      <p className="mt-2">{t.about.privacy}</p>
      <p className="mt-2">{t.about.license}</p>
      <ul className="mt-2 flex flex-col gap-1">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="font-medium text-sage underline">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-muted">{t.about.publisher}</p>
    </section>
  )
}
