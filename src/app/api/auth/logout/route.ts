import { NextResponse } from 'next/server'

const authCookieNames = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
  'next-auth.csrf-token',
  '__Host-next-auth.csrf-token',
  'next-auth.callback-url',
  '__Secure-next-auth.callback-url',
]

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login?loggedOut=1', request.url))

  for (const name of authCookieNames) {
    response.cookies.set(name, '', {
      httpOnly: name.includes('session') || name.includes('csrf'),
      secure: name.startsWith('__') || process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    })
  }

  return response
}

export const POST = GET
