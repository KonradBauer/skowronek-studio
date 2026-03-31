const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skowronekstudio.pl'

interface JsonLdProps {
  contact?: { email?: string; phone?: string; address?: string }
  social?: { facebook?: string; instagram?: string; tiktok?: string }
}

// JSON-LD structured data — values come from admin panel (trusted) and are
// safely encoded by JSON.stringify, so dangerouslySetInnerHTML is safe here.
export function JsonLd({ contact, social }: JsonLdProps) {
  const sameAs = [social?.facebook, social?.instagram, social?.tiktok].filter(Boolean)

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'PhotographyBusiness',
    name: 'Skowronek Studio',
    description:
      'Profesjonalne studio fotograficzne specjalizujace sie w fotografii slubnej, portretowej i rodzinnej.',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    image: `${SITE_URL}/og-image.jpg`,
    ...(contact?.phone && { telephone: contact.phone.replace(/\s/g, '') }),
    ...(contact?.email && { email: contact.email }),
    ...(contact?.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: contact.address,
        addressLocality: 'Czestochowa',
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
    priceRange: '$$',
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
      name: 'Uslugi fotograficzne',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Fotografia slubna',
            description: 'Kompleksowa obsluga fotograficzna slubu i wesela.',
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
            description: 'Sesje rodzinne pelne naturalnych emocji.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Film slubny',
            description: 'Filmowanie slubne w jakosci kinowej.',
          },
        },
      ],
    },
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Skowronek Studio',
    url: SITE_URL,
    description:
      'Profesjonalne studio fotograficzne - fotografia slubna, portretowa i rodzinna.',
    publisher: {
      '@type': 'Organization',
      name: 'Skowronek Studio',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo.png`,
      },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  )
}
