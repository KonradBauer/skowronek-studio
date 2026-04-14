import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { SocialLinks } from './SocialLinks'
import { FooterNav } from './FooterNav'

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
            <Link href="/">
              <Image
                src="/logo.png"
                alt="Skowronek Studio"
                width={180}
                height={66}
                className="h-20 w-auto object-contain"
              />
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
            <FooterNav />
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
          <div className="flex flex-col items-center gap-2">
            <p className="text-center text-xs text-body-muted">
              &copy; {currentYear} Skowronek Studio. Wszelkie prawa zastrzezone.
            </p>
            <div className="flex items-center gap-4 text-xs text-body-muted/60">
              <Link href="/polityka-prywatnosci" className="transition-colors hover:text-primary">
                Polityka prywatności
              </Link>
              <span>·</span>
              <a
                href="https://kbauer.pl"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-primary"
              >
                kbauer.pl
              </a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  )
}
