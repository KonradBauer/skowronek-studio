export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { HeroSection } from '@/components/sections/HeroSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { PortfolioSection } from '@/components/sections/PortfolioSection'
import { ServicesSection } from '@/components/sections/ServicesSection'
import { VoucherSection } from '@/components/sections/VoucherSection'
import { ReviewsSection } from '@/components/sections/ReviewsSection'
import { ContactSection } from '@/components/sections/ContactSection'

type HomePageData = {
  hero?: { images?: unknown[]; title?: string; subtitle?: string; ctaText?: string; ctaLink?: string }
  about?: { title?: string; heading?: string; paragraphs?: { text?: string }[]; image?: unknown }
  portfolio?: { title?: string; subtitle?: string; images?: unknown[] }
  services?: { title?: string; subtitle?: string }
  voucher?: { label?: string; title?: string; description?: string; ctaText?: string; ctaLink?: string; image?: unknown }
  contact?: { title?: string; heading?: string; subtitle?: string }
}

type SiteSettingsData = {
  contact?: { email?: string; phone?: string; address?: string }
  social?: { facebook?: string; instagram?: string; tiktok?: string }
}

type ServiceDoc = { title: string; description: string; image?: unknown }

function getImageUrl(image: unknown): string {
  if (!image || typeof image === 'number') return ''
  if (typeof image === 'object' && image !== null && 'url' in image) {
    return (image as { url: string }).url || ''
  }
  return ''
}

function getImageSize(image: unknown, size: string): string {
  if (!image || typeof image === 'number') return ''
  if (typeof image === 'object' && image !== null && 'sizes' in image) {
    const sizes = (image as { sizes?: Record<string, { url?: string }> }).sizes
    return sizes?.[size]?.url || getImageUrl(image)
  }
  return getImageUrl(image)
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const payload = await getPayload({ config })
    const siteSettings = await payload.findGlobal({ slug: 'site-settings' }) as {
      siteName?: string
      tagline?: string
      seo?: { metaTitle?: string; metaDescription?: string }
    }
    const title = siteSettings.seo?.metaTitle || siteSettings.siteName
    const description = siteSettings.seo?.metaDescription || siteSettings.tagline
    return {
      ...(title && { title }),
      ...(description && { description }),
    }
  } catch {
    return {}
  }
}

export default async function HomePage() {
  const payload = await getPayload({ config })

  let homePage: HomePageData = {}
  let siteSettings: SiteSettingsData = {}
  let servicesData: { docs: ServiceDoc[] } = { docs: [] }

  try {
    const results = await Promise.all([
      payload.findGlobal({ slug: 'home-page', depth: 2 }),
      payload.findGlobal({ slug: 'site-settings' }),
      payload.find({ collection: 'services', sort: 'order', limit: 20 }),
    ])
    homePage = results[0]
    siteSettings = results[1]
    servicesData = results[2] as unknown as { docs: ServiceDoc[] }
  } catch {
    // Fallback to defaults when DB schema is not yet migrated
  }

  // Hero data — images is now a hasMany relationship (array of media objects or IDs)
  const heroImages = (homePage.hero?.images || [])
    .map((item: unknown) => getImageUrl(item))
    .filter(Boolean)
  const heroData = {
    images: heroImages.length > 0 ? heroImages : ['/images/hero-1.jpg', '/images/hero-2.jpg', '/images/hero-3.jpg', '/images/hero-4.jpg'],
    title: homePage.hero?.title || 'Skowronek Studio',
    subtitle: homePage.hero?.subtitle || 'Fotografia z pasja',
    ctaText: homePage.hero?.ctaText || 'Zobacz portfolio',
    ctaLink: homePage.hero?.ctaLink || '#portfolio',
  }

  // About data
  const aboutData = {
    title: homePage.about?.title || 'O nas',
    heading: homePage.about?.heading || 'Chwile, ktore zostaja na zawsze',
    paragraphs: (homePage.about?.paragraphs || []).map((p) => p.text as string),
    imageUrl: getImageUrl(homePage.about?.image),
  }

  // Portfolio data — images is now a hasMany relationship (flat array of media objects)
  const portfolioItems = (homePage.portfolio?.images || []).map((item: unknown, i: number) => ({
    id: i + 1,
    title: (item && typeof item === 'object' && 'alt' in item ? (item as { alt?: string }).alt : '') || '',
    category: '',
    image: getImageSize(item, 'card') || `/images/portfolio-${i + 1}.jpg`,
  }))
  const portfolioData = {
    title: homePage.portfolio?.title || 'Portfolio',
    subtitle: homePage.portfolio?.subtitle || 'Nasze realizacje',
    items: portfolioItems,
  }

  // Services data
  const servicesItems = servicesData.docs.map((service) => ({
    title: service.title as string,
    description: service.description as string,
    image: getImageSize(service.image, 'card'),
  }))
  const servicesGroupData = {
    title: homePage.services?.title || 'Oferta',
    subtitle: homePage.services?.subtitle || 'Co oferujemy',
    items: servicesItems,
  }

  // Voucher data
  const voucherData = {
    label: homePage.voucher?.label || 'Bon podarunkowy',
    title: homePage.voucher?.title || 'Podaruj wyjatkowe chwile',
    description: homePage.voucher?.description || '',
    ctaText: homePage.voucher?.ctaText || 'Zamow voucher',
    ctaLink: homePage.voucher?.ctaLink || '#contact',
    imageUrl: getImageUrl(homePage.voucher?.image),
  }

  // Contact data
  const contactData = {
    title: homePage.contact?.title || 'Kontakt',
    heading: homePage.contact?.heading || 'Porozmawiajmy',
    subtitle: homePage.contact?.subtitle || '',
    email: siteSettings.contact?.email || '',
    phone: siteSettings.contact?.phone || '',
    address: siteSettings.contact?.address || '',
    facebook: siteSettings.social?.facebook || '',
    instagram: siteSettings.social?.instagram || '',
    tiktok: siteSettings.social?.tiktok || '',
  }

  return (
    <>
      <HeroSection data={heroData} />
      <AboutSection data={aboutData} />
      <PortfolioSection data={portfolioData} />
      <ServicesSection data={servicesGroupData} />
      <VoucherSection data={voucherData} />
      <ReviewsSection />
      <ContactSection data={contactData} />
    </>
  )
}
