import type { GlobalConfig } from 'payload'

export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Strona glowna',
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
        {
          name: 'images',
          type: 'array',
          label: 'Zdjecia hero',
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
        { name: 'title', type: 'text', defaultValue: 'Skowronek Studio', label: 'Tytul' },
        { name: 'subtitle', type: 'text', defaultValue: 'Fotografia z pasja', label: 'Podtytul' },
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
        { name: 'title', type: 'text', defaultValue: 'O nas', label: 'Tytul' },
        { name: 'heading', type: 'text', defaultValue: 'Chwile, ktore zostaja na zawsze', label: 'Naglowek' },
        {
          name: 'paragraphs',
          type: 'array',
          label: 'Akapity tekstu',
          minRows: 1,
          fields: [
            { name: 'text', type: 'textarea', required: true, label: 'Tekst akapitu' },
          ],
        },
        { name: 'image', type: 'upload', relationTo: 'gallery-images', label: 'Zdjecie' },
      ],
    },
    // ── Portfolio / Realizacje ────────────────────
    {
      name: 'portfolio',
      type: 'group',
      label: 'Portfolio',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Portfolio', label: 'Tytul' },
        { name: 'subtitle', type: 'text', defaultValue: 'Nasze realizacje', label: 'Podtytul' },
        {
          name: 'images',
          type: 'array',
          label: 'Zdjecia realizacji',
          maxRows: 12,
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'gallery-images',
              required: true,
            },
            { name: 'title', type: 'text', label: 'Tytul zdjecia' },
            { name: 'category', type: 'text', label: 'Kategoria (np. Wesela, Portrety)' },
          ],
        },
      ],
    },
    // ── Oferta ────────────────────────────────────
    {
      name: 'services',
      type: 'group',
      label: 'Oferta',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Oferta', label: 'Tytul' },
        { name: 'subtitle', type: 'text', defaultValue: 'Co oferujemy', label: 'Podtytul' },
      ],
    },
    // ── Voucher ───────────────────────────────────
    {
      name: 'voucher',
      type: 'group',
      label: 'Voucher',
      fields: [
        { name: 'label', type: 'text', defaultValue: 'Bon podarunkowy', label: 'Label nad tytulem' },
        { name: 'title', type: 'text', defaultValue: 'Podaruj wyjatkowe chwile', label: 'Tytul' },
        { name: 'description', type: 'textarea', defaultValue: 'Szukasz idealnego prezentu? Voucher na sesje fotograficzna to piekny i osobisty upominek na kazda okazje - urodziny, rocznice, Dzien Matki czy swieta.', label: 'Opis' },
        { name: 'ctaText', type: 'text', defaultValue: 'Zamow voucher', label: 'Tekst CTA' },
        { name: 'ctaLink', type: 'text', defaultValue: '#contact', label: 'Link CTA' },
        { name: 'image', type: 'upload', relationTo: 'gallery-images', label: 'Zdjecie tla' },
      ],
    },
    // ── Kontakt ───────────────────────────────────
    {
      name: 'contact',
      type: 'group',
      label: 'Kontakt',
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Kontakt', label: 'Tytul' },
        { name: 'heading', type: 'text', defaultValue: 'Porozmawiajmy', label: 'Naglowek' },
        { name: 'subtitle', type: 'text', defaultValue: 'Chetnie porozmawiamy o Twoich planach. Napisz do nas lub zadzwon - razem stworzymy cos wyjatkowego.', label: 'Podtytul' },
      ],
    },
  ],
}
