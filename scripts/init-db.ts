import { getPayload } from 'payload'
import config from '../payload.config'

async function initDB() {
  console.log('Initializing database...')
  const payload = await getPayload({ config })

  try {
    const users = await payload.find({ collection: 'users', limit: 1 })
    console.log(`Database OK. Users found: ${users.totalDocs}`)

    if (users.totalDocs === 0) {
      console.log('Creating default admin user...')
      await payload.create({
        collection: 'users',
        data: {
          email: 'admin@skowronekstudio.pl',
          password: 'admin123',
          role: 'admin',
        },
      })
      console.log('Admin user created: admin@skowronekstudio.pl / admin123')
      console.log('⚠  CHANGE THIS PASSWORD IMMEDIATELY!')
    }
  } catch (e) {
    console.error('Database initialization failed:', e)
    process.exit(1)
  }

  process.exit(0)
}

initDB()
