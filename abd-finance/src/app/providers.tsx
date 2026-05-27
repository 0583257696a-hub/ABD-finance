'use client'
import { SessionProvider } from 'next-auth/react'
import BrandingProvider from '@/components/layout/BrandingProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BrandingProvider>{children}</BrandingProvider>
    </SessionProvider>
  )
}
