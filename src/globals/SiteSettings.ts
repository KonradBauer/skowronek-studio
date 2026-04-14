import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Ustawienia strony',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      defaultValue: 'Skowronek Studio',
      label: 'Nazwa studia',
    },
    {
      name: 'tagline',
      type: 'text',
      defaultValue: 'Fotografia z pasją',
      label: 'Tagline',
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Dane kontaktowe',
      fields: [
        { name: 'email', type: 'email', label: 'Email' },
        { name: 'phone', type: 'text', label: 'Telefon' },
        { name: 'address', type: 'textarea', label: 'Adres' },
      ],
    },
    {
      name: 'social',
      type: 'group',
      label: 'Social media',
      fields: [
        { name: 'facebook', type: 'text', label: 'Facebook URL' },
        { name: 'instagram', type: 'text', label: 'Instagram URL' },
        { name: 'tiktok', type: 'text', label: 'TikTok URL' },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        { name: 'metaTitle', type: 'text', label: 'Meta tytuł' },
        { name: 'metaDescription', type: 'textarea', label: 'Meta opis' },
        { name: 'googleVerification', type: 'text', label: 'Google Search Console — token weryfikacyjny' },
      ],
    },
  ],
}
