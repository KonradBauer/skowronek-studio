import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { SocialLinks } from './SocialLinks'

const NAV_LINKS = [
  { label: 'O nas', href: '#about' },
  { label: 'Portfolio', href: '#portfolio' },
  { label: 'Oferta', href: '#services' },
  { label: 'Voucher', href: '#voucher' },
  { label: 'Opinie', href: '#reviews' },
  { label: 'Kontakt', href: '#contact' },
]

interface FooterProps {
  contact?: { email?: string; phone?: string; address?: string }
  social?: { facebook?: string; instagram?: string; tiktok?: string }
}

export function Footer({ contact, social }: FooterProps) {
  const currentYear = new Date().getFullYear()

  const email = contact?.email || ''
  const phone = contact?.phone || ''
  const address = contact?.address || ''

  return (
    <footer className="border-t border-warm-gray bg-cream">
      <Container>
        <div className="grid gap-10 py-14 md:grid-cols-3 lg:grid-cols-4">
          {/* Logo + opis */}
          <div className="lg:col-span-1">
            <Link href="/" className="block">
              <span className="text-lg font-light uppercase tracking-[0.25em] text-dark">
                Foto Studio
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-body-muted">
              Profesjonalne studio fotograficzne. Uchwycamy chwile, ktore zostaja na zawsze.
            </p>
          </div>

          {/* Nawigacja */}
          <nav aria-label="Mapa strony">
            <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-dark">
              Nawigacja
            </h3>
            <ul className="space-y-0">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    className="inline-flex min-h-11 items-center text-sm text-body-muted transition-colors hover:text-primary"
                  >
                    {label}
                  </a>
                </li>
              ))}
              <li>
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center text-sm text-body-muted transition-colors hover:text-primary"
                >
                  Panel klienta
                </Link>
              </li>
            </ul>
          </nav>

          {/* Kontakt */}
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-dark">
              Kontakt
            </h3>
            <ul className="space-y-0 text-sm text-body-muted">
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                    {email}
                  </a>
                </li>
              )}
              {phone && (
                <li>
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                    {phone}
                  </a>
                </li>
              )}
              {address && (
                <li className="flex min-h-11 items-center">{address}</li>
              )}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-4 text-sm font-medium uppercase tracking-[0.15em] text-dark">
              Social
            </h3>
            <SocialLinks facebook={social?.facebook} instagram={social?.instagram} tiktok={social?.tiktok} />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-warm-gray py-6">
          <div className="flex flex-col items-center gap-1">
            <p className="text-center text-xs text-body-muted">
              &copy; {currentYear} Foto Studio. Wszelkie prawa zastrzezone.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
