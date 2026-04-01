import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdmin } from '@/lib/auth'
import { sendEmail, isEmailConfigured, escapeHtml } from '@/lib/email'

export async function POST(req: NextRequest) {
  const auth = await authenticateAdmin(req)
  if (!auth.success) return auth.response
  const { payload } = auth.data

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'Email nie jest skonfigurowany. Ustaw zmienne SMTP_HOST, SMTP_USER, SMTP_PASS w .env' },
      { status: 500 },
    )
  }

  const { clientId, password } = await req.json()

  if (!clientId || typeof clientId !== 'string' || !password || typeof password !== 'string') {
    return NextResponse.json({ error: 'Wymagane pola: clientId, password' }, { status: 400 })
  }

  // Fetch client
  const client = await payload.findByID({
    collection: 'clients',
    id: clientId,
  })

  if (!client) {
    return NextResponse.json({ error: 'Klient nie znaleziony' }, { status: 404 })
  }

  // Fetch email template
  const templates = await payload.findGlobal({ slug: 'email-templates', overrideAccess: true })

  const subject = (templates?.clientCredentials?.subject as string) || 'Twoje zdjęcia są gotowe - Skowronek Studio'
  const body =
    (templates?.clientCredentials?.body as string) ||
    `<p>Cześć {{clientName}}, Twój login: {{email}}, hasło: {{password}}</p>`

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://skowronekstudio.pl'
  const expiresAt = client.expiresAt
    ? new Date(client.expiresAt as string).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'nieznana'

  const sessionTypeText = (client.sessionType as string)
    ? ` z sesji "${client.sessionType}"`
    : ''

  // Replace placeholders (escape user-controlled data to prevent HTML injection)
  const replacePlaceholders = (text: string) =>
    text
      .replace(/\{\{clientName\}\}/g, escapeHtml(client.name as string))
      .replace(/\{\{email\}\}/g, escapeHtml(client.email as string))
      .replace(/\{\{password\}\}/g, escapeHtml(password))
      .replace(/\{\{siteUrl\}\}/g, siteUrl)
      .replace(/\{\{expiresAt\}\}/g, expiresAt)
      .replace(/\{\{sessionType\}\}/g, escapeHtml(sessionTypeText))

  try {
    await sendEmail({
      to: client.email as string,
      subject: replacePlaceholders(subject),
      html: replacePlaceholders(body),
    })

    return NextResponse.json({ success: true, message: 'Email wysłany pomyślnie' })
  } catch (err) {
    console.error('Błąd wysyłania emaila:', err)
    return NextResponse.json(
      { error: 'Nie udało się wysłać emaila. Sprawdź konfigurację SMTP.' },
      { status: 500 },
    )
  }
}
