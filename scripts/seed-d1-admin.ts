/**
 * Seed (or promote) an admin user in the Cloudflare D1 system database.
 *
 * Usage:
 *   npm run d1:seed:admin -- --email you@example.com --password "StrongPass1" --name "מנהל"
 *   ADMIN_SEED_EMAIL=... ADMIN_SEED_PASSWORD=... npm run d1:seed:admin
 *   npm run d1:seed:admin -- --local            # target the local dev D1 instead of remote
 *
 * If the email already exists it is promoted to role=admin / status=active
 * (password updated only when one is supplied). Financial data is never touched.
 */
import { execFileSync } from 'child_process'
import { randomUUID, createHash } from 'crypto'
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import bcrypt from 'bcryptjs'

const DB_NAME = 'abd-finance-db'

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`)
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1]
  return undefined
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

async function main() {
  const email = (arg('email') || process.env.ADMIN_SEED_EMAIL || 'admin@abd-finance.co.il').trim().toLowerCase()
  const name = arg('name') || process.env.ADMIN_SEED_NAME || 'מנהל המערכת'
  const password = arg('password') || process.env.ADMIN_SEED_PASSWORD || ''
  const local = process.argv.includes('--local')

  if (!email) throw new Error('email is required')

  const now = new Date().toISOString()
  const id = randomUUID()
  const passwordHash = password ? await bcrypt.hash(password, 10) : ''

  // Deterministic id fallback so re-running without a new uuid still conflicts by email.
  const stableId = createHash('sha1').update(email).digest('hex').slice(0, 24)

  const statements: string[] = []

  if (password) {
    statements.push(
      `INSERT INTO users (id, email, name, password_hash, role, status, created_at, updated_at)
       VALUES (${sqlString(id || stableId)}, ${sqlString(email)}, ${sqlString(name)}, ${sqlString(passwordHash)}, 'admin', 'active', ${sqlString(now)}, ${sqlString(now)})
       ON CONFLICT(email) DO UPDATE SET
         name = excluded.name,
         password_hash = excluded.password_hash,
         role = 'admin',
         status = 'active',
         updated_at = excluded.updated_at;`,
    )
  } else {
    // No password provided: only promote an existing account (do not create a passwordless admin).
    statements.push(
      `UPDATE users SET role = 'admin', status = 'active', name = ${sqlString(name)}, updated_at = ${sqlString(now)}
       WHERE lower(email) = ${sqlString(email)};`,
    )
  }

  // Ensure an active registration record so every code path treats the admin as approved.
  const registrationJson = JSON.stringify({ status: 'active', userType: 'admin', approvedAt: now, approvedBy: 'seed-script' })
  const subscriptionJson = JSON.stringify({ status: 'active', planId: 'agency' })
  statements.push(
    `INSERT INTO user_settings (user_id, registration_json, subscription_json, created_at, updated_at)
     SELECT id, ${sqlString(registrationJson)}, ${sqlString(subscriptionJson)}, ${sqlString(now)}, ${sqlString(now)}
       FROM users WHERE lower(email) = ${sqlString(email)}
     ON CONFLICT(user_id) DO UPDATE SET
       registration_json = excluded.registration_json,
       subscription_json = excluded.subscription_json,
       updated_at = excluded.updated_at;`,
  )

  const dir = mkdtempSync(join(tmpdir(), 'd1-seed-'))
  const file = join(dir, 'seed-admin.sql')
  writeFileSync(file, statements.join('\n\n'), 'utf8')

  const flags = ['d1', 'execute', DB_NAME, local ? '--local' : '--remote', '--yes', '--file', file]
  console.log(`Seeding admin ${email} into D1 (${local ? 'local' : 'remote'})${password ? '' : ' [promote-only, no password change]'}...`)

  try {
    const out = execFileSync('npx', ['wrangler', ...flags], { encoding: 'utf8', stdio: 'pipe', shell: process.platform === 'win32' })
    console.log(out.split('\n').slice(-12).join('\n'))
    console.log('✅ Admin seed complete.')
  } finally {
    try { unlinkSync(file) } catch {}
  }
}

main().catch(error => {
  console.error('❌ Admin seed failed:', error?.message || error)
  process.exit(1)
})
