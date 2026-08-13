'use client'
import { SessionProvider } from 'next-auth/react'
import BrandingProvider from '@/components/layout/BrandingProvider'
import { ToastProvider } from '@/components/ui/Toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <BrandingProvider>
        <ToastProvider>{children}</ToastProvider>
      </BrandingProvider>
    </SessionProvider>
  )
}
