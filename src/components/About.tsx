import { hu } from '@/i18n/hu'
import { fill } from '@/lib/text'

const LINKS = [
  { href: 'https://github.com/ohm-the-everything/n1naplo', label: hu.about.source },
  { href: 'https://n1naplo.org', label: hu.about.site },
  { href: 'https://n1naplo.org/adatvedelem/', label: hu.about.privacyLink },
]

export default function About() {
  return (
    <section className="rounded-xl border border-line bg-card p-4 text-sm">
      <h2 className="font-semibold">{hu.about.section}</h2>
      <p className="mt-1 text-muted">{fill(hu.about.version, { version: __APP_VERSION__ })}</p>
      <p className="mt-2">{hu.about.privacy}</p>
      <p className="mt-2">{hu.about.license}</p>
      <ul className="mt-2 flex flex-col gap-1">
        {LINKS.map((link) => (
          <li key={link.href}>
            <a href={link.href} className="font-medium text-sage underline">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-muted">{hu.about.publisher}</p>
    </section>
  )
}
