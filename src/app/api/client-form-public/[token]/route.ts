import { NextResponse } from 'next/server'
import { createNotification, getClientFormByToken, submitClientForm } from '@/lib/meetings-db'
import { answerLimitFor, buildBaseQuestions, parseQuestions } from '@/lib/questionnaires'
import { sanitizeText } from '@/lib/security'

/**
 * Public (unauthenticated) endpoints for the client-facing intake form.
 * Access is by unguessable token only; a token exposes just the client's
 * own first name + form status + the question list, never any advisor
 * data. Submission is single-use — a token that was already submitted
 * cannot be overwritten. The allowlist of accepted fields is the form's
 * own question snapshot (questions_json), so custom questionnaires
 * validate exactly like the base one.
 */

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  if (!/^[a-f0-9]{32}$/.test(token)) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  const form = await getClientFormByToken(token)
  if (!form) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  const questions = parseQuestions(form.questions_json)
  return NextResponse.json({
    clientName: form.client_name,
    status: form.status,
    // Legacy forms sent before the questionnaire system have no snapshot —
    // serve the base question set so they stay fillable.
    questions: questions.length ? questions : buildBaseQuestions(),
  })
}

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  if (!/^[a-f0-9]{32}$/.test(token)) return NextResponse.json({ error: 'not-found' }, { status: 404 })

  const form = await getClientFormByToken(token)
  if (!form) return NextResponse.json({ error: 'not-found' }, { status: 404 })
  if (form.status === 'submitted') return NextResponse.json({ error: 'already-submitted' }, { status: 409 })

  const snapshot = parseQuestions(form.questions_json)
  const questions = snapshot.length ? snapshot : buildBaseQuestions()

  const body = await request.json().catch(() => ({})) as Record<string, unknown>
  // Allowlist model: only the snapshot's question ids, each length-capped by
  // question type — never store arbitrary client JSON.
  const payload: Record<string, string> = {}
  for (const question of questions) {
    const value = sanitizeText(body[question.id], answerLimitFor(question.type))
    if (value) payload[question.id] = value
  }
  if (!Object.keys(payload).length) return NextResponse.json({ error: 'empty' }, { status: 400 })

  const ok = await submitClientForm(token, JSON.stringify(payload))
  if (!ok) return NextResponse.json({ error: 'already-submitted' }, { status: 409 })

  await createNotification({
    id: crypto.randomUUID(),
    user_email: form.user_email,
    type: 'form-submitted',
    title: 'שאלון הכנה מולא על ידי הלקוח',
    body: `${form.client_name || form.client_email || 'לקוח'} סיים/ה למלא את שאלון ההכנה.`,
    link: '/?tab=meetings',
  })

  return NextResponse.json({ ok: true })
}
