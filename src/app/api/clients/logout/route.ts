import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', req.url), { status: 302 })
  response.cookies.delete('client-token')
  return response
}
