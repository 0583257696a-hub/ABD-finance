import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { requireSameOrigin } from '@/lib/security'
import { getCloudflareEnv } from '@/lib/system-db'

/**
 * Speech → text for one recorded audio chunk (a complete WebM/Opus or WAV
 * file, ≤ ~24MB) via Cloudflare Workers AI Whisper. Hebrew first. Audio is
 * processed in-flight only — nothing is stored server-side; the transcript
 * text lives in the meeting summary (internal field) on the client.
 */
export async function POST(request: Request) {
  const csrf = requireSameOrigin(request)
  if (csrf) return csrf
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const env = await getCloudflareEnv()
  if (typeof env?.AI?.run !== 'function') return NextResponse.json({ error: 'ai-unavailable' }, { status: 503 })

  const bytes = new Uint8Array(await request.arrayBuffer())
  if (!bytes.byteLength) return NextResponse.json({ error: 'empty-audio' }, { status: 400 })
  if (bytes.byteLength > 24 * 1024 * 1024) return NextResponse.json({ error: 'audio-too-large' }, { status: 413 })

  const language = new URL(request.url).searchParams.get('lang') || 'he'
  try {
    let binary = ''
    const chunk = 0x8000
    for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
    const base64 = btoa(binary)

    let text = ''
    let model = '@cf/openai/whisper-large-v3-turbo'
    try {
      // Preferred: large-v3-turbo (multilingual, better Hebrew), base64 input.
      const turbo = await env.AI.run(model, { audio: base64, language, task: 'transcribe', vad_filter: true }) as { text?: string }
      text = String(turbo?.text || '').trim()
    } catch {
      model = '@cf/openai/whisper'
      const base = await env.AI.run(model, { audio: Array.from(bytes) }) as { text?: string }
      text = String(base?.text || '').trim()
    }
    return NextResponse.json({ ok: true, text, model })
  } catch (error) {
    return NextResponse.json({ error: 'transcription-failed', detail: error instanceof Error ? error.message : String(error) }, { status: 502 })
  }
}
