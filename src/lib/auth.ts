import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { rateLimit } from './security'
import { getCloudflareEnv, writeAuditEvent } from './system-db'

type AppRole = 'admin' | 'advisor'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role?: AppRole
    }
  }

  interface User {
    role?: AppRole
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role?: AppRole
  }
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@abd-finance.co.il'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AbdAdmin2026!'
const ADVISOR_EMAIL = process.env.APP_USER_EMAIL || 'advisor@abd-finance.co.il'
const ADVISOR_PASSWORD = process.env.APP_USER_PASSWORD || 'AbdUser2026!'
const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  'abd-finance-static-auth-secret-change-in-cloudflare'

function normalizeEmail(email?: string | null) {
  return String(email || '').trim().toLowerCase()
}

async function authorizeStaticUser(email: string, password: string) {
  const configuredUsers = [
    {
      id: 'admin-static',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: 'מנהל המערכת',
      role: 'admin' as AppRole,
    },
    {
      id: 'advisor-static',
      email: ADVISOR_EMAIL,
      password: ADVISOR_PASSWORD,
      name: 'יועץ',
      role: 'advisor' as AppRole,
    },
  ].filter(user => user.email && user.password)

  const matched = configuredUsers.find(user => normalizeEmail(user.email) === normalizeEmail(email))
  if (!matched || password !== matched.password) return null

  return {
    id: matched.id,
    email: matched.email,
    name: matched.name,
    role: matched.role,
  }
}

async function authorizeD1User(email: string, password: string) {
  try {
    const { findD1UserByEmail } = await import('./system-db')
    const user = await findD1UserByEmail(email)
    if (!user) return null

    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) return null
    if (!['active', 'trial_active'].includes(user.status)) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeEmail(user.email) === normalizeEmail(ADMIN_EMAIL) || user.role === 'admin' ? 'admin' as AppRole : 'advisor' as AppRole,
    }
  } catch (error) {
    console.warn('D1 auth unavailable, falling back.', error)
    return null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'אימייל', type: 'email' },
        password: { label: 'סיסמה', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = normalizeEmail(credentials.email)
        const password = String(credentials.password)
        const limited = rateLimit(`login:${email}`, {
          limit: 6,
          windowMs: 10 * 60 * 1000,
          blockMs: 30 * 60 * 1000,
        })
        if (!limited.allowed) {
          await writeAuditEvent({ actorEmail: email, action: 'auth.login.rate_limited', targetId: email })
          return null
        }

        const user = await authorizeStaticUser(email, password) || await authorizeD1User(email, password)
        await writeAuditEvent({
          actorEmail: email,
          action: user ? 'auth.login.success' : 'auth.login.failed',
          targetId: email,
        })
        return user
      },
    }),
  ],
  pages: { signIn: '/login' },
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: AUTH_SECRET,
  callbacks: {
    /**
     * Google sign-in is an AUTHENTICATION method, not a registration path:
     * only emails that already exist in the system (static admin/advisor or
     * an approved D1 user) get in. Anyone else is bounced to the login page
     * with a no-account error and pointed at the registration flow.
     */
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true
      const resolved = await resolveExistingUser(user.email)
      if (resolved) {
        await writeAuditEvent({ actorEmail: normalizeEmail(user.email), action: 'auth.login.google.success', targetId: normalizeEmail(user.email) })
        return true
      }
      await writeAuditEvent({ actorEmail: normalizeEmail(user.email), action: 'auth.login.google.no_account', targetId: normalizeEmail(user.email) })
      return '/login?error=no-account'
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        // Google profiles carry no app role/id — resolve from our own records.
        if (account?.provider === 'google') {
          const resolved = await resolveExistingUser(user.email)
          if (resolved) {
            token.id = resolved.id
            token.role = resolved.role
          }
        }
      }
      return token
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
}

/** Maps a Google-authenticated email to an existing app user (static or D1, active only). */
async function resolveExistingUser(email?: string | null): Promise<{ id: string; role: AppRole } | null> {
  const normalized = normalizeEmail(email)
  if (!normalized) return null
  if (normalized === normalizeEmail(ADMIN_EMAIL)) return { id: 'admin-static', role: 'admin' }
  if (normalized === normalizeEmail(ADVISOR_EMAIL)) return { id: 'advisor-static', role: 'advisor' }
  try {
    const { findD1UserByEmail } = await import('./system-db')
    const d1User = await findD1UserByEmail(normalized)
    if (d1User && ['active', 'trial_active'].includes(d1User.status)) {
      return { id: d1User.id, role: d1User.role === 'admin' ? 'admin' : 'advisor' }
    }
  } catch { /* D1 unavailable — deny rather than guess */ }
  return null
}

/**
 * Runtime auth options for the [...nextauth] route handler: adds the Google
 * provider with credentials read from the Cloudflare env at request time.
 * The static `authOptions` above stays provider-light because Cloudflare
 * secrets aren't reliably on process.env at module-init — and every
 * getServerSession(authOptions) caller only needs secret/cookies/callbacks
 * for JWT validation anyway, not the provider list.
 */
export async function buildRuntimeAuthOptions(): Promise<NextAuthOptions> {
  const env = await getCloudflareEnv()
  const clientId = String(env?.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '')
  const clientSecret = String(env?.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '')
  if (!clientId || !clientSecret) return authOptions
  return {
    ...authOptions,
    providers: [
      ...authOptions.providers,
      GoogleProvider({ clientId, clientSecret }),
    ],
  }
}
