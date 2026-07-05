import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { isApprovedRegistration } from './admin/registration'
import { rateLimit } from './security'
import { writeAuditEvent } from './system-db'

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

async function authorizeDatabaseUser(email: string, password: string) {
  try {
    const { getPrisma } = await import('./db')
    const prisma = await getPrisma()
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        advisorData: {
          select: { settings: true },
        },
      },
    })
    if (!user) return null

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return null
    if (!isApprovedRegistration(user.advisorData?.settings)) return null

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: normalizeEmail(user.email) === normalizeEmail(ADMIN_EMAIL) ? 'admin' as AppRole : 'advisor' as AppRole,
    }
  } catch (error) {
    console.warn('Database auth unavailable, static credentials only.', error)
    return null
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

        const user = await authorizeStaticUser(email, password) || await authorizeD1User(email, password) || await authorizeDatabaseUser(email, password)
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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
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
