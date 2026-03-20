'use client'

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
  const imageUrl = data.imageUrl || '/images/voucher.jpg'

  return (
    <section id="voucher" className="relative overflow-hidden">
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
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 py-24 md:py-32">
        <div className="mx-auto max-w-xl text-center">
          <AnimatedSection>
            <p className="mb-4 text-sm uppercase tracking-[0.3em] text-accent">
              {data.label}
            </p>
            <h2 className="mb-6 text-3xl font-light tracking-wide text-white md:text-4xl lg:text-5xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              {data.title}
            </h2>
            {data.description && (
              <p className="mb-10 text-lg leading-relaxed text-white/80">
                {data.description}
              </p>
            )}
            <Button
              variant="outline"
              size="lg"
              href={data.ctaLink}
              className="border-white text-white hover:bg-white/15"
            >
              {data.ctaText}
            </Button>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
