'use client'

import { useState, useEffect } from 'react'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  function accept(level: 'all' | 'essential') {
    localStorage.setItem('cookie-consent', level)
    setVisible(false)
  }

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-warm-gray/20 bg-dark/95 backdrop-blur-sm transition-transform duration-500 ease-[var(--ease-smooth)] ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-5 sm:flex-row">
        <p className="flex-1 text-sm leading-relaxed text-cream/90">
          Ta strona wykorzystuje pliki cookies niezbędne do działania panelu klienta
          (logowanie i&nbsp;autoryzacja). Nie stosujemy cookies śledzących ani
          marketingowych.
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={() => accept('essential')}
            className="cursor-pointer rounded px-4 py-2 text-sm font-medium tracking-wide text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream"
          >
            Tylko niezbędne
          </button>
          <button
            onClick={() => accept('all')}
            className="cursor-pointer rounded bg-primary px-4 py-2 text-sm font-medium tracking-wide text-white transition-colors hover:bg-primary-dark"
          >
            Akceptuję
          </button>
        </div>
      </div>
    </div>
  )
}
