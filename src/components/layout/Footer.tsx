import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-warm-gray bg-cream py-12">
      <Container>
        <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
          {/* Logo */}
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Skowronek Studio"
              width={180}
              height={66}
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Social */}
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-sm uppercase tracking-[0.1em] text-body transition-colors hover:text-primary"
              aria-label="Facebook"
            >
              Facebook
            </a>
            <a
              href="#"
              className="text-sm uppercase tracking-[0.1em] text-body transition-colors hover:text-primary"
              aria-label="Instagram"
            >
              Instagram
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-body/60">
            &copy; {currentYear} Skowronek Studio
          </p>
        </div>
      </Container>
    </footer>
  )
}
