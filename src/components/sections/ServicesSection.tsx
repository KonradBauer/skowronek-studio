import Image from 'next/image'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { AnimatedSection } from '@/components/animations/AnimatedSection'

interface ServiceItem {
  title: string
  description: string
  image: string
}

interface ServicesData {
  title: string
  subtitle: string
  items: ServiceItem[]
}

const FALLBACK_SERVICES: ServiceItem[] = [
  {
    title: 'Fotografia ślubna',
    description: 'Kompleksowa obsługa Waszego najpiękniejszego dnia - od przygotowań po ostatni taniec.',
    image: 'https://picsum.photos/seed/svc-wedding/800/450',
  },
  {
    title: 'Sesje portretowe',
    description: 'Profesjonalne portrety biznesowe i artystyczne, które oddają Twoją osobowość.',
    image: 'https://picsum.photos/seed/svc-portrait/800/450',
  },
  {
    title: 'Fotografia rodzinna',
    description: 'Naturalne sesje rodzinne w studio lub plenerze. Chrzciny, rocznice, codzienność.',
    image: 'https://picsum.photos/seed/svc-family/800/450',
  },
  {
    title: 'Film',
    description: 'Reportaże wideo i teledyski ślubne. Ruchome obrazy, które opowiadają Waszą historię.',
    image: 'https://picsum.photos/seed/svc-film/800/450',
  },
]

export function ServicesSection({ data }: { data: ServicesData }) {
  const services = data.items.length > 0 ? data.items : FALLBACK_SERVICES

  return (
    <Section id="services" alternate>
      <AnimatedSection>
        <div className="mb-12 flex items-end gap-6">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">{data.title}</p>
            <Heading as="h2">{data.subtitle}</Heading>
          </div>
          <div className="mb-2 flex-1 border-b border-warm-gray" />
        </div>
      </AnimatedSection>

      <div className="grid gap-6 sm:grid-cols-2">
        {services.map((service, i) => (
          <AnimatedSection key={service.title} variant="fade-up" delay={i * 0.1}>
            <div className="group overflow-hidden bg-white">
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-warm-gray">
                <Image
                  src={service.image || 'https://picsum.photos/seed/placeholder/800/600'}
                  alt={service.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute bottom-3 right-4 text-5xl font-light text-white/20 leading-none select-none">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              {/* Text */}
              <div className="p-6">
                <h3 className="mb-2 text-xl text-dark">{service.title}</h3>
                <p className="leading-relaxed text-body">{service.description}</p>
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </Section>
  )
}
