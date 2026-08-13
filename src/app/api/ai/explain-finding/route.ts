import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import { explainFinding } from '@/lib/integrations/ai-summary'

/**
 * AI explanation for a Smart Agent finding. The AI's ONLY role here is
 * explaining an already-detected, rule-engine-produced finding in plain
 * language — it never generates findings and never recommends products
 * (guardrails + identifier scrub in lib/integrations/ai-summary.ts).
 * The payload is finding evidence only: pseudonymous refs and product
 * attributes, no identity data by construction.
 */

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    title?: string
    detail?: string
    severity?: string
    evidence?: Array<{ label?: string; value?: string }>
  }
  const title = sanitizeText(body.title, 200)
  const detail = sanitizeText(body.detail, 2000)
  if (!title) return NextResponse.json({ error: 'missing-finding' }, { status: 400 })

  const evidence = (Array.isArray(body.evidence) ? body.evidence : [])
    .slice(0, 12)
    .map(item => `${sanitizeText(item?.label, 80)}: ${sanitizeText(item?.value, 200)}`)
    .filter(line => line !== ': ')

  const result = await explainFinding({
    title,
    detail,
    severity: sanitizeText(body.severity, 20),
    evidenceLines: evidence,
  })
  if (!result.ok) {
    const status = result.error === 'no-provider-available' ? 503 : 502
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json({ explanation: result.explanation, provider: result.provider })
}
