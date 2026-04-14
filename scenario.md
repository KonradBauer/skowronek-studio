# Scenariusz wideo prezentacyjnego — Foto Studio

## Cel
Krótkie (2–3 min) wideo showcasujące system do zarządzania studiem fotograficznym:
stronę publiczną, panel admina (CMS) oraz panel klienta. Docelowo: portfolio sprzedażowe
lub demo dla potencjalnych klientów systemu.

---

## Przygotowanie przed nagraniem

### Dane demo (wgrać zanim zaczniesz nagrywać)
- **Klient demo:** imię „Anna Kowalska", email `anna@example.com`, hasło `Demo1234!`
  - Wygasa za 30 dni
  - 6–8 zdjęć (różne orientacje), 1 krótki film MP4 (~30s)
- **Tekst na stronie** (CMS → HomePage):
  - Hero title: „Foto Studio"
  - Subtitle: „Profesjonalna fotografia"
  - CTA: „Zobacz portfolio"
- **Przeglądarka:** pełny ekran, ukryte zakładki, tryb incognito dla panelu klienta
- **Rozdzielczość:** 1920×1080, skala 100%
- **Narzędzia:** OBS lub Loom, mikrofon (jeśli nagrywasz głos)

---

## Scenariusz — ujęcie po ujęciu

### SCENA 1 — Strona publiczna (30–40 sek)

**Co pokazujesz:**
1. Otwórz `http://localhost:1000` — pełny ekran
2. Poczekaj na załadowanie hero (efekt Ken Burns + fade-in tytułu)
3. Powoli przewiń do sekcji Portfolio — zdjęcia w siatce
4. Przewiń do Oferty — karty usług
5. Przewiń do sekcji Kontakt

**Komentarz (opcjonalnie):**
> „Strona główna studia — pełni funkcję wizytówki. Treści zarządzane z panelu CMS."

---

### SCENA 2 — Panel admina: przegląd (20–30 sek)

**Co pokazujesz:**
1. Przejdź na `http://localhost:1000/admin`
2. Zaloguj się kontem administratora
3. Pokaż dashboard — lista kolekcji po lewej
4. Kliknij **Klienci** — lista klientów, widać status konta i datę wygaśnięcia
5. Kliknij **Pliki klientów** — lista plików z typem i rozmiarem

**Komentarz:**
> „Admin panel oparty o Payload CMS — pełna kontrola nad klientami i plikami."

---

### SCENA 3 — Tworzenie klienta + upload plików (50–60 sek)

**Co pokazujesz:**
1. W Klientach → **Dodaj nowego**
2. Wypełnij: imię, email, hasło (lub kliknij **Generuj hasło**)
3. Ustaw datę wygaśnięcia (np. +30 dni)
4. Zapisz
5. Wróć do listy klientów — nowy widoczny

6. Przejdź do **Pliki klientów** → **Dodaj nowy**
7. Wybierz klienta z listy
8. Kliknij **Bulk Upload** (przycisk w panelu admin)
9. Przeciągnij 3–4 zdjęcia — pokaż pasek postępu uploadu
10. Po zakończeniu — pliki widoczne na liście

11. Dodaj film: **Dodaj nowy plik** → wybierz MP4 → upload
12. Zapisz

**Komentarz:**
> „Chunked upload obsługuje pliki do kilku GB. Klient dostaje dostęp natychmiast po zapisaniu."

---

### SCENA 4 — Wysyłanie danych logowania (10–15 sek)

**Co pokazujesz:**
1. Wejdź w profil klienta
2. Kliknij przycisk **Wyślij dane logowania** (SendCredentialsButton)
3. Pokaż komunikat sukcesu

**Komentarz:**
> „Jeden klik — klient dostaje email z loginiem i linkiem do panelu."

---

### SCENA 5 — Panel klienta (40–50 sek)

**Co pokazujesz (tryb incognito, osobne okno):**
1. Otwórz `http://localhost:1000/login`
2. Wpisz dane klienta demo (anna@example.com / Demo1234!)
3. Zaloguj się — redirect do dashboard

4. Pokaż siatkę zdjęć z lazy loadingiem (skeleton → zdjęcia)
5. Kliknij jedno zdjęcie — powiększenie / podgląd
6. Kliknij **Pobierz** przy zdjęciu — pobieranie

7. Przewiń do sekcji wideo
8. Odtwórz film (streaming range requests — natychmiastowy start)
9. Kliknij **Pobierz wszystko (ZIP)** — pokaż że zip się tworzy

**Komentarz:**
> „Klient widzi tylko swoje pliki. Zdjęcia ładują się leniwie, wideo streamuje bez buforowania."

---

### SCENA 6 — Wygasanie kont (10–15 sek, opcjonalnie)

**Co pokazujesz:**
1. W adminie zmień datę wygaśnięcia klienta na wczoraj
2. Wróć do panelu klienta, odśwież
3. Pokaż komunikat „Twoje konto wygasło"

**Komentarz:**
> „Konta wygasają automatycznie. Cron o 3:00 czyści stare dane."

---

## Outro (10 sek)
Pokaż stronę główną z logo, zatrzymaj na hero.

---

## Wskazówki techniczne

| Kwestia | Rozwiązanie |
|---------|------------|
| Ukryj URL przeglądarki | Pełny ekran F11 lub ukryj pasek adresu |
| Szybki dev server | `pnpm dev` — hot reload, nie potrzeba buildu |
| Reset danych demo | Usuń klienta i dodaj go od nowa w adminie |
| Nagrywanie | OBS (scena: Display Capture) lub Loom (prostsza edycja) |
| Edycja | DaVinci Resolve Free — przytnij, dodaj plansze z napisami |
| Muzyka | pixabay.com/music → ambient/cinematic, bez praw autorskich |

---

## Kolejność edycji wideo

1. Przytnij niepotrzebne pauzy (Resolve: Blade tool)
2. Dodaj planszę intro: „System zarządzania studiem fotograficznym"
3. Tytuły sekcji jako overlay text (np. „Panel admina", „Panel klienta")
4. Muzyka w tle — -20 dB żeby nie zagłuszała głosu
5. Fade out na końcu
6. Eksport: H.264, 1080p, 8 Mbps
