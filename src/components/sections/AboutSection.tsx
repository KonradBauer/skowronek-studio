'use client'

import Image from 'next/image'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { AnimatedSection } from '@/components/animations/AnimatedSection'

export function AboutSection() {
  return (
    <Section id="about" alternate>
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        {/* Image */}
        <AnimatedSection variant="fade-left">
          <div className="relative aspect-[3/4] overflow-hidden bg-warm-gray">
            <Image
              src="/images/about.jpg"
              alt="Fotograf Skowronek Studio przy pracy"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </AnimatedSection>

        {/* Text */}
        <AnimatedSection variant="fade-right" delay={0.2}>
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-primary">O nas</p>
          <Heading as="h2" className="mb-6">
            Chwile, które zostają na zawsze
          </Heading>
          <div className="space-y-4 text-body leading-relaxed">
            <p>
              Skowronek Studio to miejsce, gdzie pasja do fotografii spotyka się z profesjonalizmem.
              Specjalizujemy się w fotografii ślubnej, portretowej i rodzinnej.
            </p>
            <p>
              Każda sesja to dla nas unikalna historia — Twoja historia. Łączymy naturalność
              z artystyczną wizją, tworząc obrazy, które będą Ci towarzyszyć przez lata.
            </p>
            <p>
              Wierzymy, że najpiękniejsze kadry powstają wtedy, gdy czujesz się swobodnie.
              Dlatego stawiamy na relację i atmosferę, dzięki której zdjęcia oddają prawdziwe emocje.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </Section>
  )
}
