import Image from 'next/image'
import { Section } from '@/components/ui/Section'
import { Heading } from '@/components/ui/Heading'
import { AnimatedSection } from '@/components/animations/AnimatedSection'

interface PortfolioItem {
  id: number
  title: string
  category: string
  image: string
}

interface PortfolioData {
  title: string
  subtitle: string
  items: PortfolioItem[]
}

const FALLBACK_ITEMS: PortfolioItem[] = [
  { id: 1, title: 'Sesja plenerowa', category: 'Plener', image: 'https://picsum.photos/seed/port1/1200/800' },
  { id: 2, title: 'Portret studyjny', category: 'Portret', image: 'https://picsum.photos/seed/port2/800/600' },
  { id: 3, title: 'Reportaz okolicznosciowy', category: 'Reportaz', image: 'https://picsum.photos/seed/port3/800/600' },
  { id: 4, title: 'Sesja artystyczna', category: 'Artystyczna', image: 'https://picsum.photos/seed/port4/800/600' },
  { id: 5, title: 'Fotografia produktowa', category: 'Komercyjna', image: 'https://picsum.photos/seed/port5/800/600' },
  { id: 6, title: 'Sesja rodzinna', category: 'Rodzinne', image: 'https://picsum.photos/seed/port6/800/600' },
  { id: 7, title: 'Sesja weselna', category: 'Wesela', image: 'https://picsum.photos/seed/port7/800/600' },
]

export function PortfolioSection({ data }: { data: PortfolioData }) {
  const items = data.items.length > 0 ? data.items : FALLBACK_ITEMS

  return (
    <Section id="portfolio">
      <AnimatedSection>
        <div className="mb-12 flex items-end justify-between border-b border-warm-gray pb-6">
          <div>
            <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">{data.title}</p>
            <Heading as="h2">{data.subtitle}</Heading>
          </div>
        </div>
      </AnimatedSection>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <AnimatedSection
            key={item.id}
            variant="scale-in"
            delay={i * 0.1}
            className={i === 0 ? 'col-span-full' : ''}
          >
            <div className={`group relative cursor-pointer overflow-hidden bg-warm-gray ${i === 0 ? 'aspect-[21/9]' : 'aspect-[4/3]'}`}>
              {/* Image */}
              <Image
                src={item.image}
                alt={item.title}
                fill
                sizes={i === 0 ? '100vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
                className="object-cover transition-transform duration-700 group-hover:scale-108"
              />

              {/* Hover overlay */}
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-dark/70 via-dark/0 to-transparent p-6 opacity-0 transition-all duration-500 group-hover:opacity-100">
                <p className="translate-y-2 text-xs uppercase tracking-[0.2em] text-accent transition-all duration-500 group-hover:translate-y-0">
                  {item.category}
                </p>
                <p className="mt-1 translate-y-2 text-base font-light text-white transition-all delay-50 duration-500 group-hover:translate-y-0">
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
