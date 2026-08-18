import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import LegalFooter from '@/components/layout/LegalFooter'
import CookieConsent from '@/components/layout/CookieConsent'
import AccessibilityMenu from '@/components/layout/AccessibilityMenu'
import ServiceWorkerManager from '@/components/pwa/ServiceWorkerManager'
import InstallPrompt from '@/components/pwa/InstallPrompt'
import ClientDataGuard from '@/components/security/ClientDataGuard'
import SessionGuard from '@/components/security/SessionGuard'

export const metadata: Metadata = {
  title: 'פגישה חכמה - ABD Finance',
  description: 'מערכת SaaS מקצועית לניהול פגישות פרישה ופיננסים',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Smart Meeting',
  },
  icons: {
    // Brand favicon (generated from public/icons/icon-512.png) — replaces the framework default.
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/favicon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/favicon-16.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
  other: {
    // Next's appleWebApp only emits the modern `mobile-web-app-capable` —
    // older iOS still needs the Apple-prefixed form too.
    'apple-mobile-web-app-capable': 'yes',
  },
}

export const viewport: Viewport = {
  themeColor: '#0B1F3F',
  viewportFit: 'cover',
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
          <ServiceWorkerManager />
          <InstallPrompt />
          <ClientDataGuard />
          <SessionGuard />
        </Providers>
      </body>
    </html>
  )
}
