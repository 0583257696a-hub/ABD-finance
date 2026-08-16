import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import { createClientForm, getQuestionnaireTemplate, listClientForms } from '@/lib/meetings-db'
import { buildBaseQuestions } from '@/lib/questionnaires'
import { sendSystemEmail } from '@/lib/system-mail'

/** Advisor-side management of client intake forms: list + create-and-email. */

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const forms = await listClientForms(session.user.email)
  // Advisors see submissions for their own clients only (scoped by user_email in the query).
  return NextResponse.json({ forms })
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { clientName?: string; clientEmail?: string; templateId?: string }
  const clientName = sanitizeText(body.clientName, 160) || ''
  const clientEmail = sanitizeText(body.clientEmail, 200) || ''
  if (!clientEmail.includes('@')) return NextResponse.json({ error: 'invalid-email' }, { status: 400 })

  // Snapshot the chosen template's questions onto the form row — the form the
  // client sees never changes even if the template is edited or deleted later.
  // No template chosen (or not found) falls back to the built-in base set.
  let questionsJson = JSON.stringify(buildBaseQuestions())
  let templateId: string | null = null
  if (body.templateId) {
    const template = await getQuestionnaireTemplate(session.user.email, sanitizeText(body.templateId, 100))
    if (template) {
      questionsJson = template.questions_json
      templateId = template.id
    }
  }

  const token = crypto.randomUUID().replace(/-/g, '')
  const ok = await createClientForm({
    token,
    user_email: session.user.email,
    client_name: clientName,
    client_email: clientEmail,
    sent_at: new Date().toISOString(),
    template_id: templateId,
    questions_json: questionsJson,
  })
  if (!ok) return NextResponse.json({ error: 'd1-unavailable' }, { status: 503 })

  const origin = new URL(request.url).origin
  const formUrl = `${origin}/client-form/${token}`

  const mail = await sendSystemEmail({
    to: clientEmail,
    subject: 'שאלון הכנה לפגישת ייעוץ — ABD Finance',
    text: `שלום ${clientName},\n\nלקראת פגישת הייעוץ, נודה למילוי שאלון קצר:\n${formUrl}\n\nהמידע ישמש להכנת הפגישה בלבד.\n\nבברכה,\n${session.user.name || 'ABD Finance'}`,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:1.7"><p>שלום ${clientName},</p><p>לקראת פגישת הייעוץ, נודה למילוי שאלון קצר:</p><p><a href="${formUrl}" style="display:inline-block;background:#1F2937;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">למילוי השאלון</a></p><p style="color:#6B7280;font-size:13px">${formUrl}</p><p>המידע ישמש להכנת הפגישה בלבד.</p><p>בברכה,<br/>${session.user.name || 'ABD Finance'}</p></div>`,
    replyTo: session.user.email,
  })

  return NextResponse.json({ ok: true, token, formUrl, emailSent: mail.ok, emailQueued: 'queued' in mail ? mail.queued : false })
}
