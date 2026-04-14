import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skowronekstudio.pl'

export const seoConfig = {
  siteName: 'Skowronek Studio',
  siteUrl: SITE_URL,
  defaultTitle: 'Skowronek Studio - Fotografia ślubna, portretowa i rodzinna',
  titleTemplate: '%s | Skowronek Studio',
  defaultDescription:
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
    'fotograf wesele',
  ],
} as const

export function buildCanonicalUrl(path = '') {
  return `${SITE_URL}${path}`
}

export function buildOgImageUrl(title?: string) {
  const base = `${SITE_URL}/api/og`
  return title ? `${base}?title=${encodeURIComponent(title)}` : base
}

export function robotsDirectives(noindex = false) {
  return {
    index: !noindex,
    follow: !noindex,
    googleBot: {
      index: !noindex,
      follow: !noindex,
      'max-snippet': -1 as const,
      'max-image-preview': 'large' as const,
      'max-video-preview': -1 as const,
    },
  }
}

export function buildMetadata({
  title,
  description,
  canonical,
  ogImage,
  noindex = false,
}: {
  title?: string
  description?: string
  canonical?: string
  ogImage?: string
  noindex?: boolean
} = {}): Partial<Metadata> {
  const resolvedTitle = title ?? seoConfig.defaultTitle
  const resolvedDescription = description ?? seoConfig.defaultDescription
  const resolvedImage = ogImage ?? buildOgImageUrl()
  const resolvedCanonical = canonical ?? SITE_URL

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    alternates: { canonical: resolvedCanonical },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: resolvedCanonical,
      siteName: seoConfig.siteName,
      locale: 'pl_PL',
      type: 'website',
      images: [{ url: resolvedImage, width: 1200, height: 630, alt: resolvedTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: resolvedDescription,
      images: [resolvedImage],
    },
    robots: robotsDirectives(noindex),
  }
}
