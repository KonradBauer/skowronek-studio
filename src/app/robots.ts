import type { MetadataRoute } from 'next'
import { seoConfig } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/dashboard/'],
      },
    ],
    sitemap: `${seoConfig.siteUrl}/sitemap.xml`,
  }
}
