import { createMimeMessage } from 'mimetext'
import { googleAccessToken } from './calendar/adapters/google'

/**
 * Sends an email through the Gmail API from the advisor's own connected
 * Google account — the message genuinely originates from their mailbox
 * (correct SPF/DKIM, appears in their Sent folder, replies thread
 * normally). Requires the gmail.send scope on the calendar connection;
 * accounts connected before that scope was added throw here and the caller
 * falls back to the system mailer.
 */

const GMAIL_SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send'

type GmailSendInput = {
  to: string
  subject: string
  html: string
  text: string
  senderName?: string | null
  senderEmail: string
  attachments?: Array<{ filename: string; contentType: string; base64: string }>
}

/** UTF-8-safe base64url — Gmail's `raw` field format. */
function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sendViaGmail(userEmail: string, input: GmailSendInput): Promise<void> {
  // Throws NOT_CONNECTED / TOKEN_EXPIRED when there's no usable connection —
  // caller treats any throw as "use the fallback path".
  const token = await googleAccessToken(userEmail)

  const mime = createMimeMessage()
  mime.setSender({ name: input.senderName || undefined, addr: input.senderEmail })
  mime.setRecipient(input.to)
  mime.setSubject(input.subject)
  mime.addMessage({ contentType: 'text/plain', data: input.text, charset: 'UTF-8' })
  mime.addMessage({ contentType: 'text/html', data: input.html, charset: 'UTF-8' })
  for (const attachment of input.attachments || []) {
    mime.addAttachment({
      filename: attachment.filename,
      contentType: attachment.contentType,
      data: attachment.base64,
      encoding: 'base64',
    })
  }

  const response = await fetch(GMAIL_SEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: toBase64Url(mime.asRaw()) }),
  })
  if (!response.ok) {
    // 403 = missing gmail.send scope (connection predates it) — reconnect grants it.
    const body = await response.text().catch(() => '')
    throw new Error(`gmail-send-failed ${response.status}: ${body.slice(0, 300)}`)
  }
}
