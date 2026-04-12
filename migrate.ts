// Standalone migration script: initializes Payload which triggers db.push
// Runs as a separate Docker service before the app starts
import { getPayload } from 'payload'
import config from '@payload-config'

async function migrate() {
  console.log('[migrate] Pushing database schema...')

  const payload = await getPayload({ config })

  console.log('[migrate] Schema pushed successfully. Database is ready.')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('[migrate] Failed to push schema:', err)
  process.exit(1)
})
