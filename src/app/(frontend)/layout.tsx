import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { StripeTransition } from '@/components/animations/StripeTransition'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Skowronek Studio - Fotografia z pasją',
  description:
    'Profesjonalne studio fotograficzne. Fotografia ślubna, portretowa, rodzinna. Uchwycamy chwile, które zostają na zawsze.',
  openGraph: {
    title: 'Skowronek Studio - Fotografia z pasją',
    description: 'Profesjonalne studio fotograficzne specjalizujące się w fotografii ślubnej, portretowej i rodzinnej.',
    locale: 'pl_PL',
    type: 'website',
  },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="antialiased">
        <Header />
        <StripeTransition />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
