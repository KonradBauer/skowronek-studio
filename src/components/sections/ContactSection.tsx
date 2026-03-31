'use client'

import { useState, type FormEvent } from 'react'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { Button } from '@/components/ui/Button'
import { AnimatedSection } from '@/components/animations/AnimatedSection'
import { SocialLinks } from '@/components/layout/SocialLinks'

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
        setTimeout(() => setStatus('idle'), 5000)
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  const email = data.email
  const phone = data.phone
  const address = data.address

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
              {email && (
                <div>
                  <p className="text-sm uppercase tracking-[0.1em] text-primary">Email</p>
                  <a href={`mailto:${email}`} className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                    {email}
                  </a>
                </div>
              )}
              {phone && (
                <div>
                  <p className="text-sm uppercase tracking-[0.1em] text-primary">Telefon</p>
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className="inline-flex min-h-11 items-center transition-colors hover:text-primary">
                    {phone}
                  </a>
                </div>
              )}
              {address && (
                <div>
                  <p className="text-sm uppercase tracking-[0.1em] text-primary">Adres</p>
                  <p>{address}</p>
                </div>
              )}
            </div>

            {/* Social */}
            <div className="mt-8">
              <SocialLinks facebook={data.facebook} instagram={data.instagram} tiktok={data.tiktok} />
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