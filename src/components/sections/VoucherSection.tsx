import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { AnimatedSection } from '@/components/animations/AnimatedSection'

interface VoucherData {
  label: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
  imageUrl: string
}

export function VoucherSection({ data }: { data: VoucherData }) {
  const imageUrl = data.imageUrl || 'https://picsum.photos/seed/voucher-bg/1920/1080'

  return (
    <section id="voucher" className="relative overflow-hidden scroll-mt-20">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-dark/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1200px] px-8 py-24 md:py-36 md:px-16">
        <AnimatedSection>
          <div className="max-w-lg">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-[1px] w-8 bg-accent" />
              <p className="text-xs uppercase tracking-[0.3em] text-accent">
                {data.label}
              </p>
            </div>
            <h2 className="mb-6 text-3xl font-normal italic leading-tight md:text-4xl lg:text-5xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" style={{ color: '#ffffff' }}>
              {data.title}
            </h2>
            {data.description && (
              <p className="mb-10 text-base leading-relaxed text-white/75">
                {data.description}
              </p>
            )}
            <Button
              variant="outline"
              size="lg"
              href={data.ctaLink}
              className="border-white/60 text-white hover:bg-white/15 hover:border-white"
            >
              {data.ctaText}
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  )
}
