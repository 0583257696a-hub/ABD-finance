import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin, sanitizeText } from '@/lib/security'
import { generateMeetingSummaryDraft, listAvailableProviders } from '@/lib/integrations/ai-summary'

/**
 * AI meeting-summary draft endpoint. The frontend sends STRUCTURED meeting
 * data it prepared (funds/recommendations/needs as text, no ID or account
 * numbers) — see the sanitization + guardrail layers in
 * lib/integrations/ai-summary.ts. Output is always a draft for the advisor.
 */

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const providers = await listAvailableProviders()
  return NextResponse.json({ providers, configured: providers.length > 0 })
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { meetingData?: string; notes?: string }
  const meetingData = sanitizeText(body.meetingData, 12000)
  if (!meetingData) return NextResponse.json({ error: 'missing-meeting-data' }, { status: 400 })

  const result = await generateMeetingSummaryDraft({
    meetingData,
    notes: sanitizeText(body.notes, 6000) || undefined,
  })
  if (!result.ok) {
    const status = result.error === 'no-provider-available' ? 503 : 502
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json(result)
}
