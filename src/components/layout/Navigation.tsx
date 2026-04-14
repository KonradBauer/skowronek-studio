'use client'

import Link from 'next/link'
import { useNavigationStore } from '@/stores/navigationStore'

const NAV_ITEMS = [
  { label: 'O nas', sectionId: 'about' },
  { label: 'Portfolio', sectionId: 'portfolio' },
  { label: 'Oferta', sectionId: 'services' },
  { label: 'Kontakt', sectionId: 'contact' },
]

function scrollToSection(sectionId: string) {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

interface NavigationProps {
  className?: string
  onItemClick?: () => void
  vertical?: boolean
  isOverHero?: boolean
}

export function Navigation({ className = '', onItemClick, vertical = false, isOverHero = false }: NavigationProps) {
  const activeSection = useNavigationStore((s) => s.activeSection)

  const textShadow = isOverHero ? 'drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]' : ''

  return (
    <nav className={className}>
      <ul className={`flex ${vertical ? 'flex-col gap-6' : 'items-center gap-8'}`}>
        {NAV_ITEMS.map(({ label, sectionId }) => {
          const isActive = activeSection === sectionId

          return (
            <li key={sectionId}>
              <a
                href={`#${sectionId}`}
                onClick={(e) => { e.preventDefault(); scrollToSection(sectionId); onItemClick?.() }}
                className={`
                  inline-flex min-h-11 items-center text-sm uppercase tracking-[0.15em] transition-colors duration-[var(--duration-normal)] ${textShadow}
                  ${vertical ? 'text-2xl tracking-[0.2em] font-light' : ''}
                  ${isOverHero
                    ? isActive ? 'text-white' : 'text-white/80 hover:text-white'
                    : isActive ? 'text-primary' : 'text-body-muted hover:text-dark'
                  }
                `}
              >
                {label}
              </a>
            </li>
          )
        })}
        <li>
          <Link
            href="/login"
            className={`
              inline-block px-5 py-2 text-sm uppercase tracking-[0.15em]
              transition-all duration-[var(--duration-normal)]
              ${vertical ? 'mt-4 text-base px-8 py-3' : ''}
              ${isOverHero
                ? `border border-white/70 text-white hover:bg-white hover:text-dark ${textShadow}`
                : 'border border-primary text-primary hover:bg-primary hover:text-white'
              }
            `}
          >
            Panel klienta
          </Link>
        </li>
      </ul>
    </nav>
  )
}
