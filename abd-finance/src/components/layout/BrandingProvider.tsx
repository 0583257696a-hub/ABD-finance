'use client'

import { useEffect } from 'react'
import { applyBrandingSettings, BRANDING_EVENT, readBrandingSettings } from '@/lib/branding'

export default function BrandingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyBrandingSettings(readBrandingSettings())

    function refresh(event?: Event) {
      const settings = event instanceof CustomEvent && event.detail ? event.detail : readBrandingSettings()
      applyBrandingSettings(settings)
    }

    function onStorage(event: StorageEvent) {
      if (event.key === 'abd_user_settings') refresh()
    }

    window.addEventListener(BRANDING_EVENT, refresh)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(BRANDING_EVENT, refresh)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return <>{children}</>
}
