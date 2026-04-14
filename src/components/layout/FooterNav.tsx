'use client'

import Link from 'next/link'

const NAV_LINKS = [
  { label: 'O nas', sectionId: 'about' },
  { label: 'Portfolio', sectionId: 'portfolio' },
  { label: 'Oferta', sectionId: 'services' },
  { label: 'Voucher', sectionId: 'voucher' },
  { label: 'Opinie', sectionId: 'reviews' },
  { label: 'Kontakt', sectionId: 'contact' },
]

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function FooterNav() {
  return (
    <ul className="space-y-0">
      {NAV_LINKS.map(({ label, sectionId }) => (
        <li key={sectionId}>
          <a
            href={`#${sectionId}`}
            onClick={(e) => { e.preventDefault(); scrollToSection(sectionId) }}
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
  )
}
