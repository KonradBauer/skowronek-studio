import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { StripeTransition } from '@/components/animations/StripeTransition'
import { ScrollToTop } from '@/components/ui/ScrollToTop'
import { CookieConsent } from '@/components/ui/CookieConsent'
import { JsonLd } from '@/components/seo/JsonLd'
import { seoConfig, buildOgImageUrl, robotsDirectives } from '@/lib/seo'
import '@/styles/globals.css'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-heading',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(seoConfig.siteUrl),
  title: {
    default: seoConfig.defaultTitle,
    template: seoConfig.titleTemplate,
  },
  description: seoConfig.defaultDescription,
  keywords: [...seoConfig.keywords],
  authors: [{ name: seoConfig.siteName }],
  creator: seoConfig.siteName,
  openGraph: {
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    url: seoConfig.siteUrl,
    siteName: seoConfig.siteName,
    locale: 'pl_PL',
    type: 'website',
    images: [{ url: buildOgImageUrl(), width: 1200, height: 630, alt: seoConfig.defaultTitle }],
  },
  twitter: {
    card: 'summary_large_image',
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    images: [buildOgImageUrl()],
  },
  alternates: { canonical: seoConfig.siteUrl },
  robots: robotsDirectives(),
}

type SiteSettings = {
  contact?: { email?: string; phone?: string; address?: string }
  social?: { facebook?: string; instagram?: string; tiktok?: string }
  seo?: { metaTitle?: string; metaDescription?: string; googleVerification?: string }
}

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  let siteSettings: SiteSettings = {}
  try {
    const payload = await getPayload({ config })
    siteSettings = await payload.findGlobal({ slug: 'site-settings' }) as SiteSettings
  } catch {}

  const { contact, social } = siteSettings

  return (
    <html lang="pl" className={`${inter.variable} ${playfair.variable}`}>
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
