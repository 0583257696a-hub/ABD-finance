import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import { getCloudflareEnv } from '@/lib/system-db'
import { scrubIdentifiers } from '@/lib/integrations/ai-summary'

/**
 * Turns a meeting transcript into SUGGESTIONS the advisor approves one by
 * one — facts about the client, decisions taken, follow-up tasks, and what
 * worried the client. Never product recommendations, never written into
 * the document automatically (proposal §4.3: approval is a click; automatic
 * writing is a liability). Identifiers are scrubbed before the model sees
 * the text.
 */

import type { ExtractedSuggestions } from '@/lib/transcript-types'

const SYSTEM = [
  'אתה עוזר ליועץ פנסיוני. תקבל תמליל (חלקי או מלא) של פגישת ייעוץ בעברית.',
  'חלץ ממנו רק מה שנאמר במפורש, והחזר JSON בלבד (ללא טקסט נוסף) במבנה:',
  '{"facts":[{"label":"...","value":"..."}],"decisions":["..."],"tasks":[{"text":"...","owner":"advisor|client","due":"YYYY-MM-DD או ריק"}],"concerns":["..."],"needs":{"retirementAgeGoal":"","maritalStatus":"","monthlyIncome":"","monthlyExpenses":"","goals":""}}',
  'facts = עובדות על הלקוח (גיל, מצב משפחתי, מעסיק, הכנסה, נכסים) עד 8; decisions = החלטות שהתקבלו בפגישה עד 6; tasks = משימות המשך עם בעלים עד 8; concerns = שאלות, חששות והתנגדויות שהלקוח העלה עד 6.',
  'כללים: אל תמציא. אל תמליץ על מוצר, יצרן או מסלול. אם משהו לא נאמר - השאר ריק. ניסוח קצר, בעברית.',
].join('\n')

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    facts: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } }, required: ['label', 'value'] } },
    decisions: { type: 'array', items: { type: 'string' } },
    tasks: { type: 'array', items: { type: 'object', properties: { text: { type: 'string' }, owner: { type: 'string', enum: ['advisor', 'client'] }, due: { type: 'string' } }, required: ['text', 'owner'] } },
    concerns: { type: 'array', items: { type: 'string' } },
    needs: { type: 'object', properties: { retirementAgeGoal: { type: 'string' }, maritalStatus: { type: 'string' }, monthlyIncome: { type: 'string' }, monthlyExpenses: { type: 'string' }, goals: { type: 'string' } } },
  },
  required: ['facts', 'decisions', 'tasks', 'concerns', 'needs'],
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const env = await getCloudflareEnv()
  if (typeof env?.AI?.run !== 'function') return NextResponse.json({ error: 'ai-unavailable' }, { status: 503 })

  const body = await request.json().catch(() => ({})) as { transcript?: string }
  const transcript = sanitizeText(body.transcript, 24_000)
  if (transcript.length < 20) return NextResponse.json({ error: 'transcript-too-short' }, { status: 400 })

  try {
    const response = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `התאריך היום: ${new Date().toISOString().slice(0, 10)}. תאריכי יעד (due) חייבים להיות אחרי היום ולהיגזר מהתמליל ("עד סוף החודש", "עד יום ראשון"); אם לא נאמר תאריך - השאר ריק.\n\nתמליל:\n${scrubIdentifiers(transcript)}` },
      ],
      max_tokens: 1600,
      response_format: { type: 'json_schema', json_schema: RESPONSE_SCHEMA },
    }) as { response?: string | Record<string, unknown> } | string
    let parsed: Partial<ExtractedSuggestions>
    if (typeof response !== 'string' && response?.response && typeof response.response === 'object') {
      parsed = response.response as Partial<ExtractedSuggestions>
    } else {
      const raw = typeof response === 'string' ? response : String(response?.response || '')
      const start = raw.indexOf('{')
      const end = raw.lastIndexOf('}')
      if (start < 0 || end <= start) return NextResponse.json({ error: 'extract-failed', detail: 'model returned no JSON', raw: raw.slice(0, 200) }, { status: 502 })
      parsed = JSON.parse(raw.slice(start, end + 1)) as Partial<ExtractedSuggestions>
    }
    const clean = (list: unknown, max: number) => Array.isArray(list) ? list.map(item => sanitizeText(item, 300)).filter(Boolean).slice(0, max) : []
    const suggestions: ExtractedSuggestions = {
      facts: Array.isArray(parsed.facts)
        ? parsed.facts.map(fact => ({ label: sanitizeText((fact as { label?: string })?.label, 60), value: sanitizeText((fact as { value?: string })?.value, 200) })).filter(fact => fact.label && fact.value).slice(0, 8)
        : [],
      decisions: clean(parsed.decisions, 6),
      tasks: Array.isArray(parsed.tasks)
        ? parsed.tasks.map(task => {
          const record = task as { text?: string; owner?: string; due?: string }
          return { text: sanitizeText(record?.text, 300), owner: record?.owner === 'client' ? 'client' as const : 'advisor' as const, due: /^\d{4}-\d{2}-\d{2}$/.test(String(record?.due || '')) ? String(record.due) : undefined }
        }).filter(task => task.text).slice(0, 8)
        : [],
      concerns: clean(parsed.concerns, 6),
      needs: Object.fromEntries(Object.entries(parsed.needs || {}).filter(([, value]) => typeof value === 'string' && value.trim()).map(([key, value]) => [key, sanitizeText(value, 200)])),
    }
    const empty = !suggestions.facts.length && !suggestions.decisions.length && !suggestions.tasks.length && !suggestions.concerns.length && !Object.keys(suggestions.needs).length
    return NextResponse.json({ ok: true, suggestions, ...(empty ? { debug: JSON.stringify(response).slice(0, 400) } : {}) })
  } catch (error) {
    return NextResponse.json({ error: 'extract-failed', detail: error instanceof Error ? error.message : String(error) }, { status: 502 })
  }
}
