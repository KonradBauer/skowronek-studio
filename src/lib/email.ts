import { Resend } from 'resend'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error('Brak konfiguracji emaila. Ustaw zmienną: RESEND_API_KEY')
  }

  return new Resend(apiKey)
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<void> {
  const from = process.env.RESEND_FROM_EMAIL

  if (!from) {
    throw new Error('Brak konfiguracji emaila. Ustaw zmienną: RESEND_FROM_EMAIL')
  }

  const resend = getResendClient()

  const { error } = await resend.emails.send({ from, to, subject, html })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}

export function isEmailConfigured(): boolean {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
}
