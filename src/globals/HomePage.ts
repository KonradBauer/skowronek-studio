import type { GlobalConfig, Field } from 'payload'

function mediaField(label: string): Field {
  return {
    name: 'image',
    type: 'relationship',
    relationTo: 'media',
    label,
    admin: { appearance: 'drawer' },
  }
}

function mediaFieldMany(label: string, maxRows: number): Field {
  return {
    name: 'images',
    type: 'relationship',
    relationTo: 'media',
    hasMany: true,
    maxRows,
    label,
    admin: { appearance: 'drawer' },
  }
}

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Strona główna',
  access: {
    read: () => true,
    update: ({ req: { user } }) => user?.collection === 'users',
  },
  fields: [
    // ── Hero ──────────────────────────────────────
    {
      name: 'hero',
      type: 'group',
      label: 'Hero',
      fields: [
        mediaFieldMany('Zdjęcia hero (max 6)', 6),
        { name: 'title', type: 'text', defaultValue: 'Skowronek Studio', label: 'Tytuł' },
        { name: 'subtitle', type: 'text', defaultValue: 'Fotografia z pasją', label: 'Podtytuł' },
        { name: 'ctaText', type: 'text', defaultValue: 'Zobacz portfolio', label: 'Tekst CTA' },
        { name: 'ctaLink', type: 'text', defaultValue: '#portfolio', label: 'Link CTA' },
      ],
    },
    // ── O nas ─────────────────────────────────────
    {
      name: 'about',
      type: 'group',
      label: 'O nas',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'O nas', label: 'Tytuł' },
        { name: 'heading', type: 'text', defaultValue: 'Chwile, które zostają na zawsze', label: 'Nagłówek' },
        {
          name: 'paragraphs',
          type: 'array',
          label: 'Akapity tekstu',
          minRows: 1,
          fields: [
            { name: 'text', type: 'textarea', required: true, label: 'Tekst akapitu' },
          ],
        },
        mediaField('Zdjęcie'),
      ],
    },
    // ── Portfolio / Realizacje ────────────────────
    {
      name: 'portfolio',
      type: 'group',
      label: 'Portfolio',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Portfolio', label: 'Tytuł' },
        { name: 'subtitle', type: 'text', defaultValue: 'Nasze realizacje', label: 'Podtytuł' },
        mediaFieldMany('Zdjęcia realizacji', 12),
      ],
    },
    // ── Oferta ────────────────────────────────────
    {
      name: 'services',
      type: 'group',
      label: 'Oferta',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Oferta', label: 'Tytuł' },
        { name: 'subtitle', type: 'text', defaultValue: 'Co oferujemy', label: 'Podtytuł' },
      ],
    },
    // ── Voucher ───────────────────────────────────
    {
      name: 'voucher',
      type: 'group',
      label: 'Voucher',
      fields: [
        { name: 'label', type: 'text', defaultValue: 'Bon podarunkowy', label: 'Label nad tytułem' },
        { name: 'title', type: 'text', defaultValue: 'Podaruj wyjątkowe chwile', label: 'Tytuł' },
        { name: 'description', type: 'textarea', defaultValue: 'Szukasz idealnego prezentu? Voucher na sesję fotograficzną to piękny i osobisty upominek na każdą okazję - urodziny, rocznice, Dzień Matki czy święta.', label: 'Opis' },
        { name: 'ctaText', type: 'text', defaultValue: 'Zamów voucher', label: 'Tekst CTA' },
        { name: 'ctaLink', type: 'text', defaultValue: '#contact', label: 'Link CTA' },
        mediaField('Zdjęcie tła'),
      ],
    },
    // ── Kontakt ───────────────────────────────────
    {
      name: 'contact',
      type: 'group',
      label: 'Kontakt',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Kontakt', label: 'Tytuł' },
        { name: 'heading', type: 'text', defaultValue: 'Porozmawiajmy', label: 'Nagłówek' },
        { name: 'subtitle', type: 'text', defaultValue: 'Chętnie porozmawiamy o Twoich planach. Napisz do nas lub zadzwoń - razem stworzymy coś wyjątkowego.', label: 'Podtytuł' },
      ],
    },
  ],
}