import { randomUUID } from 'crypto'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'

async function main() {
  const rawConnectionString = process.env.DIRECT_URL || process.env.DATABASE_URL
  if (!rawConnectionString) throw new Error('DATABASE_URL or DIRECT_URL is required')
  const pool = new Pool({
    connectionString: rawConnectionString,
    ssl: { rejectUnauthorized: false },
  })
  const hash = await bcrypt.hash('Abd123456!', 10)
  await pool.query(
    `insert into public."User" ("id", "email", "name", "password", "createdAt")
     values ($1, $2, $3, $4, now())
     on conflict ("email")
     do update set "name" = excluded."name", "password" = excluded."password"`,
    [randomUUID(), 'admin@abd-finance.co.il', 'מנהל המערכת', hash]
  )
  console.log('משתמש נוצר בהצלחה')
  await pool.end()
}
main().catch(error => {
  console.error(error)
  process.exit(1)
})
