'use client'

/** Contextual loading — always pair with a message describing what's happening, never a bare spinner. */
export function LoadingState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '40px 24px',
        color: 'var(--text-muted)',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: '2.5px solid var(--separator-strong)',
          borderTopColor: 'var(--abd-accent)',
          animation: 'ui-spin .7s linear infinite',
        }}
      />
      <style>{'@keyframes ui-spin { to { transform: rotate(360deg) } }'}</style>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{message}</span>
    </div>
  )
}

export function StepProgress({ steps }: { steps: Array<{ label: string; state: 'done' | 'active' | 'pending' }> }) {
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {steps.map(step => (
        <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
          <span
            aria-hidden
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              background: step.state === 'done' ? 'var(--success)' : step.state === 'active' ? 'var(--abd-accent)' : 'var(--bg-surface-sunken)',
              color: step.state === 'pending' ? 'var(--text-tertiary)' : '#fff',
            }}
          >
            {step.state === 'done' ? '✓' : step.state === 'active' ? '●' : '○'}
          </span>
          <span style={{ color: step.state === 'pending' ? 'var(--text-muted)' : 'var(--text-heading)', fontWeight: step.state === 'active' ? 700 : 500 }}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}
