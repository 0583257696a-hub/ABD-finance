import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const ALLOWED_KEYS = [
  'fundsData',
  'insuranceData',
  'settings',
  'templates',
  'returnsConfig',
  'workspaceState',
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

  const advisorData = await prisma.advisorData.findUnique({
    where: { userId: session.user.id },
  })

  return NextResponse.json({ data: advisorData ?? null })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const key = String(body?.key ?? '')
  if (!isAdvisorDataKey(key)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 })
  }

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
