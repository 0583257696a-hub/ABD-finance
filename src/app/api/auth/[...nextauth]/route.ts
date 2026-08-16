import NextAuth from 'next-auth'
import { buildRuntimeAuthOptions } from '@/lib/auth'

/**
 * Built per-request (not at module scope) because the Google provider's
 * credentials come from the Cloudflare env, which isn't available at
 * module-init time in the bundled worker.
 */
async function handler(request: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  const options = await buildRuntimeAuthOptions()
  return NextAuth(options)(request, context)
}

export { handler as GET, handler as POST }
