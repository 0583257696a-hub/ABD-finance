import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import LegalFooter from '@/components/layout/LegalFooter'
import CookieConsent from '@/components/layout/CookieConsent'
import AccessibilityMenu from '@/components/layout/AccessibilityMenu'

export const metadata: Metadata = {
  title: 'פגישה חכמה - ABD Finance',
  description: 'מערכת SaaS מקצועית לניהול פגישות פרישה ופיננסים',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <Providers>
          <a href="#main-content" className="skip-link">דלג לתוכן המרכזי</a>
          <div id="main-content">
            {children}
          </div>
          <LegalFooter />
          <CookieConsent />
          <AccessibilityMenu />
        </Providers>
      </body>
    </html>
  )
}
