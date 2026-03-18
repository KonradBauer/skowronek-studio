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
              <p>kontakt@skowronekstudio.pl</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.1em] text-primary">Telefon</p>
              <p>+48 123 456 789</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.1em] text-primary">Adres</p>
              <p>ul. Przykładowa 10, 00-001 Warszawa</p>
            </div>
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
                className="w-full border-b border-warm-gray bg-transparent px-0 py-3 text-dark outline-none transition-colors focus:border-primary"
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
                className="w-full border-b border-warm-gray bg-transparent px-0 py-3 text-dark outline-none transition-colors focus:border-primary"
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
                className="w-full border-b border-warm-gray bg-transparent px-0 py-3 text-dark outline-none transition-colors focus:border-primary"
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
                className="w-full resize-none border-b border-warm-gray bg-transparent px-0 py-3 text-dark outline-none transition-colors focus:border-primary"
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
