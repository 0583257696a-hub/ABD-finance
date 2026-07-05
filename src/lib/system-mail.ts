import { getCloudflareEnv } from './system-db'
import { writeEmailOutbox } from './system-db'

type MailInput = {
  to: string
  subject: string
  html: string
  text: string
}

export async function sendSystemEmail(input: MailInput) {
  const to = String(input.to || '').trim()
  if (!to) return { ok: false, skipped: true, reason: 'missing-recipient' }

  const env = await getCloudflareEnv()
  const from =
    env?.SYSTEM_EMAIL_FROM ||
    env?.EMAIL_FROM ||
    process.env.SYSTEM_EMAIL_FROM ||
    process.env.EMAIL_FROM ||
    'Smart Meeting <noreply@abd-finance.co.il>'

  try {
    const binding = env?.EMAIL || env?.SEND_EMAIL || env?.MAIL || env?.SMART_MEETING_MAIL
    if (!binding?.send) {
      await writeEmailOutbox({ ...input, to, status: 'queued', error: 'Cloudflare Email binding missing' })
      return { ok: false, queued: true, reason: 'missing-cloudflare-email-binding' }
    }

    const response = await binding.send({
      from,
      to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    })
    await writeEmailOutbox({ ...input, to, status: 'sent' })
    return { ok: true, messageId: response?.messageId }
  } catch (error) {
    await writeEmailOutbox({ ...input, to, status: 'error', error: error instanceof Error ? error.message : String(error) })
    return { ok: false, error }
  }
}

export function adminNotificationEmail() {
  return (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    process.env.ADMIN_EMAIL ||
    'admin@abd-finance.co.il'
  )
}

export function registrationThanksEmail(input: { fullName: string }) {
  const name = input.fullName || 'יועץ יקר'
  const subject = 'תודה שנרשמת ל-SMART MEETING BY ABD FINANCE'
  const text = [
    `שלום ${name},`,
    'תודה שנרשמת ל-SMART MEETING BY ABD FINANCE.',
    'הבקשה שלך התקבלה ונמצאת בבדיקת מנהל המערכת.',
    'לאחר אישור החשבון תוכל להתחבר ולהתחיל לעבוד.',
  ].join('\n')

  const html = landingEmailShell({
    eyebrow: 'בקשת ההצטרפות התקבלה',
    title: 'תודה שנרשמת ל-SMART MEETING',
    lead: 'המערכת מרכזת ייבוא נתונים, סימולציות, המלצות וסיכום פגישה בסביבת עבודה אחת.',
    body: `
      <p>שלום ${escapeHtml(name)},</p>
      <p>בקשת ההצטרפות שלך התקבלה בהצלחה ונשלחה לאישור מנהל המערכת.</p>
      <p>לאחר האישור תקבל אפשרות כניסה למערכת ותוכל להתחיל לעבוד עם סביבת הפגישה החכמה.</p>
    `,
  })

  return { subject, text, html }
}

export function adminNewRegistrationEmail(input: {
  fullName: string
  email: string
  phone: string
  userType: string
  planId: string
  adminUrl: string
}) {
  const subject = `הרשמה חדשה ל-Smart Meeting: ${input.fullName}`
  const text = [
    'נרשם לקוח חדש ל-SMART MEETING BY ABD FINANCE.',
    `שם: ${input.fullName}`,
    `אימייל: ${input.email}`,
    `טלפון: ${input.phone}`,
    `סוג משתמש: ${input.userType}`,
    `תוכנית: ${input.planId}`,
    `לאישור המשתמש: ${input.adminUrl}`,
  ].join('\n')

  const html = landingEmailShell({
    eyebrow: 'נדרש אישור מנהל',
    title: 'לקוח חדש נרשם למערכת',
    lead: 'התשלום אינו מעכב את ההרשמה בשלב זה. יש לאשר או לחסום את המשתמש מפאנל האדמין.',
    body: `
      <table role="presentation" style="width:100%;border-collapse:collapse;margin:18px 0;background:#f8fbff;border:1px solid #d7eafb;border-radius:16px;overflow:hidden">
        ${detailRow('שם', input.fullName)}
        ${detailRow('אימייל', input.email)}
        ${detailRow('טלפון', input.phone)}
        ${detailRow('סוג משתמש', input.userType)}
        ${detailRow('תוכנית', input.planId)}
      </table>
      <p style="margin:20px 0 0"><a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:800">כניסה לפאנל אדמין</a></p>
    `,
  })

  return { subject, text, html }
}

export function passwordResetEmail(input: { fullName?: string | null; resetUrl: string }) {
  const name = input.fullName || 'שלום'
  const subject = 'איפוס סיסמה ל-SMART MEETING'
  const text = [
    `שלום ${name},`,
    'התקבלה בקשה לאיפוס הסיסמה שלך.',
    `לאיפוס הסיסמה לחץ על הקישור: ${input.resetUrl}`,
    'הקישור תקף למשך שעה אחת.',
  ].join('\n')

  const html = landingEmailShell({
    eyebrow: 'איפוס סיסמה',
    title: 'קישור מאובטח לאיפוס סיסמה',
    lead: 'הקישור תקף למשך שעה אחת. אם לא ביקשת איפוס סיסמה, ניתן להתעלם מהמייל.',
    body: `
      <p>שלום ${escapeHtml(name)},</p>
      <p>לחץ על הכפתור כדי לבחור סיסמה חדשה למערכת.</p>
      <p style="margin:20px 0 0"><a href="${escapeHtml(input.resetUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:800">איפוס סיסמה</a></p>
    `,
  })

  return { subject, text, html }
}

function landingEmailShell(input: { eyebrow: string; title: string; lead: string; body: string }) {
  return `
  <div dir="rtl" style="margin:0;padding:0;background:#eef6ff;font-family:Heebo,Arial,sans-serif;color:#0f274d">
    <div style="max-width:680px;margin:0 auto;padding:28px 16px">
      <div style="background:#fff;border:1px solid #d7eafb;border-radius:24px;overflow:hidden;box-shadow:0 18px 50px rgba(15,25,41,.12)">
        <div style="padding:34px 34px 22px;background:linear-gradient(135deg,#f8fbff,#eaf4ff)">
          <div style="font-size:13px;font-weight:800;color:#2563eb;background:#eff6ff;display:inline-block;padding:7px 12px;border-radius:999px">${escapeHtml(input.eyebrow)}</div>
          <h1 style="margin:16px 0 10px;font-size:30px;line-height:1.15;color:#1b3a6b">${escapeHtml(input.title)}</h1>
          <p style="margin:0;color:#64748b;font-size:16px;line-height:1.8">${escapeHtml(input.lead)}</p>
        </div>
        <div style="padding:28px 34px;font-size:16px;line-height:1.9">
          ${input.body}
        </div>
        <div style="padding:18px 34px;background:#f8fbff;border-top:1px solid #d7eafb;color:#64748b;font-size:13px">
          SMART MEETING BY ABD FINANCE
        </div>
      </div>
    </div>
  </div>`
}

function detailRow(label: string, value: string) {
  return `<tr><td style="padding:10px 12px;border-bottom:1px solid #d7eafb;color:#64748b;width:34%">${escapeHtml(label)}</td><td style="padding:10px 12px;border-bottom:1px solid #d7eafb;font-weight:800">${escapeHtml(value || '-')}</td></tr>`
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
