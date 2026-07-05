import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getPrisma } from '@/lib/db'
import { adminInfrastructureDefaults } from '@/lib/admin/defaults'
import {
  normalizeRegistrationEmail,
  type RegistrationProfile,
  type RegistrationUserType,
} from '@/lib/admin/registration'
import { checkPasswordPolicy } from '@/lib/password-policy'
import { createD1User, findD1UserByEmail } from '@/lib/system-db'
import {
  adminNewRegistrationEmail,
  adminNotificationEmail,
  registrationThanksEmail,
  sendSystemEmail,
} from '@/lib/system-mail'
import { clientIp, rateLimit, rateLimitResponse, requireSameOrigin, sanitizeText } from '@/lib/security'
import { writeAuditEvent } from '@/lib/system-db'

const TERMS_VERSION = '2026-07-05'
const PRIVACY_VERSION = '2026-07-05'

type RegisterBody = {
  userType?: RegistrationUserType
  fullName?: string
  email?: string
  phone?: string
  roleTitle?: string
  password?: string
  confirmPassword?: string
  acceptedTerms?: boolean
  acceptedPrivacy?: boolean
  planId?: string
  businessName?: string
  businessId?: string
  businessAddress?: string
  businessEmail?: string
  businessPhone?: string
  businessField?: string
  estimatedEmployees?: string
  agencyName?: string
  managerEmail?: string
  joinMessage?: string
}

function clean(value: unknown) {
  return sanitizeText(value, 500)
}

function isAllowedUserType(value: unknown): value is RegistrationUserType {
  return value === 'independent_advisor' || value === 'agency_manager' || value === 'agency_employee'
}

function validateRegistration(body: RegisterBody) {
  const errors: string[] = []
  const userType = isAllowedUserType(body.userType) ? body.userType : 'independent_advisor'
  const fullName = clean(body.fullName)
  const email = normalizeRegistrationEmail(body.email)
  const phone = clean(body.phone)
  const password = String(body.password || '')
  const confirmPassword = String(body.confirmPassword || '')
  const passwordPolicy = checkPasswordPolicy(password)

  if (!adminInfrastructureDefaults.registration.registrationOpen) errors.push('ההרשמה סגורה כרגע.')
  if (!fullName) errors.push('חסר שם מלא.')
  if (!email || !email.includes('@')) errors.push('חסר אימייל תקין.')
  if (!phone) errors.push('חסר טלפון.')
  if (!passwordPolicy.valid) errors.push('הסיסמה חייבת לכלול לפחות 8 תווים, אות גדולה באנגלית ואות קטנה באנגלית.')
  if (password !== confirmPassword) errors.push('אימות הסיסמה אינו תואם.')
  if (!body.acceptedTerms || !body.acceptedPrivacy) errors.push('יש לאשר תנאי שימוש ומדיניות פרטיות.')

  if (userType === 'independent_advisor' || userType === 'agency_manager') {
    if (!clean(body.businessName)) errors.push('חסר שם עסק / סוכנות.')
    if (!clean(body.businessEmail) && !clean(body.businessPhone)) errors.push('חסר אימייל או טלפון עסקי.')
  }

  if (userType === 'agency_employee') {
    if (!clean(body.agencyName)) errors.push('חסר שם סוכנות.')
    if (!normalizeRegistrationEmail(body.managerEmail)) errors.push('חסר אימייל מנהל סוכנות.')
  }

  return { errors, userType, fullName, email, phone, password }
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const limited = rateLimit(`register:${clientIp(request)}`, {
    limit: 8,
    windowMs: 10 * 60 * 1000,
    blockMs: 30 * 60 * 1000,
  })
  if (!limited.allowed) return rateLimitResponse(limited.retryAfter)

  const body = await request.json().catch(() => null) as RegisterBody | null
  if (!body) {
    return NextResponse.json({ error: 'בקשת הרשמה לא תקינה.' }, { status: 400 })
  }

  const { errors, userType, fullName, email, phone, password } = validateRegistration(body)
  if (errors.length) {
    return NextResponse.json({ error: errors.join(' ') }, { status: 400 })
  }

  try {
    const now = new Date().toISOString()
    const planId = clean(body.planId) || 'trial'
    const registration: RegistrationProfile = {
      status: adminInfrastructureDefaults.registration.manualApprovalRequired ? 'pending_approval' : 'active',
      userType,
      phone,
      roleTitle: clean(body.roleTitle),
      planId,
      subscriptionStatus: adminInfrastructureDefaults.registration.manualApprovalRequired ? 'trial_pending' : 'trial_active',
      submittedAt: now,
      business: {
        name: clean(body.businessName),
        id: clean(body.businessId),
        address: clean(body.businessAddress),
        email: normalizeRegistrationEmail(body.businessEmail),
        phone: clean(body.businessPhone),
        field: clean(body.businessField),
        estimatedEmployees: clean(body.estimatedEmployees),
      },
      agencyJoin: {
        agencyName: clean(body.agencyName),
        managerEmail: normalizeRegistrationEmail(body.managerEmail),
        message: clean(body.joinMessage),
      },
      terms: {
        acceptedTermsAt: now,
        acceptedPrivacyAt: now,
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
        source: 'registration',
      },
    }
    const subscription = {
      status: registration.subscriptionStatus,
      planId,
      trialDays: adminInfrastructureDefaults.registration.defaultTrialDays,
    }

    const hash = await bcrypt.hash(password, 10)
    const d1Existing = await findD1UserByEmail(email)
    if (d1Existing) {
      return NextResponse.json({ error: 'קיים כבר משתמש עם האימייל הזה.' }, { status: 409 })
    }

    const d1User = await createD1User({
      email,
      name: fullName,
      passwordHash: hash,
      status: registration.status,
      registration,
      subscription,
    })

    if (!d1User) {
      const prisma = await getPrisma()
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json({ error: 'קיים כבר משתמש עם האימייל הזה.' }, { status: 409 })
      }

      await prisma.$transaction(async tx => {
        const user = await tx.user.create({
          data: {
            email,
            name: fullName,
            password: hash,
          },
        })

        await tx.advisorData.create({
          data: {
            userId: user.id,
            settings: {
              registration,
              subscription,
            },
          },
        })
      })
    }

    const thanks = registrationThanksEmail({ fullName })
    const adminMail = adminNewRegistrationEmail({
      fullName,
      email,
      phone,
      userType,
      planId,
      adminUrl: new URL('/admin-panel', request.url).toString(),
    })
    await Promise.allSettled([
      sendSystemEmail({ to: email, ...thanks }),
      sendSystemEmail({ to: adminNotificationEmail(), ...adminMail }),
    ])
    await writeAuditEvent({
      actorEmail: email,
      action: 'registration.submitted',
      targetId: email,
      metadata: { userType, planId, termsVersion: TERMS_VERSION, privacyVersion: PRIVACY_VERSION },
    })

    return NextResponse.json({
      ok: true,
      status: registration.status,
      message: adminInfrastructureDefaults.registration.pendingApprovalMessage,
    })
  } catch (error) {
    console.error('Registration failed', error)
    return NextResponse.json(
      { error: 'לא ניתן לבצע הרשמה כרגע. ודא שמסד הנתונים פעיל ומוגדר בסביבת Cloudflare.' },
      { status: 503 },
    )
  }
}
