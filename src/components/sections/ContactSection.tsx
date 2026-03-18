'use client'

import { useState, type FormEvent } from 'react'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { AnimatedSection } from '@/components/animations/AnimatedSection'

export function ContactSection() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch('/api/contact-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          phone: data.get('phone'),
          message: data.get('message'),
        }),
      })

      if (res.ok) {
        setStatus('sent')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <Section id="contact">
      <div className="grid gap-12 md:grid-cols-2">
        {/* Info */}
        <AnimatedSection variant="fade-left">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-primary">Kontakt</p>
          <Heading as="h2" className="mb-6">
            Porozmawiajmy
          </Heading>
          <p className="mb-8 leading-relaxed text-body">
            Chętnie porozmawiamy o Twoich planach. Napisz do nas lub zadzwoń —
            razem stworzymy coś wyjątkowego.
          </p>

          <div className="space-y-4 text-body">
            <div>
              <p className="text-sm uppercase tracking-[0.1em] text-primary">Email</p>
              <a href="mailto:kontakt@skowronekstudio.pl" className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                kontakt@skowronekstudio.pl
              </a>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.1em] text-primary">Telefon</p>
              <a href="tel:+48123456789" className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                +48 123 456 789
              </a>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.1em] text-primary">Adres</p>
              <p>ul. Przykładowa 10, 00-001 Warszawa</p>
            </div>
          </div>

          {/* Social */}
          {/* Social */}
          <div className="mt-8 flex items-center gap-1">
            <a
              href="https://www.facebook.com/profile.php?id=61559126443122"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 min-w-11 items-center justify-center text-body transition-colors hover:text-primary"
              aria-label="Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="https://www.instagram.com/skowronek_studio"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 min-w-11 items-center justify-center text-body transition-colors hover:text-primary"
              aria-label="Instagram"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
            </a>
          </div>
        </AnimatedSection>

        {/* Form */}
        <AnimatedSection variant="fade-right" delay={0.2}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm uppercase tracking-[0.1em] text-dark">
                Imię i nazwisko
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full border-b border-input-border bg-transparent px-0 py-3 text-dark outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm uppercase tracking-[0.1em] text-dark">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full border-b border-input-border bg-transparent px-0 py-3 text-dark outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm uppercase tracking-[0.1em] text-dark">
                Telefon
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="w-full border-b border-input-border bg-transparent px-0 py-3 text-dark outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="message" className="mb-2 block text-sm uppercase tracking-[0.1em] text-dark">
                Wiadomość
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                required
                className="w-full resize-none border-b border-input-border bg-transparent px-0 py-3 text-dark outline-none transition-colors focus:border-primary"
              />
            </div>

            <Button type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Wysyłanie...' : 'Wyślij wiadomość'}
            </Button>

            {status === 'sent' && (
              <p className="text-sm text-primary">Dziękujemy! Odpowiemy najszybciej jak to możliwe.</p>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-600">Wystąpił błąd. Spróbuj ponownie lub napisz na email.</p>
            )}
          </form>
        </AnimatedSection>
      </div>
    </Section>
  )
}
