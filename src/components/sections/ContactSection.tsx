'use client'

import { useState, type FormEvent } from 'react'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { AnimatedSection } from '@/components/animations/AnimatedSection'

interface ContactData {
  title: string
  heading: string
  subtitle: string
  email: string
  phone: string
  address: string
  facebook: string
  instagram: string
  tiktok: string
}

export function ContactSection({ data }: { data: ContactData }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const res = await fetch('/api/contact-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          phone: formData.get('phone'),
          message: formData.get('message'),
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

  const email = data.email || 'kontakt@skowronekstudio.pl'
  const phone = data.phone || '+48 123 456 789'
  const address = data.address || 'ul. Przykladowa 10, 00-001 Warszawa'

  return (
    <Section id="contact">
      <div className="grid gap-12 md:grid-cols-2">
        {/* Info */}
        <AnimatedSection variant="fade-left">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-primary">{data.title}</p>
          <Heading as="h2" className="mb-6">
            {data.heading}
          </Heading>
          {data.subtitle && (
            <p className="mb-8 leading-relaxed text-body">
              {data.subtitle}
            </p>
          )}

          <div className="space-y-4 text-body">
            <div>
              <p className="text-sm uppercase tracking-[0.1em] text-primary">Email</p>
              <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                {email}
              </a>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.1em] text-primary">Telefon</p>
              <a href={`tel:${phone.replace(/\s/g, '')}`} className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                {phone}
              </a>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.1em] text-primary">Adres</p>
              <p>{address}</p>
            </div>
          </div>

          {/* Social */}
          <div className="mt-8 flex items-center gap-1">
            {data.facebook && (
              <a
                href={data.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 min-w-11 items-center justify-center text-body transition-colors hover:text-primary"
                aria-label="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            )}
            {data.instagram && (
              <a
                href={data.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 min-w-11 items-center justify-center text-body transition-colors hover:text-primary"
                aria-label="Instagram"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            )}
            {data.tiktok && (
              <a
                href={data.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-11 min-w-11 items-center justify-center text-body transition-colors hover:text-primary"
                aria-label="TikTok"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            )}
            {!data.facebook && !data.instagram && !data.tiktok && (
              <>
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
              </>
            )}
          </div>
        </AnimatedSection>

        {/* Form */}
        <AnimatedSection variant="fade-right" delay={0.2}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm uppercase tracking-[0.1em] text-dark">
                Imie i nazwisko
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
                Wiadomosc
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
              {status === 'sending' ? 'Wysylanie...' : 'Wyslij wiadomosc'}
            </Button>

            {status === 'sent' && (
              <p className="text-sm text-primary">Dziekujemy! Odpowiemy najszybciej jak to mozliwe.</p>
            )}
            {status === 'error' && (
              <p className="text-sm text-red-600">Wystapil blad. Sprobuj ponownie lub napisz na email.</p>
            )}
          </form>
        </AnimatedSection>
      </div>
    </Section>
  )
}
