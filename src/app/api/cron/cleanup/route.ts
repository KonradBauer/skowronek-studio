import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { cleanupExpiredClients } from '@/lib/cleanup'

export async function POST(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
