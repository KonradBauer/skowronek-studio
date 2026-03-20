import { NextResponse } from 'next/server'

export async function POST() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const response = NextResponse.redirect(new URL('/login', baseUrl), { status: 302 })
  response.cookies.delete('payload-token')
  return response
}
