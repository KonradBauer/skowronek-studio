'use client'

import { useEffect, useRef } from 'react'
import { useNavigationStore } from '@/stores/navigationStore'

const SECTIONS = ['about', 'portfolio', 'services', 'contact']
const SCROLL_THRESHOLD = 50
const HIDE_DELTA = 8

export function useScrollSpy() {
  const setActiveSection = useNavigationStore((s) => s.setActiveSection)
  const setIsScrolled = useNavigationStore((s) => s.setIsScrolled)
  const setIsHeaderVisible = useNavigationStore((s) => s.setIsHeaderVisible)
  const prevScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY

      setIsScrolled(currentY > SCROLL_THRESHOLD)

      // Na samej gorze - zawsze widoczny
      if (currentY < SCROLL_THRESHOLD) {
        setIsHeaderVisible(true)
      } else {
        const delta = currentY - prevScrollY.current
        if (delta > HIDE_DELTA) {
          setIsHeaderVisible(false) // scroll down - chowaj
        } else if (delta < -HIDE_DELTA) {
          setIsHeaderVisible(true) // scroll up - pokazuj
        }
      }

      prevScrollY.current = currentY
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [setIsScrolled, setIsHeaderVisible])

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
