'use client'

import { useEffect } from 'react'
import { useNavigationStore } from '@/stores/navigationStore'

const SECTIONS = ['about', 'portfolio', 'services', 'contact']

export function useScrollSpy() {
  const setActiveSection = useNavigationStore((s) => s.setActiveSection)
  const setIsScrolled = useNavigationStore((s) => s.setIsScrolled)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [setIsScrolled])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id)
          }
        }
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
    )

    for (const id of SECTIONS) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [setActiveSection])
}
