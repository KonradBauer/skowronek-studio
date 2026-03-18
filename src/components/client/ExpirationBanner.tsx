'use client'

interface ExpirationBannerProps {
  expiresAt: string
}

export function ExpirationBanner({ expiresAt }: ExpirationBannerProps) {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft <= 0) {
    return (
      <div className="bg-red-50 border border-red-200 px-6 py-4 text-sm text-red-700">
        Twoje konto wygasło. Pliki zostaną wkrótce usunięte. Skontaktuj się ze studiem, jeśli potrzebujesz przedłużenia.
      </div>
    )
  }

  const color = daysLeft <= 3
    ? 'bg-red-50 border-red-200 text-red-700'
    : daysLeft <= 7
      ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-green-50 border-green-200 text-green-700'

  return (
    <div className={`border px-6 py-4 text-sm ${color}`}>
      {daysLeft === 1
        ? 'Ostatni dzień na pobranie plików!'
        : `Masz jeszcze ${daysLeft} dni na pobranie swoich plików.`
      }
      {' '}Po tym czasie konto i pliki zostaną automatycznie usunięte.
    </div>
  )
}
