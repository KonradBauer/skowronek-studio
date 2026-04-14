'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
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
        window.location.href = '/dashboard'
        return
      } else {
        const body = await res.json().catch(() => null)
        if (body?.code === 'ACCOUNT_EXPIRED') {
          setError(body.error)
        } else {
          setError('Nieprawidłowy email lub hasło')
        }
        setLoading(false)
      }
    } catch {
      setError('Wystąpił błąd. Spróbuj ponownie.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-12 flex justify-center">
          <span className="text-2xl font-light uppercase tracking-[0.25em] text-dark">
            Foto Studio
          </span>
        </Link>

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
                className="w-full border border-input-border bg-transparent px-4 py-3 text-dark outline-none transition-colors focus:border-primary"
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
                className="w-full border border-input-border bg-transparent px-4 py-3 text-dark outline-none transition-colors focus:border-primary"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z">
                      <animateTransform
                        attributeName="transform"
                        type="scale"
                        values="1;1.15;1;0.95;1"
                        dur="0.8s"
                        repeatCount="indefinite"
                        additive="sum"
                      />
                    </path>
                  </svg>
                  Logowanie...
                </span>
              ) : (
                'Zaloguj się'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-body-muted">
          Dane logowania otrzymujesz od studia po sesji
        </p>
      </div>
    </div>
  )
}
