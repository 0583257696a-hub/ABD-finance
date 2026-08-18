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
        { role: 'user', content: `תמליל:\n${scrubIdentifiers(transcript)}` },
      ],
      max_tokens: 1200,
    }) as { response?: string } | string
    const raw = typeof response === 'string' ? response : String(response?.response || '')
    const jsonText = raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1)
    const parsed = JSON.parse(jsonText) as Partial<ExtractedSuggestions>
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
    return NextResponse.json({ ok: true, suggestions })
  } catch (error) {
    return NextResponse.json({ error: 'extract-failed', detail: error instanceof Error ? error.message : String(error) }, { status: 502 })
  }
}
