import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import {
  deleteQuestionnaireTemplate,
  getQuestionnaireTemplate,
  listQuestionnaireTemplates,
  saveQuestionnaireTemplate,
} from '@/lib/meetings-db'
import { BASE_TEMPLATE_NAME, buildBaseQuestions, type QuestionnaireQuestion } from '@/lib/questionnaires'

/**
 * Advisor-side questionnaire template management (שאלוני הכנה).
 * GET seeds the base template on first use, so every advisor always has at
 * least one questionnaire to send/duplicate.
 */

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userEmail = session.user.email

  let templates = await listQuestionnaireTemplates(userEmail)
  if (!templates.some(template => template.is_default)) {
    await saveQuestionnaireTemplate({
      id: `base-${userEmail}`,
      user_email: userEmail,
      name: BASE_TEMPLATE_NAME,
      questions_json: JSON.stringify(buildBaseQuestions()),
      is_default: 1,
    })
    templates = await listQuestionnaireTemplates(userEmail)
  }
  return NextResponse.json({ templates })
}

const VALID_TYPES = new Set(['text', 'number', 'select', 'multiple-choice', 'yes-no', 'textarea'])

function sanitizeQuestions(raw: unknown): QuestionnaireQuestion[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 120) return null
  const seenIds = new Set<string>()
  const questions: QuestionnaireQuestion[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const entry = item as Record<string, unknown>
    const id = sanitizeText(entry.id, 64)
    const label = sanitizeText(entry.label, 300)
    const type = String(entry.type || '')
    const section = sanitizeText(entry.section, 80) || 'שאלות נוספות'
    if (!id || !label || !VALID_TYPES.has(type) || seenIds.has(id)) return null
    seenIds.add(id)
    const options = Array.isArray(entry.options)
      ? entry.options.map(option => sanitizeText(option, 200)).filter(Boolean).slice(0, 12)
      : undefined
    if ((type === 'select' || type === 'multiple-choice') && (!options || options.length < 2)) return null
    questions.push({
      id,
      section,
      label,
      type: type as QuestionnaireQuestion['type'],
      options,
      required: Boolean(entry.required),
      spouseOnly: Boolean(entry.spouseOnly),
    })
  }
  return questions
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userEmail = session.user.email

  const body = await request.json().catch(() => ({})) as {
    action?: 'create' | 'update' | 'delete'
    id?: string
    name?: string
    questions?: unknown
  }

  if (body.action === 'delete') {
    if (!body.id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })
    await deleteQuestionnaireTemplate(userEmail, body.id)
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'create' || body.action === 'update') {
    const name = sanitizeText(body.name, 160)
    if (!name) return NextResponse.json({ error: 'missing-name' }, { status: 400 })

    let questions: QuestionnaireQuestion[] | null
    if (body.questions !== undefined) {
      questions = sanitizeQuestions(body.questions)
      if (!questions) return NextResponse.json({ error: 'invalid-questions' }, { status: 400 })
    } else if (body.action === 'create') {
      // New questionnaire starts from the base (בירור צרכים + פרטים אישיים + בן/בת זוג).
      questions = buildBaseQuestions()
    } else {
      questions = null
    }

    const id = body.action === 'update' ? sanitizeText(body.id, 100) : crypto.randomUUID()
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    if (body.action === 'update') {
      const existing = await getQuestionnaireTemplate(userEmail, id)
      if (!existing) return NextResponse.json({ error: 'not-found' }, { status: 404 })
      await saveQuestionnaireTemplate({
        id,
        user_email: userEmail,
        name,
        questions_json: questions ? JSON.stringify(questions) : existing.questions_json,
        is_default: existing.is_default,
      })
    } else {
      await saveQuestionnaireTemplate({
        id,
        user_email: userEmail,
        name,
        questions_json: JSON.stringify(questions),
        is_default: 0,
      })
    }
    return NextResponse.json({ ok: true, id })
  }

  return NextResponse.json({ error: 'Bad request' }, { status: 400 })
}
