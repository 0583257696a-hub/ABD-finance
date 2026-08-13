'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type ToastTone = 'success' | 'error' | 'info'
type ToastItem = { id: number; message: string; tone: ToastTone }

const ToastContext = createContext<{ show: (message: string, tone?: ToastTone) => void } | null>(null)

const toneIcon: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 size={17} color="var(--success)" />,
  error: <AlertTriangle size={17} color="var(--destructive)" />,
  info: <Info size={17} color="var(--abd-accent)" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = nextId.current++
    setToasts(current => [...current, { id, message, tone }])
    window.setTimeout(() => {
      setToasts(current => current.filter(item => item.id !== id))
    }, 3600)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          insetInlineStart: 20,
          zIndex: 1400,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <style>{'@keyframes ui-toast-in { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }'}</style>
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="status"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 240,
              maxWidth: 360,
              padding: '11px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--separator-strong)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-floating)',
              animation: 'ui-toast-in var(--duration-base) var(--easing-standard) both',
            }}
          >
            {toneIcon[toast.tone]}
            <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: 'var(--text-heading)' }}>{toast.message}</span>
            <button
              type="button"
              aria-label="סגירה"
              onClick={() => setToasts(current => current.filter(item => item.id !== toast.id))}
              style={{ border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', color: 'var(--text-tertiary)' }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.show
}
