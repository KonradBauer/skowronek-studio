'use client'

import Image from 'next/image'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { AnimatedSection } from '@/components/animations/AnimatedSection'

interface AboutData {
  title: string
  heading: string
  paragraphs: string[]
  imageUrl: string
}

const FALLBACK_PARAGRAPHS = [
  'Skowronek Studio to miejsce, gdzie pasja do fotografii spotyka sie z profesjonalizmem. Specjalizujemy sie w fotografii slubnej, portretowej i rodzinnej.',
  'Kazda sesja to dla nas unikalna historia - Twoja historia. Laczymy naturalnosc z artystyczna wizja, tworzac obrazy, ktore beda Ci towarzyszyc przez lata.',
  'Wierzymy, ze najpiekniejsze kadry powstaja wtedy, gdy czujesz sie swobodnie. Dlatego stawiamy na relacje i atmosfere, dzieki ktorej zdjecia oddaja prawdziwe emocje.',
]

export function AboutSection({ data }: { data: AboutData }) {
  const paragraphs = data.paragraphs.length > 0 ? data.paragraphs : FALLBACK_PARAGRAPHS
  const imageUrl = data.imageUrl || '/images/about.jpg'

  return (
    <Section id="about" alternate>
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        {/* Image */}
        <AnimatedSection variant="fade-left">
          <div className="relative aspect-[3/4] overflow-hidden bg-warm-gray">
            <Image
              src={imageUrl}
              alt="Fotograf Skowronek Studio przy pracy"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </AnimatedSection>

        {/* Text */}
        <AnimatedSection variant="fade-right" delay={0.2}>
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-primary">{data.title}</p>
          <Heading as="h2" className="mb-6">
            {data.heading}
          </Heading>
          <div className="space-y-4 text-body leading-relaxed">
            {paragraphs.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </Section>
  )
}
