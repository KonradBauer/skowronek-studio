export const dynamic = 'force-dynamic'

import { getPayload } from 'payload'
import config from '@payload-config'
import { HeroSection } from '@/components/sections/HeroSection'
import { AboutSection } from '@/components/sections/AboutSection'
import { PortfolioSection } from '@/components/sections/PortfolioSection'
import { ServicesSection } from '@/components/sections/ServicesSection'
import { VoucherSection } from '@/components/sections/VoucherSection'
import { ReviewsSection } from '@/components/sections/ReviewsSection'
import { ContactSection } from '@/components/sections/ContactSection'

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

export default async function HomePage() {
  const payload = await getPayload({ config })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let homePage: any = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let siteSettings: any = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let servicesData: { docs: any[] } = { docs: [] }

  try {
    const results = await Promise.all([
      payload.findGlobal({ slug: 'home-page', depth: 2 }),
      payload.findGlobal({ slug: 'site-settings' }),
      payload.find({ collection: 'services', sort: 'order', limit: 20 }),
    ])
    homePage = results[0]
    siteSettings = results[1]
    servicesData = results[2]
  } catch {
    // Fallback to defaults when DB schema is not yet migrated
  }

  // Hero data
  const heroImages = (homePage.hero?.images || [])
    .map((item: { image?: unknown }) => getImageUrl(item.image))
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paragraphs: (homePage.about?.paragraphs || []).map((p: any) => p.text as string),
    imageUrl: getImageUrl(homePage.about?.image),
  }

  // Portfolio data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const portfolioItems = (homePage.portfolio?.images || []).map((item: any, i: number) => ({
    id: i + 1,
    title: item.title || '',
    category: item.category || '',
    image: getImageSize(item.image, 'card') || `/images/portfolio-${i + 1}.jpg`,
  }))
  const portfolioData = {
    title: homePage.portfolio?.title || 'Portfolio',
    subtitle: homePage.portfolio?.subtitle || 'Nasze realizacje',
    items: portfolioItems,
  }

  // Services data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const servicesItems = servicesData.docs.map((service: any) => ({
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
