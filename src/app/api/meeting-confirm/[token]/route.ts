import { confirmMeetingByToken, createNotification } from '@/lib/meetings-db'

/**
 * Public (unauthenticated) meeting-confirmation endpoint. The token comes
 * from the "אשר הגעה" button in the invite email. Confirming is idempotent;
 * the advisor gets an in-app notification on the first confirmation only.
 * Responds with a minimal, self-contained HTML page for the client.
 */

function page(title: string, body: string): Response {
  return new Response(
    `<!doctype html><html dir="rtl" lang="he"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title></head>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#F5F7FA;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:420px;background:#fff;border:1px solid #E5E7EB;border-radius:16px;padding:36px 32px;text-align:center;box-shadow:0 2px 12px rgba(15,25,41,.06)">
<div style="font-size:40px;margin-bottom:12px">✓</div>
<h1 style="font-size:20px;color:#111827;margin:0 0 10px">${title}</h1>
<p style="font-size:14px;line-height:1.7;color:#6B7280;margin:0">${body}</p>
</div></body></html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params
  if (!/^[a-f0-9]{32}$/.test(token)) {
    return page('הקישור אינו תקין', 'ייתכן שהקישור פג או שגוי. ניתן לפנות ליועץ ישירות.')
  }

  const meeting = await confirmMeetingByToken(token)
  if (!meeting) {
    return page('הקישור אינו תקין', 'ייתכן שהקישור פג או שגוי. ניתן לפנות ליועץ ישירות.')
  }

  const when = new Date(meeting.starts_at).toLocaleString('he-IL', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Jerusalem' })
  // confirmMeetingByToken only stamps confirmed_at on the first call, but the
  // notification must also fire only once — guard on the pre-update value.
  const alreadyConfirmed = Boolean((meeting as { confirmed_at?: string | null }).confirmed_at)
  if (!alreadyConfirmed) {
    await createNotification({
      id: crypto.randomUUID(),
      user_email: meeting.user_email,
      type: 'meeting-confirmed',
      title: 'הלקוח אישר הגעה לפגישה',
      body: `${meeting.client_name || 'הלקוח'} אישר/ה הגעה לפגישה "${meeting.title}" (${when}).`,
      link: '/?tab=meetings',
    })
  }

  return page('ההגעה אושרה — תודה!', `הפגישה "${meeting.title}" במועד ${when} אושרה. נתראה!`)
}
