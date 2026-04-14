import type { Metadata } from 'next'
import { CookieConsent } from '@/components/ui/CookieConsent'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Panel klienta - Foto Studio',
  robots: { index: false, follow: false },
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="frontend min-h-screen bg-cream antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
