import type { GlobalConfig } from 'payload'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Strona główna',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      label: 'Hero',
      fields: [
        {
          name: 'images',
          type: 'array',
          label: 'Zdjęcia hero',
          minRows: 1,
          maxRows: 6,
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'gallery-images',
              required: true,
            },
          ],
        },
        { name: 'title', type: 'text', defaultValue: 'Skowronek Studio', label: 'Tytuł' },
        { name: 'subtitle', type: 'text', defaultValue: 'Fotografia z pasją', label: 'Podtytuł' },
        { name: 'ctaText', type: 'text', defaultValue: 'Zobacz portfolio', label: 'Tekst CTA' },
        { name: 'ctaLink', type: 'text', defaultValue: '#portfolio', label: 'Link CTA' },
      ],
    },
    {
      name: 'about',
      type: 'group',
      label: 'O nas',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'O nas', label: 'Tytuł' },
        { name: 'text', type: 'textarea', label: 'Tekst' },
        { name: 'image', type: 'upload', relationTo: 'gallery-images', label: 'Zdjęcie' },
      ],
    },
    {
      name: 'portfolio',
      type: 'group',
      label: 'Portfolio',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Portfolio', label: 'Tytuł' },
        { name: 'subtitle', type: 'text', label: 'Podtytuł' },
      ],
    },
    {
      name: 'services',
      type: 'group',
      label: 'Oferta',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Oferta', label: 'Tytuł' },
        { name: 'subtitle', type: 'text', label: 'Podtytuł' },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      label: 'Kontakt',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Kontakt', label: 'Tytuł' },
        { name: 'subtitle', type: 'text', label: 'Podtytuł' },
      ],
    },
  ],
}
