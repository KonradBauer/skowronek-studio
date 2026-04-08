# Skowronek Studio — CLAUDE.md

## Projekt

Strona fotografa + panel klienta (Next.js 15 + Payload CMS 3 + PostgreSQL + S3/R2).
Klienci logują się, przeglądają zdjęcia/filmy, pobierają pliki. Konta wygasają automatycznie.

## Komendy

```bash
pnpm dev          # serwer dev
pnpm build        # build produkcyjny (4GB heap)
pnpm lint         # ESLint
pnpm generate:types  # typy Payload
```

## Konwencje

- Język UI: polski
- DRY + KISS — nie duplikuj logiki, upraszczaj gdzie się da
- `overrideAccess: true` — wymagane w hookach i operacjach bez kontekstu usera (cron, beforeDelete)
- `saveToJWT: true` — pola potrzebne w middleware (np. `expiresAt`)
- Pliki klientów: chunked upload, 2 ścieżki assembly (<=1.5GB buffer, >1.5GB stream)
- Video: natywny `<video>`, range requests streaming
- Obrazy: `next/image` w froncie, natywny `<img>` w admin

---

---

## Struktura projektu

```
src/
├── app/
│   ├── (client)/        # Panel klienta (login, dashboard)
│   ├── (frontend)/      # Strona publiczna
│   ├── (payload)/       # Payload CMS admin + API routes
│   └── api/
│       ├── client/      # API klienta (download, preview, files, download-zip)
│       ├── clients/     # Auth (login, logout, send-credentials)
│       ├── cron/        # Cleanup wygasłych kont
│       ├── upload/      # Chunked upload (init, chunk, complete, cleanup)
│       ├── contact-submissions/
│       └── reviews/
├── collections/         # 8 kolekcji Payload
│   │                    # Clients, ClientFiles, ContactSubmissions, GalleryImages,
│   │                    # Media, Services, Users, ZipCache
├── globals/             # 3 globale (HomePage, SiteSettings, EmailTemplates)
├── components/          # admin, client, sections, layout, ui, seo, animations
├── lib/                 # auth, cleanup, email, s3, format, constants,
│                        # file-utils, zip-generator, google-reviews
├── hooks/               # useScrollSpy
├── stores/              # navigationStore (Zustand)
└── styles/              # globals.css (Tailwind v4 theme)
```

## Mailing — Resend SDK

**Provider:** [Resend](https://resend.com) (SDK, nie SMTP)
**Plik:** `src/lib/email.ts` — `sendEmail()`, `isEmailConfigured()`, `escapeHtml()`
**Używany w:** `src/app/api/clients/send-credentials/route.ts` (button "Wyślij dostęp" w admin panelu)

### Wymagane env vars

```env
RESEND_API_KEY=re_xxxxxxxxxxxx   # API key z panelu resend.com
RESEND_FROM_EMAIL=studio@skowronekstudio.pl
```

### ⏳ DO ZROBIENIA — gdy domena będzie gotowa

1. Założyć konto na resend.com
2. Dodać domenę `skowronekstudio.pl` → zweryfikować przez DNS (TXT record)
3. Wygenerować API key w panelu Resend
4. Ustawić env vars powyżej na VPS

Do tego czasu mailing jest wyłączony (`isEmailConfigured()` zwraca `false`).

---

## Kluczowe flow

### Logowanie klienta
1. POST `/api/clients/login` → sprawdza email w DB (expired?) → `payload.login()` → cookie
2. Middleware dekoduje JWT, sprawdza `expiresAt` → redirect jeśli wygasłe
3. Dashboard → `payload.auth()` → dane klienta

### Wygasanie kont
- Login: wygasłe ≤3 dni → "konto wygasło", >3 dni → generyczny błąd
- Cron (3:00 AM): kasuje konta wygasłe >3 dni + ich pliki (cascade delete)
- `beforeDelete` hook kasuje `client-files` → `afterDelete` czyści fizyczne pliki

### Upload plików
- `init` → UUID + tmp dir → `chunk` (10MB) → `complete` (assembly) → cleanup tmp
- >1.5GB: stream bezpośrednio do dysku (bypass Payload buffer)
- Orphaned chunks czyszczone po 1h (cron + init)
