import { generateLocalBusinessSchema, generateWebsiteSchema } from '@/lib/schema'

interface JsonLdProps {
  contact?: { email?: string; phone?: string; address?: string }
  social?: { facebook?: string; instagram?: string; tiktok?: string }
}

// JSON-LD structured data — values from admin panel, serialized by
// JSON.stringify which cannot produce XSS payloads (no HTML tags in JSON).
export function JsonLd({ contact, social }: JsonLdProps) {
  const localBusiness = generateLocalBusinessSchema(contact, social)
  const website = generateWebsiteSchema()

  return (
    <>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
    </>
  )
}
