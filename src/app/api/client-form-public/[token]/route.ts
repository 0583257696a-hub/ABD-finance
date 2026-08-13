import { NextResponse } from 'next/server'
import { getClientFormByToken, submitClientForm } from '@/lib/meetings-db'
import { sanitizeText } from '@/lib/security'

/**
 * Public (unauthenticated) endpoints for the client-facing intake form.
 * Access is by unguessable token only; a token exposes just the client's
 * own first name + form status, never any advisor data. Submission is
 * single-use — a token that was already submitted cannot be overwritten.
 */

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  if (!/^[a-f0-9]{32}$/.test(token)) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  const form = await getClientFormByToken(token)
  if (!form) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  return NextResponse.json({ clientName: form.client_name, status: form.status })
}

const FIELD_LIMITS: Record<string, number> = {
  fullName: 160,
  phone: 40,
  birthYear: 8,
  maritalStatus: 40,
  employmentStatus: 60,
  employerName: 160,
  monthlyIncome: 20,
  partnerMonthlyIncome: 20,
  monthlyExpenses: 20,
  hasPension: 10,
  hasStudyFund: 10,
  hasLifeInsurance: 10,
  hasHealthInsurance: 10,
  retirementAgeGoal: 8,
  goals: 2000,
  notes: 2000,
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  if (!/^[a-f0-9]{32}$/.test(token)) return NextResponse.json({ error: 'not-found' }, { status: 404 })

  const form = await getClientFormByToken(token)
  if (!form) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  if (form.status === 'submitted') return NextResponse.json({ error: 'already-submitted' }, { status: 409 })

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  // Allowlist model: only known fields, each length-capped — never store arbitrary client JSON.
  const payload: Record<string, string> = {}
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    const value = sanitizeText(body[field], limit)
    if (value) payload[field] = value
  }
  if (!Object.keys(payload).length) return NextResponse.json({ error: 'empty' }, { status: 400 })

  const ok = await submitClientForm(token, JSON.stringify(payload))
  if (!ok) return NextResponse.json({ error: 'already-submitted' }, { status: 409 })
  return NextResponse.json({ ok: true })
}
