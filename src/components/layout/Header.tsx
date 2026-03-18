'use client'

import { useNavigationStore } from '@/stores/navigationStore'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import { Navigation } from './Navigation'
import { MobileMenu } from './MobileMenu'

export function Header() {
  useScrollSpy()

  const isScrolled = useNavigationStore((s) => s.isScrolled)
  const isMenuOpen = useNavigationStore((s) => s.isMenuOpen)
  const toggleMenu = useNavigationStore((s) => s.toggleMenu)

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-[var(--duration-slow)]
          ${isScrolled
            ? 'bg-white/95 backdrop-blur-sm shadow-sm py-4'
            : 'py-6'
          }
        `}
      >
        {/* Subtle top gradient for contrast when over hero (only when not scrolled) */}
        {!isScrolled && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dark/50 to-transparent" />
        )}

        <div className="relative mx-auto flex w-full max-w-[1200px] items-center justify-between px-6">
          {/* Logo */}
          <a
            href="/"
            className={`text-xl font-light tracking-[0.2em] uppercase transition-colors duration-[var(--duration-slow)] ${
              isScrolled ? 'text-dark' : 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]'
            }`}
          >
            Skowronek Studio
          </a>

          {/* Desktop nav */}
          <Navigation className="hidden lg:block" isOverHero={!isScrolled} />

          {/* Mobile hamburger */}
          <button
            onClick={toggleMenu}
            className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
            aria-label={isMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
          >
            <span
              className={`h-[1.5px] w-6 transition-all duration-300 ${
                isScrolled ? 'bg-dark' : 'bg-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
              } ${isMenuOpen ? 'translate-y-[5px] rotate-45 !bg-dark' : ''}`}
            />
            <span
              className={`h-[1.5px] w-6 transition-all duration-300 ${
                isScrolled ? 'bg-dark' : 'bg-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
              } ${isMenuOpen ? 'opacity-0' : ''}`}
            />
            <span
              className={`h-[1.5px] w-6 transition-all duration-300 ${
                isScrolled ? 'bg-dark' : 'bg-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
              } ${isMenuOpen ? '-translate-y-[5px] -rotate-45 !bg-dark' : ''}`}
            />
          </button>
        </div>
      </header>

      <MobileMenu />
    </>
  )
}
