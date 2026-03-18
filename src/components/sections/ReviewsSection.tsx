'use client'

import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { AnimatedSection } from '@/components/animations/AnimatedSection'

// Placeholder — docelowo pobierane z Google Places API
const REVIEWS = [
  {
    author: 'Anna K.',
    rating: 5,
    text: 'Fantastyczna obsługa naszego wesela! Zdjęcia przeszły nasze najśmielsze oczekiwania. Polecamy z całego serca!',
    date: '2 miesiące temu',
  },
  {
    author: 'Marek W.',
    rating: 5,
    text: 'Profesjonalizm na najwyższym poziomie. Sesja rodzinna w plenerze — naturalne, piękne kadry. Dzieci uwielbiały fotografa!',
    date: '3 miesiące temu',
  },
  {
    author: 'Kasia i Tomek',
    rating: 5,
    text: 'Nasz teledysk ślubny to małe dzieło sztuki. Każdy kto go widzi, pyta o kontakt do studia. Dziękujemy!',
    date: '1 miesiąc temu',
  },
]

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={i < count ? '#FBBC04' : '#E8E2DA'}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  )
}

export function ReviewsSection() {
  return (
    <Section id="reviews" alternate>
      <AnimatedSection>
        <div className="mb-12 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-primary">Opinie</p>
          <Heading as="h2">Co mówią nasi klienci</Heading>
          {/* Google rating summary */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Stars count={5} />
            <span className="text-sm text-body">5.0 na Google</span>
          </div>
        </div>
      </AnimatedSection>

      <div className="grid gap-8 md:grid-cols-3">
        {REVIEWS.map((review, i) => (
          <AnimatedSection key={review.author} variant="fade-up" delay={i * 0.15}>
            <div className="flex h-full flex-col border border-warm-gray bg-white p-8">
              <Stars count={review.rating} />
              <p className="mt-4 flex-1 leading-relaxed text-body italic">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm font-medium text-dark">{review.author}</p>
                <p className="text-xs text-body/50">{review.date}</p>
              </div>
              {/* Google icon */}
              <div className="mt-4 flex items-center gap-1.5 text-body/40">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-xs">Opinia Google</span>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>

      {/* Link to all reviews */}
      <AnimatedSection delay={0.4}>
        <div className="mt-10 text-center">
          <a
            href="https://www.google.com/maps/place/Skowronek+Studio/@50.826258,19.095474,17z/data=!3m1!4b1!4m6!3m5!1s0x4710b7a1f9da3c9d:0xec191a5533d2b0e3!8m2!3d50.826258!4d19.095474!16s%2Fg%2F11y4b2t9cl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm uppercase tracking-[0.15em] text-primary transition-colors hover:text-primary-dark"
          >
            Zobacz wszystkie opinie na Google &rarr;
          </a>
        </div>
      </AnimatedSection>
    </Section>
  )
}
