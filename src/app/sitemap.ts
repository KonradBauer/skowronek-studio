import type { MetadataRoute } from 'next'
import { seoConfig } from '@/lib/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: seoConfig.siteUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${seoConfig.siteUrl}/polityka-prywatnosci`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.1,
    },
  ]
}
