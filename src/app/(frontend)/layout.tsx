import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { StripeTransition } from '@/components/animations/StripeTransition'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { CookieConsent } from '@/components/ui/CookieConsent'
import { JsonLd } from '@/components/seo/JsonLd'
import '@/styles/globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skowronekstudio.pl'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Skowronek Studio - Fotografia ślubna, portretowa i rodzinna',
    template: '%s | Skowronek Studio',
  },
  description:
    'Profesjonalne studio fotograficzne specjalizujące się w fotografii ślubnej, portretowej i rodzinnej. Uchwycamy chwile, które zostają na zawsze. Częstochowa i okolice.',
  keywords: [
    'fotograf ślubny',
    'fotografia ślubna',
    'fotograf Częstochowa',
    'studio fotograficzne',
    'fotografia portretowa',
    'fotografia rodzinna',
    'sesja zdjęciowa',
    'film ślubny',
    'Skowronek Studio',
    'fotograf wesele',
  ],
  authors: [{ name: 'Skowronek Studio' }],
  creator: 'Skowronek Studio',
  openGraph: {
    title: 'Skowronek Studio - Fotografia ślubna, portretowa i rodzinna',
    description:
      'Profesjonalne studio fotograficzne. Fotografia ślubna, portretowa, rodzinna i filmowanie. Częstochowa i okolice.',
    url: SITE_URL,
    siteName: 'Skowronek Studio',
    locale: 'pl_PL',
    type: 'website',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Skowronek Studio - Fotografia z pasją',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skowronek Studio - Fotografia ślubna, portretowa i rodzinna',
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

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let siteSettings: any = {}
  try {
    const payload = await getPayload({ config })
    siteSettings = await payload.findGlobal({ slug: 'site-settings' })
  } catch {}

  const contact = siteSettings.contact as { email?: string; phone?: string; address?: string } | undefined
  const social = siteSettings.social as { facebook?: string; instagram?: string; tiktok?: string } | undefined

  return (
    <html lang="pl">
      <body className="frontend antialiased">
        <JsonLd contact={contact} social={social} />
        <Header social={social} />
        <StripeTransition />
        <main>{children}</main>
        <Footer contact={contact} social={social} />
        <ScrollToTop />
        <CookieConsent />
      </body>
    </html>
  )
}
