import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdmin, d1Unavailable } from '@/lib/admin/guard'
import { deleteD1UserCompletely, linkUserToAgencyFromRegistration, listAdminUsers, setD1UserRole, writeAuditEvent } from '@/lib/admin/admin-db'
import { findD1UserById, updateD1UserPassword, updateD1UserStatus } from '@/lib/system-db'
import { sanitizeText } from '@/lib/security'

/**
 * Admin: users. GET lists everyone with agency membership + activity counts;
 * PATCH applies one named action; DELETE removes the user AND all their data
 * (product decision — see deleteD1UserCompletely).
 */

export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const users = await listAdminUsers()
  if (!users) return NextResponse.json({ users: [], mode: 'static-auth' })
  return NextResponse.json({ users, mode: 'd1' })
}

type PatchBody = {
  userId?: string
  action?: 'approve' | 'block' | 'unblock' | 'extend_trial' | 'set_subscription' | 'reset_password' | 'set_role'
  password?: string
  planId?: string
  subscriptionStatus?: string
  role?: 'admin' | 'advisor'
}

export async function PATCH(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const admin = gate.admin

  const body = await request.json().catch(() => ({})) as PatchBody
  const userId = String(body.userId || '')
  const action = body.action
  if (!userId || !action) return NextResponse.json({ error: 'חסר משתמש או פעולה' }, { status: 400 })

  const target = await findD1UserById(userId).catch(() => null)
  if (!target) return d1Unavailable()
  const now = new Date().toISOString()

  try {
    if (action === 'reset_password') {
      const password = String(body.password || '')
      if (password.length < 8) return NextResponse.json({ error: 'סיסמה חייבת להכיל לפחות 8 תווים' }, { status: 400 })
      await updateD1UserPassword(userId, await bcrypt.hash(password, 10))
      await writeAuditEvent({ actorEmail: admin.email, action: 'admin.user.password_reset', targetId: userId, metadata: { email: target.email } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'set_role') {
      const role = body.role === 'admin' ? 'admin' : 'advisor'
      if (target.email.toLowerCase() === admin.email.toLowerCase() && role !== 'admin') {
        return NextResponse.json({ error: 'לא ניתן להסיר הרשאת מנהל מעצמך' }, { status: 400 })
      }
      await setD1UserRole(userId, role)
      await writeAuditEvent({ actorEmail: admin.email, action: 'admin.user.role_changed', targetId: userId, metadata: { email: target.email, role } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'approve') {
      await updateD1UserStatus(userId, 'active',
        { status: 'active', approvedAt: now, approvedBy: admin.email, subscriptionStatus: 'trial_active' },
        { status: 'trial_active', trialStartedAt: now })
      // Approval is when a registered agency manager gets their agency and an
      // employee joins an existing one (never before approval).
      const link = await linkUserToAgencyFromRegistration(userId).catch(() => ({ linked: false }))
      await writeAuditEvent({ actorEmail: admin.email, action: 'admin.user.approved', targetId: userId, metadata: { email: target.email, agencyLinked: link.linked, agencyCreated: Boolean((link as { created?: boolean }).created) } })
      return NextResponse.json({ ok: true, agencyLinked: link.linked })
    }

    if (action === 'block') {
      if (target.email.toLowerCase() === admin.email.toLowerCase()) return NextResponse.json({ error: 'לא ניתן לחסום את עצמך' }, { status: 400 })
      await updateD1UserStatus(userId, 'blocked',
        { status: 'blocked', blockedAt: now, blockedBy: admin.email, subscriptionStatus: 'blocked' },
        { status: 'blocked' })
      await writeAuditEvent({ actorEmail: admin.email, action: 'admin.user.blocked', targetId: userId, metadata: { email: target.email } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'unblock') {
      await updateD1UserStatus(userId, 'active',
        { status: 'active', unblockedAt: now, unblockedBy: admin.email, subscriptionStatus: 'active' },
        { status: 'active' })
      await writeAuditEvent({ actorEmail: admin.email, action: 'admin.user.unblocked', targetId: userId, metadata: { email: target.email } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'extend_trial') {
      const trialEndsAt = new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString()
      await updateD1UserStatus(userId, 'active',
        { status: 'active', trialExtendedAt: now, trialEndsAt, subscriptionStatus: 'trial_active' },
        { status: 'trial_active', trialExtendedAt: now, trialEndsAt })
      await writeAuditEvent({ actorEmail: admin.email, action: 'admin.user.trial_extended', targetId: userId, metadata: { email: target.email, trialEndsAt } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'set_subscription') {
      const subscriptionStatus = sanitizeText(body.subscriptionStatus, 40) || 'active'
      const planId = sanitizeText(body.planId, 60) || 'trial'
      const blocked = subscriptionStatus === 'blocked'
      await updateD1UserStatus(userId, blocked ? 'blocked' : 'active',
        { status: blocked ? 'blocked' : 'active', subscriptionStatus, planId },
        { status: subscriptionStatus, planId })
      await writeAuditEvent({ actorEmail: admin.email, action: 'admin.user.subscription_changed', targetId: userId, metadata: { email: target.email, planId, subscriptionStatus } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'פעולת עדכון לא נתמכת' }, { status: 400 })
  } catch {
    return d1Unavailable()
  }
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin(request)
  if (gate.response) return gate.response
  const admin = gate.admin

  const userId = new URL(request.url).searchParams.get('id') || ''
  if (!userId) return NextResponse.json({ error: 'חסר מזהה משתמש' }, { status: 400 })
  const target = await findD1UserById(userId).catch(() => null)
  if (!target) return NextResponse.json({ error: 'המשתמש לא נמצא' }, { status: 404 })
  if (target.email.toLowerCase() === admin.email.toLowerCase()) {
    return NextResponse.json({ error: 'לא ניתן למחוק את המשתמש שאיתו אתה מחובר' }, { status: 400 })
  }

  const result = await deleteD1UserCompletely(userId)
  if (!result.ok) return d1Unavailable()
  await writeAuditEvent({ actorEmail: admin.email, action: 'admin.user.deleted', targetId: userId, metadata: { email: result.email, removed: result.removed } })
  return NextResponse.json({ ok: true, removed: result.removed })
}
