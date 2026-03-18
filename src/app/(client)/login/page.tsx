'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch('/api/clients/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.get('email'),
          password: data.get('password'),
        }),
      })

      if (res.ok) {
        router.push('/dashboard')
      } else {
        setError('Nieprawidłowy email lub hasło')
      }
    } catch {
      setError('Wystąpił błąd. Spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <a href="/" className="mb-12 block text-center text-2xl font-light tracking-[0.2em] uppercase text-dark">
          Skowronek Studio
        </a>

        <div className="bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-center text-xl font-light tracking-wide text-dark">
            Panel klienta
          </h1>
          <p className="mb-8 text-center text-sm text-body">
            Zaloguj się, aby pobrać swoje zdjęcia i filmy
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm uppercase tracking-[0.1em] text-dark">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full border border-warm-gray bg-transparent px-4 py-3 text-dark outline-none transition-colors focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm uppercase tracking-[0.1em] text-dark">
                Hasło
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full border border-warm-gray bg-transparent px-4 py-3 text-dark outline-none transition-colors focus:border-primary"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-body/60">
          Dane logowania otrzymujesz od studia po sesji
        </p>
      </div>
    </div>
  )
}
