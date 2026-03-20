import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

function getTransporter(): nodemailer.Transporter {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT) || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    throw new Error('Brak konfiguracji SMTP. Ustaw zmienne: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
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
  const from = process.env.SMTP_FROM || process.env.SMTP_USER
  const transport = getTransporter()

  await transport.sendMail({
    from,
    to,
    subject,
    html,
  })
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
}
