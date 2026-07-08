import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getD1GeneralSettings, setD1GeneralSettingValue } from '@/lib/system-db'
import { requireSameOrigin } from '@/lib/security'

// Non-sensitive advisor preferences only. Uploaded client financial files
// (funds/insurance/pension) stay client-side and are never persisted here.
const ALLOWED_KEYS = [
  'settings',
  'templates',
  'returnsConfig',
] as const

type AdvisorDataKey = (typeof ALLOWED_KEYS)[number]

function isAdvisorDataKey(key: string): key is AdvisorDataKey {
  return ALLOWED_KEYS.includes(key as AdvisorDataKey)
}

// Advisor preferences are stored in Cloudflare D1 (user_settings.general_settings_json).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const d1Data = await getD1GeneralSettings(session.user.id)
  return NextResponse.json({ data: d1Data ?? null })
}

export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const key = String(body?.key ?? '')
  if (!isAdvisorDataKey(key)) {
    return NextResponse.json({ error: 'שמירת נתוני קבצים פיננסיים בשרת אינה נתמכת. ניתן לשמור רק הגדרות כלליות.' }, { status: 400 })
  }

  const data = await setD1GeneralSettingValue(session.user.id, key, body.data)
  if (data === null) {
    return NextResponse.json({ error: 'מסד הנתונים אינו זמין כעת. נסה שוב מאוחר יותר.' }, { status: 503 })
  }

  return NextResponse.json({ data })
}
