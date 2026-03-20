import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendEmail, isEmailConfigured, escapeHtml } from '@/lib/email'

const MAX_LENGTHS = { name: 100, email: 254, phone: 20, message: 2000 }
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const payload = await getPayload({ config })

  let body: { name?: string; email?: string; phone?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Nieprawidlowe dane' }, { status: 400 })
  }

  const { name, email, phone, message } = body

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Wymagane pola: name, email, message' },
      { status: 400 },
    )
  }

  if (name.length > MAX_LENGTHS.name || email.length > MAX_LENGTHS.email || message.length > MAX_LENGTHS.message) {
    return NextResponse.json({ error: 'Zbyt dlugie dane' }, { status: 400 })
  }

  if (phone && phone.length > MAX_LENGTHS.phone) {
    return NextResponse.json({ error: 'Zbyt dlugi numer telefonu' }, { status: 400 })
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: 'Nieprawidlowy format email' }, { status: 400 })
  }

  // Save to database
  await payload.create({
    collection: 'contact-submissions',
    data: { name, email, phone: phone || '', message },
  })

  // Send notification email to studio (best-effort, non-blocking)
  if (isEmailConfigured()) {
    try {
      const siteSettings = await payload.findGlobal({ slug: 'site-settings' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const studioEmail = (siteSettings?.contact as any)?.email

      if (studioEmail) {
        const templates = await payload.findGlobal({ slug: 'email-templates', overrideAccess: true })
        const subject = (templates?.contactNotification?.subject as string) || `Nowa wiadomosc - ${escapeHtml(name)}`
        const templateBody =
          (templates?.contactNotification?.body as string) ||
          `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) napisal/a:</p><p>${escapeHtml(message)}</p>`

        const replacePlaceholders = (text: string) =>
          text
            .replace(/\{\{name\}\}/g, escapeHtml(name))
            .replace(/\{\{email\}\}/g, escapeHtml(email))
            .replace(/\{\{phone\}\}/g, escapeHtml(phone || 'nie podano'))
            .replace(/\{\{message\}\}/g, escapeHtml(message))

        await sendEmail({
          to: studioEmail,
          subject: replacePlaceholders(subject),
          html: replacePlaceholders(templateBody),
        })
      }
    } catch (err) {
      // Email failure should not break form submission
      console.error('Blad wysylania powiadomienia email:', err)
    }
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
