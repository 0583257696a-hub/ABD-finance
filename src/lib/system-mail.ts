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

export function registrationThanksEmail(input: { fullName: string; loginUrl?: string }) {
  const name = input.fullName || 'יועץ יקר'
  const subject = 'תודה שנרשמת ל-SMART MEETING BY ABD FINANCE'
  const text = [
    `שלום ${name},`,
    'תודה שנרשמת ל-SMART MEETING BY ABD FINANCE.',
    'בקשת ההצטרפות שלך התקבלה בהצלחה ונשלחה לאישור מנהל המערכת.',
    'אישור החשבון מתבצע במהירות. לאחר האישור תישלח אליך הודעת דוא"ל נוספת ותוכל להתחיל להשתמש במערכת.',
    input.loginUrl ? `מעבר למערכת: ${input.loginUrl}` : '',
  ].filter(Boolean).join('\n')

  const html = registrationThanksEmailHtml({ name, loginUrl: input.loginUrl || '#' })

  return { subject, text, html }
}

function registrationThanksEmailHtml(input: { name: string; loginUrl: string }) {
  const name = escapeHtml(input.name)
  const loginUrl = escapeHtml(input.loginUrl)

  const checkItem = (label: string) => `
    <tr>
      <td style="padding:6px 0;font-size:14px;line-height:1.8;color:#1E3A5F">
        <span style="display:inline-block;width:20px;color:#2563EB;font-weight:700">&#10003;</span>${label}
      </td>
    </tr>`

  return `<!doctype html>
<html dir="rtl" lang="he" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${subjectEscaped()}</title>
<!--[if mso]>
<style type="text/css">
  table { border-collapse: collapse; }
  .fallback-font { font-family: Arial, sans-serif !important; }
</style>
<![endif]-->
<style>
  body, table, td { font-family: Arial, Helvetica, sans-serif; }
  @media only screen and (max-width: 600px) {
    .email-container { width: 100% !important; }
    .stack-col { display: block !important; width: 100% !important; padding: 0 0 12px !important; }
    .fluid-padding { padding-left: 20px !important; padding-right: 20px !important; }
  }
  /* Progressive-enhancement motion/shine — ignored gracefully by clients that don't support it (e.g. Outlook desktop), inline styles below already give the correct static look. */
  @media screen {
    .anim-fade { animation: smFadeInUp .6s ease-out both; }
    .anim-fade-delay-1 { animation: smFadeInUp .6s ease-out .1s both; }
    .anim-fade-delay-2 { animation: smFadeInUp .6s ease-out .2s both; }
    .anim-fade-delay-3 { animation: smFadeInUp .6s ease-out .3s both; }
    .shiny-cta { background-size: 220% auto !important; animation: smShine 3s linear infinite; }
    .magic-card { transition: box-shadow .2s ease; }
  }
  @keyframes smFadeInUp {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes smShine {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#EEF6FF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#EEF6FF;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" class="email-container" style="width:600px;max-width:600px;background-color:#FFFFFF;border:1px solid #D6E7FF;border-radius:24px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td class="fluid-padding" style="padding:36px 40px 28px;background-color:#EEF6FF;background-image:linear-gradient(135deg,#EEF6FF,#F8FBFF);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="anim-fade">
              <tr>
                <td valign="top">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#2563EB;background-color:#FFFFFF;border:1px solid #D6E7FF;border-radius:999px;padding:6px 14px;">בקשת ההצטרפות התקבלה</td>
                    </tr>
                  </table>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                    <tr>
                      <td width="48" valign="middle" style="padding-left:12px;">
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="44" height="44" align="center" valign="middle" style="background-color:#FFFFFF;border:2px solid #2563EB;border-radius:50%;font-size:20px;color:#2563EB;font-weight:700;line-height:40px;box-shadow:0 6px 16px rgba(37,99,235,0.18);">&#10003;</td>
                          </tr>
                        </table>
                      </td>
                      <td valign="middle">
                        <div style="font-size:26px;line-height:1.25;font-weight:800;color:#1E3A5F;">תודה שנרשמת ל-Smart Meeting</div>
                      </td>
                    </tr>
                  </table>
                  <div style="margin-top:14px;font-size:15px;line-height:1.8;color:#64748B;">המערכת המתקדמת לניהול פגישות, סימולציות, המלצות וסיכום פגישה בסביבת עבודה אחת.</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Welcome -->
        <tr>
          <td class="fluid-padding" style="padding:32px 40px 8px;">
            <div style="font-size:19px;font-weight:800;color:#1E3A5F;margin:0 0 12px;">שלום ${name},</div>
            <div style="font-size:15px;line-height:1.9;color:#334155;margin:0 0 8px;">בקשת ההצטרפות שלך התקבלה בהצלחה ונשלחה לאישור מנהל המערכת.</div>
            <div style="font-size:15px;line-height:1.9;color:#334155;">אישור החשבון מתבצע במהירות. לאחר האישור תישלח אליך הודעת דוא&quot;ל נוספת ותוכל להתחיל להשתמש במערכת.</div>
          </td>
        </tr>

        <!-- Features -->
        <tr>
          <td class="fluid-padding" style="padding:24px 32px 8px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="stack-col" width="33.33%" style="padding:0 8px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="magic-card anim-fade-delay-1" style="background-color:#F8FBFF;border:1px solid #D6E7FF;border-radius:16px;box-shadow:0 8px 20px rgba(37,99,235,0.08);">
                    <tr><td height="3" style="background-color:#2563EB;background-image:linear-gradient(90deg,#2563EB,#7FB2FF,#2563EB);border-radius:16px 16px 0 0;font-size:0;line-height:3px;">&nbsp;</td></tr>
                    <tr>
                      <td align="center" style="padding:20px 16px 22px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                          <tr><td width="44" height="44" align="center" valign="middle" style="background-color:#EEF6FF;border:1px solid #D6E7FF;border-radius:50%;font-size:20px;line-height:44px;">&#128197;</td></tr>
                        </table>
                        <div style="font-size:15px;font-weight:700;color:#1E3A5F;margin:0 0 6px;">ניהול פגישות חכם</div>
                        <div style="font-size:13px;line-height:1.7;color:#64748B;">תכנון וניהול פגישות בצורה מסודרת ויעילה.</div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td class="stack-col" width="33.33%" style="padding:0 8px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="magic-card anim-fade-delay-2" style="background-color:#F8FBFF;border:1px solid #D6E7FF;border-radius:16px;box-shadow:0 8px 20px rgba(37,99,235,0.08);">
                    <tr><td height="3" style="background-color:#2563EB;background-image:linear-gradient(90deg,#2563EB,#7FB2FF,#2563EB);border-radius:16px 16px 0 0;font-size:0;line-height:3px;">&nbsp;</td></tr>
                    <tr>
                      <td align="center" style="padding:20px 16px 22px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                          <tr><td width="44" height="44" align="center" valign="middle" style="background-color:#EEF6FF;border:1px solid #D6E7FF;border-radius:50%;font-size:20px;line-height:44px;">&#128196;</td></tr>
                        </table>
                        <div style="font-size:15px;font-weight:700;color:#1E3A5F;margin:0 0 6px;">סיכומים והמלצות</div>
                        <div style="font-size:13px;line-height:1.7;color:#64748B;">הפקת סיכומי פגישה והמלצות מקצועיות באופן אוטומטי.</div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td class="stack-col" width="33.33%" style="padding:0 8px 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="magic-card anim-fade-delay-3" style="background-color:#F8FBFF;border:1px solid #D6E7FF;border-radius:16px;box-shadow:0 8px 20px rgba(37,99,235,0.08);">
                    <tr><td height="3" style="background-color:#2563EB;background-image:linear-gradient(90deg,#2563EB,#7FB2FF,#2563EB);border-radius:16px 16px 0 0;font-size:0;line-height:3px;">&nbsp;</td></tr>
                    <tr>
                      <td align="center" style="padding:20px 16px 22px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
                          <tr><td width="44" height="44" align="center" valign="middle" style="background-color:#EEF6FF;border:1px solid #D6E7FF;border-radius:50%;font-size:20px;line-height:44px;">&#128193;</td></tr>
                        </table>
                        <div style="font-size:15px;font-weight:700;color:#1E3A5F;margin:0 0 6px;">סביבת עבודה אחת</div>
                        <div style="font-size:13px;line-height:1.7;color:#64748B;">כל הנתונים, המסמכים והכלים במקום אחד.</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td align="center" class="fluid-padding" style="padding:16px 40px 28px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" bgcolor="#2563EB" class="shiny-cta" style="border-radius:14px;background-color:#2563EB;background-image:linear-gradient(120deg,#1E3A5F 0%,#2563EB 35%,#7FB2FF 50%,#2563EB 65%,#1E3A5F 100%);background-size:220% auto;box-shadow:0 10px 24px rgba(37,99,235,0.28);">
                  <a href="${loginUrl}" target="_blank" style="display:inline-block;padding:16px 40px;font-size:16px;font-weight:800;color:#FFFFFF;text-decoration:none;border-radius:14px;">&#8592;&nbsp;&nbsp;מעבר למערכת</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Info box -->
        <tr>
          <td class="fluid-padding" style="padding:0 40px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="magic-card anim-fade" style="background-color:#EEF6FF;border:1px solid #D6E7FF;border-radius:16px;box-shadow:0 8px 20px rgba(37,99,235,0.06);">
              <tr>
                <td style="padding:22px 24px;">
                  <div style="font-size:15px;font-weight:800;color:#1E3A5F;margin:0 0 10px;">מה קורה עכשיו?</div>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${checkItem('בקשתך התקבלה.')}
                    ${checkItem('מנהל המערכת בודק את ההרשמה.')}
                    ${checkItem('לאחר האישור תישלח הודעה נוספת.')}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="fluid-padding" style="padding:24px 40px 32px;border-top:1px solid #D6E7FF;">
            <div style="text-align:center;font-size:12px;font-weight:700;letter-spacing:.04em;color:#64748B;margin:0 0 6px;">SMART MEETING BY ABD FINANCE</div>
            <div style="text-align:center;font-size:12px;line-height:1.7;color:#94A3B8;margin:0 0 12px;">מערכת חכמה לניהול פגישות בתחום הפיננסי.</div>
            <div style="text-align:center;font-size:12px;color:#94A3B8;">
              <a href="mailto:SUPPORT@ABD-FINANCE.CO.IL" style="color:#64748B;text-decoration:underline;">צור קשר</a>
              &nbsp;&middot;&nbsp;
              <a href="${loginUrl.replace(/\/login.*$/, '')}/privacy" style="color:#64748B;text-decoration:underline;">מדיניות פרטיות</a>
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

function subjectEscaped() {
  return 'תודה שנרשמת ל-Smart Meeting'
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
