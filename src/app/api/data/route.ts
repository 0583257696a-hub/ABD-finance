import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { getPrisma } from '@/lib/db'
import { requireSameOrigin } from '@/lib/security'

const ALLOWED_KEYS = [
  'settings',
  'templates',
  'returnsConfig',
] as const

type AdvisorDataKey = (typeof ALLOWED_KEYS)[number]

function isAdvisorDataKey(key: string): key is AdvisorDataKey {
  return ALLOWED_KEYS.includes(key as AdvisorDataKey)
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const prisma = await getPrisma()
  const advisorData = await prisma.advisorData.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json({ data: advisorData ?? null })
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

  const prisma = await getPrisma()
  const advisorData = await prisma.advisorData.upsert({
    where: { userId: session.user.id },
    update: { [key]: body.data },
    create: {
      userId: session.user.id,
      [key]: body.data,
    },
  })

  return NextResponse.json({ data: advisorData })
}
