'use client'

import Image from 'next/image'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { AnimatedSection } from '@/components/animations/AnimatedSection'

const GALLERY_ITEMS = [
  { id: 1, title: 'Wesele Anny i Marka', category: 'Wesela', image: '/images/portfolio-1.jpg' },
  { id: 2, title: 'Sesja portretowa', category: 'Portrety', image: '/images/portfolio-2.jpg' },
  { id: 3, title: 'Ślub w plenerze', category: 'Wesela', image: '/images/portfolio-3.jpg' },
  { id: 4, title: 'Wesele nad morzem', category: 'Wesela', image: '/images/portfolio-4.jpg' },
  { id: 5, title: 'Sesja narzeczeńska', category: 'Portrety', image: '/images/portfolio-5.jpg' },
  { id: 6, title: 'Sesja rodzinna', category: 'Rodzinne', image: '/images/portfolio-6.jpg' },
]

export function PortfolioSection() {
  return (
    <Section id="portfolio">
      <AnimatedSection>
        <div className="mb-12 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-primary">Portfolio</p>
          <Heading as="h2">Nasze realizacje</Heading>
        </div>
      </AnimatedSection>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {GALLERY_ITEMS.map((item, i) => (
          <AnimatedSection key={item.id} variant="scale-in" delay={i * 0.1}>
            <div className="group relative aspect-[4/3] cursor-pointer overflow-hidden bg-warm-gray">
              {/* Image */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark/0 transition-all duration-500 group-hover:bg-dark/60">
                <p className="translate-y-4 text-sm uppercase tracking-[0.15em] text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {item.category}
                </p>
                <p className="mt-2 translate-y-4 text-lg font-light text-white opacity-0 transition-all delay-75 duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  {item.title}
                </p>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </Section>
  )
}
