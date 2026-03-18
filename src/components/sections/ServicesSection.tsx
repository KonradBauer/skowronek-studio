'use client'

import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { AnimatedSection } from '@/components/animations/AnimatedSection'

const SERVICES = [
  {
    title: 'Fotografia slubna',
    description: 'Kompleksowa obsluga Waszego najpiekniejszego dnia — od przygotowan po ostatni taniec.',
    image: '/images/service-wedding.jpg',
  },
  {
    title: 'Sesje portretowe',
    description: 'Profesjonalne portrety biznesowe i artystyczne, ktore oddaja Twoja osobowosc.',
    image: '/images/service-portrait.jpg',
  },
  {
    title: 'Fotografia rodzinna',
    description: 'Naturalne sesje rodzinne w studio lub plenerze. Chrzciny, rocznice, codziennosc.',
    image: '/images/service-family.jpg',
  },
  {
    title: 'Film',
    description: 'Reportaze wideo i teledyski slubne. Ruchome obrazy, ktore opowiadaja Wasza historie.',
    image: '/images/service-film.jpg',
  },
]

export function ServicesSection() {
  return (
    <Section id="services" alternate>
      <AnimatedSection>
        <div className="mb-12 text-center">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-primary">Oferta</p>
          <Heading as="h2">Co oferujemy</Heading>
        </div>
      </AnimatedSection>

      <div className="grid gap-8 sm:grid-cols-2">
        {SERVICES.map((service, i) => (
          <AnimatedSection key={service.title} variant="fade-up" delay={i * 0.15}>
            <div className="group overflow-hidden border border-warm-gray bg-white transition-all duration-500 hover:border-primary/30 hover:shadow-lg">
              {/* Image */}
              <div className="relative aspect-[16/9] overflow-hidden">
                <img
                  src={service.image}
                  alt={service.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              {/* Text */}
              <div className="p-8">
                <h3 className="mb-3 text-xl font-light tracking-wide text-dark">
                  {service.title}
                </h3>
                <p className="leading-relaxed text-body">
                  {service.description}
                </p>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </Section>
  )
}
