import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Panel klienta - Skowronek Studio',
  robots: { index: false, follow: false },
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="frontend min-h-screen bg-cream antialiased">
        {children}
      </body>
    </html>
  )
}
