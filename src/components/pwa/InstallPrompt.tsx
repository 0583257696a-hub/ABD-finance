'use client'

import { useEffect, useState } from 'react'
import { Download, Share, X } from 'lucide-react'
import { Button, IconButton } from '@/components/ui/Button'

const IOS_DISMISS_KEY = 'abd_pwa_ios_install_dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as { standalone?: boolean }).standalone === true
}

function isIosSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)
  return isIos && isSafari
}

/**
 * Phase 10. Chrome/Edge/Android: capture beforeinstallprompt, show a custom
 * button. iOS Safari has no beforeinstallprompt at all — Apple's own
 * install path is Share → Add to Home Screen, so we can only show
 * instructions, dismissibly, never to a user already running standalone.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIosInstructions, setShowIosInstructions] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true)
      return
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    function onAppInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    if (isIosSafari() && !localStorage.getItem(IOS_DISMISS_KEY)) {
      setShowIosInstructions(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  async function handleInstallClick() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  function dismissIosInstructions() {
    localStorage.setItem(IOS_DISMISS_KEY, '1')
    setShowIosInstructions(false)
  }

  if (installed) return null

  if (deferredPrompt) {
    return (
      <div role="status" style={bannerStyle}>
        <Download size={16} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>התקינו את האפליקציה למחשב או לטלפון לגישה מהירה יותר.</span>
        <Button size="sm" variant="primary" onClick={handleInstallClick}>התקן</Button>
      </div>
    )
  }

  if (showIosInstructions) {
    return (
      <div role="status" style={bannerStyle}>
        <Share size={16} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1 }}>
          להתקנה: הקש על <strong>שיתוף</strong> ואז <strong>הוסף למסך הבית</strong>
        </span>
        <IconButton label="סגור" onClick={dismissIosInstructions}>
          <X size={16} />
        </IconButton>
      </div>
    )
  }

  return null
}

// Sits one banner above ServiceWorkerManager's update banner (bottom: 16) so
// the rare case of both being visible at once doesn't overlap them.
const bannerStyle: React.CSSProperties = {
  position: 'fixed',
  insetInlineStart: 16,
  insetInlineEnd: 16,
  bottom: 'calc(84px + env(safe-area-inset-bottom))',
  zIndex: 2400,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  maxWidth: 480,
  marginInlineStart: 'auto',
  padding: '12px 16px',
  borderRadius: 14,
  background: 'var(--bg-card, #fff)',
  border: '1px solid var(--separator, #E5E7EB)',
  boxShadow: 'var(--shadow-hover, 0 8px 28px rgba(15,25,41,0.12))',
  fontFamily: 'var(--font-main, sans-serif)',
  fontSize: 13.5,
  color: 'var(--text-heading, #111827)',
}
