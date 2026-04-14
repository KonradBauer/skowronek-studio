import type { Metadata } from 'next'
import { buildMetadata } from '@/lib/seo'
import { Container } from '@/components/ui/Container'

export const metadata: Metadata = {
  ...buildMetadata({
    title: 'Polityka prywatności',
    description: 'Informacje o przetwarzaniu danych osobowych przez Skowronek Studio.',
    noindex: true,
  }),
}

export default function PolitykaPrywatnosci() {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-2 text-3xl font-light tracking-wide text-dark">
            Polityka prywatności
          </h1>
          <p className="mb-12 text-sm text-body-muted">Ostatnia aktualizacja: kwiecień 2026</p>

          <div className="space-y-10 text-body leading-relaxed">

            <section>
              <h2 className="mb-3 text-lg font-medium uppercase tracking-[0.1em] text-dark">
                1. Administrator danych
              </h2>
              <p>
                Administratorem Twoich danych osobowych jest Skowronek Studio,
                ul. [adres], [kod pocztowy] Częstochowa,
                e-mail: <a href="mailto:studio@skowronekstudio.pl" className="text-primary hover:underline">studio@skowronekstudio.pl</a>.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium uppercase tracking-[0.1em] text-dark">
                2. Jakie dane zbieramy
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Formularz kontaktowy</strong>: imię i nazwisko, adres e-mail, numer telefonu, treść wiadomości.
                </li>
                <li>
                  <strong>Panel klienta</strong>: adres e-mail i hasło (do logowania), pliki (zdjęcia i filmy) udostępnione przez studio.
                </li>
                <li>
                  <strong>Pliki cookies</strong>: wyłącznie niezbędne technicznie (token sesji panelu klienta). Nie stosujemy cookies śledzących ani marketingowych.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium uppercase tracking-[0.1em] text-dark">
                3. Cel i podstawa przetwarzania
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Odpowiedź na zapytanie przez formularz kontaktowy: art. 6 ust. 1 lit. b RODO (wykonanie umowy lub podjęcie działań przed jej zawarciem).
                </li>
                <li>
                  Prowadzenie panelu klienta i udostępnianie plików: art. 6 ust. 1 lit. b RODO.
                </li>
                <li>
                  Utrzymanie sesji logowania (cookies): art. 6 ust. 1 lit. f RODO (uzasadniony interes administratora).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium uppercase tracking-[0.1em] text-dark">
                4. Okres przechowywania
              </h2>
              <ul className="list-disc space-y-2 pl-5">
                <li>Dane z formularza kontaktowego: do 12 miesięcy od ostatniego kontaktu.</li>
                <li>Dane panelu klienta: do daty wygaśnięcia konta ustalonej ze studiem, następnie automatyczne usunięcie.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium uppercase tracking-[0.1em] text-dark">
                5. Twoje prawa
              </h2>
              <p className="mb-3">Masz prawo do:</p>
              <ul className="list-disc space-y-1 pl-5">
                <li>dostępu do swoich danych,</li>
                <li>sprostowania danych,</li>
                <li>usunięcia danych (&bdquo;prawo do bycia zapomnianym&rdquo;),</li>
                <li>ograniczenia przetwarzania,</li>
                <li>przenoszenia danych,</li>
                <li>wniesienia sprzeciwu wobec przetwarzania,</li>
                <li>wniesienia skargi do Prezesa UODO (uodo.gov.pl).</li>
              </ul>
              <p className="mt-3">
                Aby skorzystać z powyższych praw, skontaktuj się pod adresem:{' '}
                <a href="mailto:studio@skowronekstudio.pl" className="text-primary hover:underline">
                  studio@skowronekstudio.pl
                </a>
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium uppercase tracking-[0.1em] text-dark">
                6. Udostępnianie danych
              </h2>
              <p>
                Dane nie są sprzedawane ani udostępniane podmiotom trzecim w celach marketingowych.
                Mogą być przekazywane wyłącznie podmiotom świadczącym usługi techniczne niezbędne
                do działania serwisu (hosting, dostawca poczty elektronicznej), na podstawie umów
                powierzenia przetwarzania danych.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-medium uppercase tracking-[0.1em] text-dark">
                7. Kontakt
              </h2>
              <p>
                W sprawach dotyczących ochrony danych osobowych prosimy o kontakt:{' '}
                <a href="mailto:studio@skowronekstudio.pl" className="text-primary hover:underline">
                  studio@skowronekstudio.pl
                </a>
              </p>
            </section>

          </div>
        </div>
      </Container>
    </div>
  )
}
