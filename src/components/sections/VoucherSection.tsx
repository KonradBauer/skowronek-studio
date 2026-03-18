'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/Button'
import { AnimatedSection } from '@/components/animations/AnimatedSection'

export function VoucherSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/voucher.jpg"
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
              Bon podarunkowy
            </p>
            <h2 className="mb-6 text-3xl font-light tracking-wide text-white md:text-4xl lg:text-5xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              Podaruj wyjatkowe chwile
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-white/80">
              Szukasz idealnego prezentu? Voucher na sesje fotograficzna to piekny
              i osobisty upominek na kazda okazje — urodziny, rocznice, Dzien Matki
              czy swieta.
            </p>
            <Button
              variant="outline"
              size="lg"
              href="#contact"
              className="border-white text-white hover:bg-white/15"
            >
              Zamow voucher
            </Button>
          </AnimatedSection>
        </div>
      </div>
    </section>
  )
}
