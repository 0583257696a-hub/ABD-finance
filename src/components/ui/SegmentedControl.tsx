'use client'

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex',
        gap: 2,
        padding: 3,
        background: 'var(--bg-surface-sunken)',
        border: '1px solid var(--separator)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      {options.map(option => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            style={{
              border: 0,
              borderRadius: 'var(--radius-sm)',
              padding: '7px 14px',
              fontFamily: 'var(--font-main)',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              background: active ? 'var(--bg-surface)' : 'transparent',
              color: active ? 'var(--abd-primary)' : 'var(--text-muted)',
              boxShadow: active ? 'var(--shadow-1)' : 'none',
              transition: 'background var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard)',
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
