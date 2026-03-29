'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'
import { useNavigationStore } from '@/stores/navigationStore'
import { useScrollSpy } from '@/hooks/useScrollSpy'
import { Navigation } from './Navigation'
import { MobileMenu } from './MobileMenu'

export function Header() {
  useScrollSpy()

  const isScrolled = useNavigationStore((s) => s.isScrolled)
  const isHeaderVisible = useNavigationStore((s) => s.isHeaderVisible)
  const isMenuOpen = useNavigationStore((s) => s.isMenuOpen)
  const toggleMenu = useNavigationStore((s) => s.toggleMenu)

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50 transition-all duration-[var(--duration-slow)]
          ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}
          ${isScrolled
            ? 'bg-white/95 backdrop-blur-sm shadow-sm py-0'
            : 'py-0'
          }
        `}
      >
        {!isScrolled && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-dark/50 to-transparent" />
        )}

        <div className="relative mx-auto flex w-full max-w-[1200px] items-center justify-between px-6">
          {/* Logo */}
          <Link href="/" className="block py-3">
            <Image
              src="/logo.png"
              alt="Skowronek Studio"
              width={820}
              height={180}
              className={`h-24 w-auto object-contain transition-all duration-[var(--duration-slow)] ${
                isScrolled || isMenuOpen
                  ? ''
                  : 'brightness-0 invert drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]'
              }`}
              priority
            />
          </Link>

          {/* Desktop nav */}
          <Navigation className="hidden lg:block" isOverHero={!isScrolled} />

          {/* Mobile hamburger */}
          <button
            onClick={toggleMenu}
            className="relative z-50 flex h-10 w-10 cursor-pointer items-center justify-center lg:hidden"
            aria-label={isMenuOpen ? 'Zamknij menu' : 'Otwórz menu'}
          >
            {isMenuOpen ? (
              <X className="h-6 w-6 text-dark transition-colors duration-300" strokeWidth={1.5} />
            ) : (
              <Menu
                className={`h-6 w-6 transition-colors duration-300 ${
                  isScrolled ? 'text-dark' : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]'
                }`}
                strokeWidth={1.5}
              />
            )}
          </button>
        </div>
      </header>

      <MobileMenu />
    </>
  )
}
