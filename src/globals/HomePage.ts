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
        mediaFieldMany('Zdjecia hero (max 6)', 6),
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
        mediaField('Zdjecie'),
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
        mediaFieldMany('Zdjecia realizacji', 12),
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
        mediaField('Zdjecie tla'),
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
