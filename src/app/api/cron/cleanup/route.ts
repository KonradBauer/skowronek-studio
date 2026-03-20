import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cleanupExpiredClients } from '@/lib/cleanup'

async function handleCleanup(req: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET
  const authHeader = req.headers.get('authorization')
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const result = await cleanupExpiredClients(payload)

  return NextResponse.json({
    success: true,
    ...result,
    timestamp: new Date().toISOString(),
  })
}

// POST for external cron services
export async function POST(req: NextRequest) {
  return handleCleanup(req)
}

// GET for Vercel Cron
export async function GET(req: NextRequest) {
  return handleCleanup(req)
}
