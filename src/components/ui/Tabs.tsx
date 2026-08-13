'use client'

export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: Array<{ value: T; label: string; count?: number }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 4,
        borderBottom: '1px solid var(--separator)',
      }}
    >
      {items.map(item => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            style={{
              border: 0,
              background: 'transparent',
              padding: '10px 4px',
              marginBottom: -1,
              borderBottom: active ? '2px solid var(--abd-accent)' : '2px solid transparent',
              fontFamily: 'var(--font-main)',
              fontSize: 14.5,
              fontWeight: active ? 700 : 500,
              color: active ? 'var(--abd-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color var(--duration-fast) var(--easing-standard), border-color var(--duration-fast) var(--easing-standard)',
            }}
          >
            {item.label}
            {item.count != null && (
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 999,
                  background: active ? 'var(--abd-accent-light)' : 'var(--bg-surface-sunken)',
                  color: active ? 'var(--abd-accent)' : 'var(--text-tertiary)',
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
