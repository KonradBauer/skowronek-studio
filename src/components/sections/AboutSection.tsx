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
  'Profesjonalne studio fotograficzne, gdzie pasja do fotografii spotyka się z profesjonalizmem. Specjalizujemy się w fotografii ślubnej, portretowej i rodzinnej.',
  'Każda sesja to dla nas unikalna historia - Twoja historia. Łączymy naturalność z artystyczną wizją, tworząc obrazy, które będą Ci towarzyszyć przez lata.',
  'Wierzymy, że najpiękniejsze kadry powstają wtedy, gdy czujesz się swobodnie. Dlatego stawiamy na relacje i atmosferę, dzięki której zdjęcia oddają prawdziwe emocje.',
]

export function AboutSection({ data }: { data: AboutData }) {
  const paragraphs = data.paragraphs.length > 0 ? data.paragraphs : FALLBACK_PARAGRAPHS
  const imageUrl = data.imageUrl || 'https://picsum.photos/seed/studio-about/800/600'

  return (
    <Section id="about" alternate>
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        {/* Text - left column */}
        <AnimatedSection variant="fade-left">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-accent">{data.title}</p>
          <Heading as="h2" className="mb-8">
            {data.heading}
          </Heading>
          <div className="space-y-4 text-body leading-relaxed">
            {paragraphs.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
          <div className="mt-8 h-[2px] w-12 bg-accent" />
        </AnimatedSection>

        {/* Image - right column */}
        <AnimatedSection variant="fade-right" delay={0.2}>
          <div className="relative aspect-[4/3] overflow-hidden bg-warm-gray">
            <Image
              src={imageUrl}
              alt="Fotograf przy pracy"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </AnimatedSection>
      </div>
    </Section>
  )
}
