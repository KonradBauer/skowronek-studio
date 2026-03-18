import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { StripeTransition } from '@/components/animations/StripeTransition'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { JsonLd } from '@/components/seo/JsonLd'
import '@/styles/globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skowronekstudio.pl'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Skowronek Studio - Fotografia slubna, portretowa i rodzinna',
    template: '%s | Skowronek Studio',
  },
  description:
    'Profesjonalne studio fotograficzne specjalizujace sie w fotografii slubnej, portretowej i rodzinnej. Uchwycamy chwile, ktore zostaja na zawsze. Czestochowa i okolice.',
  keywords: [
    'fotograf slubny',
    'fotografia slubna',
    'fotograf Czestochowa',
    'studio fotograficzne',
    'fotografia portretowa',
    'fotografia rodzinna',
    'sesja zdjeciowa',
    'film slubny',
    'Skowronek Studio',
    'fotograf wesele',
  ],
  authors: [{ name: 'Skowronek Studio' }],
  creator: 'Skowronek Studio',
  openGraph: {
    title: 'Skowronek Studio - Fotografia slubna, portretowa i rodzinna',
    description:
      'Profesjonalne studio fotograficzne. Fotografia slubna, portretowa, rodzinna i filmowanie. Czestochowa i okolice.',
    url: SITE_URL,
    siteName: 'Skowronek Studio',
    locale: 'pl_PL',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Skowronek Studio - Fotografia z pasja',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skowronek Studio - Fotografia slubna, portretowa i rodzinna',
    description:
      'Profesjonalne studio fotograficzne. Fotografia slubna, portretowa, rodzinna i filmowanie.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: SITE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="antialiased">
        <JsonLd />
        <Header />
        <StripeTransition />
        <main>{children}</main>
        <Footer />
        <ScrollToTop />
      </body>
    </html>
  )
}
