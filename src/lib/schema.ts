import { seoConfig } from './seo'

interface ContactInfo {
  email?: string
  phone?: string
  address?: string
}

interface SocialInfo {
  facebook?: string
  instagram?: string
  tiktok?: string
}

export function generateLocalBusinessSchema(contact?: ContactInfo, social?: SocialInfo) {
  const sameAs = [social?.facebook, social?.instagram, social?.tiktok].filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'PhotographyBusiness',
    name: seoConfig.siteName,
    description: seoConfig.defaultDescription,
    url: seoConfig.siteUrl,
    logo: `${seoConfig.siteUrl}/logo.png`,
    image: `${seoConfig.siteUrl}/api/og`,
    priceRange: '$$',
    ...(contact?.phone && { telephone: contact.phone.replace(/\s/g, '') }),
    ...(contact?.email && { email: contact.email }),
    ...(contact?.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: contact.address,
        addressLocality: 'Częstochowa',
        postalCode: '42-200',
        addressCountry: 'PL',
      },
    }),
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 50.826258,
      longitude: 19.095474,
    },
    ...(sameAs.length > 0 && { sameAs }),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '16:00',
      },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Usługi fotograficzne',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Fotografia ślubna',
            description: 'Kompleksowa obsługa fotograficzna ślubu i wesela.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Fotografia portretowa',
            description: 'Profesjonalne sesje portretowe w studio i plenerze.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Fotografia rodzinna',
            description: 'Sesje rodzinne pełne naturalnych emocji.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Film ślubny',
            description: 'Filmowanie ślubne w jakości kinowej.',
          },
        },
      ],
    },
  }
}

export function generateWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: seoConfig.siteName,
    url: seoConfig.siteUrl,
    description: seoConfig.defaultDescription,
    publisher: {
      '@type': 'Organization',
      name: seoConfig.siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${seoConfig.siteUrl}/logo.png`,
      },
    },
  }
}
