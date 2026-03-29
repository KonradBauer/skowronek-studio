import { NextResponse } from 'next/server'

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://skowronekstudio.pl'
  const response = NextResponse.redirect(baseUrl, { status: 302 })
  response.cookies.delete('client-token')
  return response
}
