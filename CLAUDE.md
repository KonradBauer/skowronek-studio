# Skowronek Studio — CLAUDE.md

## Projekt

Strona fotografa + panel klienta (Next.js 15 + Payload CMS 3 + PostgreSQL + S3/R2).
Klienci logują się, przeglądają zdjęcia/filmy, pobierają pliki. Konta wygasają automatycznie.

## Komendy

```bash
pnpm dev          # serwer dev
pnpm build        # build produkcyjny (4GB heap)
pnpm lint         # ESLint
pnpm generate:types  # typy Payload (powinno być w pipeline build)
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

## Audyt kodu — status napraw

### KRYTYCZNE — Bugi i bezpieczeństwo

#### 1. ~~Brak `overrideAccess` w `zip-generator.ts`~~ ✅ NAPRAWIONE
Dodano `overrideAccess: true` do wszystkich 8 operacji payload w `src/lib/zip-generator.ts`.

#### 2. ~~Brak walidacji `uploadId` w chunk route~~ ✅ NAPRAWIONE
Dodano walidację UUID w `src/app/api/upload/chunk/route.ts`.

#### 3. ~~Brak walidacji `totalSize`/`totalChunks` w upload~~ ✅ NAPRAWIONE
Dodano walidację w `complete/route.ts` i `init/route.ts`.

#### 4. ~~Grace period desynchronizacja~~ ✅ NAPRAWIONE
Stała `EXPIRED_GRACE_DAYS` w `src/lib/constants.ts`, importowana we wszystkich 3 plikach.

---

### DRY — Zduplikowana logika

#### 5. ~~`formatFileSize()` — 6 kopii~~ ✅ NAPRAWIONE
Wyekstrahowano do `src/lib/format.ts`, zastąpiono w 6 komponentach.

#### 6. ~~`imageSizes` — zduplikowane w 2 kolekcjach~~ ✅ NAPRAWIONE
Stała `IMAGE_SIZES` w `src/lib/constants.ts`, importowana w `GalleryImages.ts` i `Media.ts`.

#### 7. ~~Ikony social media — 3 kopie SVG~~ ✅ NAPRAWIONE
Stworzono `src/components/layout/SocialLinks.tsx`, zastąpiono w Footer, MobileMenu i ContactSection.

#### 8. ~~S3 client initialization — 6+ kopii~~ ✅ NAPRAWIONE
Wyekstrahowano do `src/lib/s3.ts` → `getS3Client()` (singleton).

#### 9. ~~Client ownership verification — 4+ kopii~~ ✅ NAPRAWIONE
Wyekstrahowano `verifyFileOwnership()` do `src/lib/file-utils.ts`.

#### 10. ~~Range request parsing — 2 kopie~~ ✅ NAPRAWIONE
Wyekstrahowano `parseRangeHeader()` do `src/lib/file-utils.ts`.

#### 11. ~~Kategorie photo/video — duplikacja opcji~~ ✅ NAPRAWIONE
Stała `FILE_CATEGORIES` w `src/lib/constants.ts`, importowana w `ClientFiles.ts` i `ZipCache.ts`.

---

### KISS — Uproszczenia

#### 12. `any` types w zip-generator.ts
**Plik:** `src/lib/zip-generator.ts`
**Problem:** 5x `any` cast — utrata type safety.
**Fix:** Zdefiniować interfejs `ClientFile` i użyć zamiast `any`.

#### 13. `as unknown as` double cast w auth.ts
**Plik:** `src/lib/auth.ts`
**Problem:** Anti-pattern `as unknown as` powtórzony 3x z tą samą strukturą.
**Fix:** Zdefiniować `PayloadUser` type i użyć w jednym miejscu.

#### 14. `any` w dashboard page.tsx i page.tsx (frontend)
**Pliki:** `src/app/(client)/dashboard/page.tsx`, `src/app/(frontend)/page.tsx`
**Problem:** `eslint-disable` + `any` dla Payload docs.
**Fix:** Użyć typów z `payload-types.ts` (generowane przez `pnpm generate:types`).

#### 15. ~~Stałe hardcoded w wielu plikach~~ ✅ NAPRAWIONE
Stworzono `src/lib/constants.ts` ze wszystkimi współdzielonymi stałymi.

---

### Jakość kodu — pomniejsze

#### 16. ~~Nieużywana zależność `graphql`~~ ❌ NIE DOTYCZY
`graphql` jest `peerDependency` Payload CMS — musi pozostać.

#### 17. Nieużywany env var `NEXT_PUBLIC_SERVER_URL`
**Plik:** `.env.local`
**Problem:** Zdefiniowany ale nieużywany w kodzie. Kod używa `NEXT_PUBLIC_SITE_URL`.
**Fix:** Usunąć z `.env.local`.

#### 18. Brak `generate:types` w pipeline build
**Plik:** `package.json` — script `build`
**Problem:** Typy Payload mogą być niezsynchronizowane z schematem.
**Fix:** Zmienić build na `"pnpm generate:types && NODE_OPTIONS='--max-old-space-size=4096' next build"`.

#### 19. ~~Silent error swallowing w hookach~~ ✅ NAPRAWIONE
Zamieniono `.catch(() => {})` na `.catch(console.error)` w `ClientFiles.ts` i `cleanup.ts`.

#### 20. ~~ReviewsSection — niestabilny `key` w mapie~~ ✅ NAPRAWIONE
Zmieniono `key={idx-${current}}` na stabilne `key={idx}` w `ReviewsSection.tsx`.

#### 21. ~~PhotoGrid — brak error handling w preload~~ ✅ NAPRAWIONE
Dodano 10s timeout w `preloadThumbnails` — grid wyświetli się nawet jeśli obrazki nie załadują się w czasie.

#### 22. ~~ContactSection — status 'sent' zostaje na zawsze~~ ✅ NAPRAWIONE
Dodano `setTimeout(() => setStatus('idle'), 5000)` po wysłaniu formularza.

---

## Struktura projektu

```
src/
├── app/
│   ├── (client)/        # Panel klienta (login, dashboard)
│   ├── (frontend)/      # Strona publiczna
│   └── api/
│       ├── client/      # API klienta (download, preview, files, download-zip)
│       ├── clients/     # Auth (login, logout, send-credentials)
│       ├── cron/        # Cleanup wygasłych kont
│       ├── upload/      # Chunked upload (init, chunk, complete, cleanup)
│       ├── contact-submissions/
│       └── reviews/
├── collections/         # 8 kolekcji Payload
├── globals/             # 3 globale (HomePage, SiteSettings, EmailTemplates)
├── components/          # admin, client, sections, layout, ui, seo, animations
├── lib/                 # auth, cleanup, email, s3(?), format(?), constants(?)
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
