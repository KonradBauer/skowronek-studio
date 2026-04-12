# Skowronek Studio — CLAUDE.md

## Projekt

Strona fotografa + panel klienta. Klienci loguja sie, przegladaja zdjecia/filmy, pobieraja pliki. Konta wygasaja automatycznie.

## Stack

- **Next.js** 15.4.11 + **Payload CMS** 3.82.0 + **SQLite** + S3/R2
- **Runtime:** Node.js 22 LTS, pnpm 10.28.2
- **Deploy:** PM2 na VPS (157.173.96.140:1000), bez Dockera

> **WAZNE:** Wszystkie pakiety `@payloadcms/*` i `payload` MUSZA miec ta sama wersje (np. `3.82.0`).
> Mismatch powoduje ze admin panel dziala lokalnie (`next dev`) ale crashuje na VPS (`next build`).
> Next.js musi byc w zakresie peer dependency Payload — sprawdzic przy aktualizacji.

## Komendy

```bash
pnpm dev             # serwer dev
pnpm build           # build produkcyjny (4GB heap)
pnpm start           # start produkcyjny (po buildzie)
pnpm lint            # ESLint
pnpm generate:types  # typy Payload
```

## Deploy na VPS — przetestowana instrukcja (Ubuntu 22.04, Contabo)

Dokladne komendy ktore zadzialy 2026-04-12. Kopiuj-wklej po kolei.

### 1. System
```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git
corepack enable
corepack prepare pnpm@10.28.2 --activate
npm install -g pm2
```

### 2. Klonowanie repo
```bash
cd /var/www
git clone https://github.com/TWOJ_USER/TWOJE_REPO.git skowronek-studio
cd skowronek-studio
mkdir -p logs
```
> UWAGA: `git clone URL skowronek-studio` — nazwa folderu na koncu, NIE kropka.
> Jesli folder juz istnieje i jest niepusty — usun go najpierw (`rm -rf /var/www/skowronek-studio`).

### 3. Env
```bash
nano .env
```
Wklejic (zmienic wartosci):
```env
PAYLOAD_SECRET=losowy-string-min-32-znaki
DATABASE_URI=file:./payload.db
NEXT_PUBLIC_SERVER_URL=http://IP_SERWERA:1000
CRON_SECRET=losowy-string-do-crona
```
Zapisac: Ctrl+O, Enter, Ctrl+X.

### 4. Install + Build
```bash
pnpm install
NODE_OPTIONS='--max-old-space-size=4096' pnpm build
```

### 5. Inicjalizacja bazy SQLite (jednorazowo po pierwszym buildzie)
Payload SQLite `push: true` tworzy tabele TYLKO w dev mode, nie w production.
Po buildzie trzeba krotko uruchomic dev zeby stworzyc tabele:
```bash
NODE_ENV=development npx next dev -p 1000 &
```
Poczekac az pojawi sie "Ready in Xs", potem:
```bash
curl http://localhost:1000/api/users
```
Powinno zwrocic JSON (np. `{"errors":[...]}`). To znaczy ze tabele zostaly utworzone.
```bash
kill %1
```
WAZNE — `next dev` nadpisuje folder `.next`. Trzeba przebudowac:
```bash
NODE_OPTIONS='--max-old-space-size=4096' pnpm build
```

### 6. Start PM2
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```
Sprawdzenie: `pm2 logs skowronek-studio --lines 20`

### 7. Cron — cleanup wygaslych kont (3:00 AM)
```bash
crontab -e
```
Dodac linie (zamienic secret na ten z .env):
```
0 3 * * * curl -s -X POST http://localhost:1000/api/cron/cleanup -H "Authorization: Bearer TWOJ_CRON_SECRET"
```
Test reczny:
```bash
curl -X POST http://localhost:1000/api/cron/cleanup -H "Authorization: Bearer TWOJ_CRON_SECRET"
```
Powinno zwrocic: `{"success":true,...}`

### Weryfikacja
- Strona: http://IP_SERWERA:1000
- Admin panel: http://IP_SERWERA:1000/admin (przy pierwszym wejsciu — formularz tworzenia admina)
- Logi: `pm2 logs skowronek-studio`
- Status: `pm2 status`

## Konwencje

- Jezyk UI: polski
- DRY + KISS
- `overrideAccess: true` — wymagane w hookach i operacjach bez kontekstu usera (cron, beforeDelete)
- `saveToJWT: true` — pola potrzebne w middleware (np. `expiresAt`)
- Chunked upload: 2 sciezki assembly (<=1.5GB buffer, >1.5GB stream)
- Video: natywny `<video>`, range requests streaming
- Obrazy: `next/image` w froncie, natywny `<img>` w admin

## Struktura projektu

```
src/
  app/
    (client)/           Panel klienta (login, dashboard)
    (frontend)/         Strona publiczna
    (payload)/          Payload CMS admin + API routes
    api/
      client/           API klienta (download, preview, files, download-zip)
      clients/          Auth (login, logout, send-credentials)
      cron/             Cleanup wygaslych kont
      upload/           Chunked upload (init, chunk, complete, cleanup)
      contact-submissions/
      reviews/
  collections/          8 kolekcji Payload (Clients, ClientFiles, ContactSubmissions,
                        GalleryImages, Media, Services, Users, ZipCache)
  globals/              HomePage, SiteSettings, EmailTemplates
  components/           admin, client, sections, layout, ui, seo, animations
  lib/                  auth, cleanup, email, s3, format, constants,
                        file-utils, zip-generator, google-reviews
  hooks/                useScrollSpy
  stores/               navigationStore (Zustand)
  styles/               globals.css (Tailwind v4 theme)
```

## Env vars

```env
# Wymagane
PAYLOAD_SECRET=             # min 32 znaki
DATABASE_URI=file:./payload.db

# Frontend
NEXT_PUBLIC_SERVER_URL=http://157.173.96.140:1000

# Cron
CRON_SECRET=                # autoryzacja endpointu cleanup

# Mailing (opcjonalne — bez nich mailing wylaczony)
RESEND_API_KEY=             # z panelu resend.com
RESEND_FROM_EMAIL=studio@skowronekstudio.pl

# S3/R2 (opcjonalne — bez S3_BUCKET pliki lokalne)
S3_BUCKET=
S3_ENDPOINT=
S3_REGION=auto
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Google Reviews (opcjonalne — bez klucza uzywa fallback)
GOOGLE_PLACES_API_KEY=
```

## Kluczowe flow

### Logowanie klienta
1. POST `/api/clients/login` — sprawdza email, expired?, `payload.login()`, cookie
2. Middleware dekoduje JWT, sprawdza `expiresAt` — redirect jesli wygasle
3. Dashboard — `payload.auth()` — dane klienta

### Wygasanie kont
- Login: wygasle <=3 dni — "konto wygaslo", >3 dni — generyczny blad
- Cron (3:00 AM): kasuje konta wygasle >3 dni + ich pliki (cascade delete)
- `beforeDelete` hook kasuje `client-files`, `afterDelete` czysci fizyczne pliki

### Upload plikow
- `init` — UUID + tmp dir, `chunk` (10MB), `complete` (assembly), cleanup tmp
- >1.5GB: stream bezposrednio do dysku (bypass Payload buffer)
- Orphaned chunks czyszczone po 1h (cron + init)
