import { getCloudflareEnv } from '../system-db'

/**
 * At-rest encryption for CRM credentials (API keys / webhook secrets).
 * AES-256-GCM via WebCrypto (available in Workers and Node ≥ 19). The key is
 * derived (SHA-256) from CRM_ENCRYPTION_KEY, falling back to NEXTAUTH_SECRET
 * so no new secret is strictly required. Stored format: `enc:v1:<iv>:<data>`
 * (base64url). If no key material exists at all (bare local dev) the value
 * is stored as `plain:<value>` — decrypt() handles both, so rotating in a
 * key later is transparent for new writes.
 *
 * Rotating CRM_ENCRYPTION_KEY invalidates existing rows: advisors must
 * re-enter their CRM key (surfaces as an AUTH-style error, not a crash).
 */

async function keyMaterial(): Promise<string | null> {
  const env = await getCloudflareEnv()
  const raw = env?.CRM_ENCRYPTION_KEY || process.env.CRM_ENCRYPTION_KEY || env?.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET || env?.AUTH_SECRET || process.env.AUTH_SECRET
  return raw ? String(raw) : null
}

async function aesKey(): Promise<CryptoKey | null> {
  const material = await keyMaterial()
  if (!material) return null
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material))
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string): Uint8Array {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, char => char.charCodeAt(0))
}

export async function encryptSecret(value: string): Promise<string> {
  const key = await aesKey()
  if (!key) return `plain:${value}`
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(value))
  return `enc:v1:${toBase64Url(iv)}:${toBase64Url(new Uint8Array(cipher))}`
}

export async function decryptSecret(stored: string): Promise<string> {
  if (stored.startsWith('plain:')) return stored.slice(6)
  if (!stored.startsWith('enc:v1:')) return stored
  const [, , ivText, dataText] = stored.split(':')
  const key = await aesKey()
  if (!key) throw new Error('crm-encryption-key-missing')
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64Url(ivText) as BufferSource }, key, fromBase64Url(dataText) as BufferSource)
  return new TextDecoder().decode(plain)
}

/** Encrypts every value of a credential map (keys stay readable for adapters). */
export async function encryptCredentials(credentials: Record<string, string>): Promise<string> {
  const entries = await Promise.all(Object.entries(credentials).map(async ([key, value]) => [key, await encryptSecret(String(value ?? ''))]))
  return JSON.stringify(Object.fromEntries(entries))
}

export async function decryptCredentials(json: string): Promise<Record<string, string>> {
  let parsed: Record<string, string> = {}
  try { parsed = JSON.parse(json || '{}') as Record<string, string> } catch { parsed = {} }
  const entries = await Promise.all(Object.entries(parsed).map(async ([key, value]) => [key, await decryptSecret(String(value ?? ''))]))
  return Object.fromEntries(entries)
}
