'use client'

type StatusTone = 'success' | 'warning' | 'destructive' | 'neutral' | 'accent'

const toneStyle: Record<StatusTone, { bg: string; text: string }> = {
  success: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
  warning: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
  destructive: { bg: 'var(--destructive-bg)', text: 'var(--destructive-text)' },
  accent: { bg: 'var(--abd-accent-light)', text: 'var(--abd-accent)' },
  neutral: { bg: 'var(--bg-surface-sunken)', text: 'var(--text-muted)' },
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  const { bg, text } = toneStyle[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 999,
        background: bg,
        color: text,
        fontSize: 12.5,
        fontWeight: 700,
        fontFamily: 'var(--font-main)',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
