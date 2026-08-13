'use client'

import { Search, X } from 'lucide-react'

export function SearchField({
  value,
  onChange,
  placeholder = 'חיפוש',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 10px',
        height: 36,
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface-sunken)',
        border: '1px solid var(--separator)',
        minWidth: 200,
      }}
    >
      <Search size={15} color="var(--text-tertiary)" />
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          border: 0,
          background: 'transparent',
          outline: 'none',
          fontFamily: 'var(--font-main)',
          fontSize: 13.5,
          color: 'var(--text-body)',
        }}
      />
      {value && (
        <button
          type="button"
          aria-label="נקה חיפוש"
          onClick={() => onChange('')}
          style={{ border: 0, background: 'transparent', cursor: 'pointer', display: 'flex', color: 'var(--text-tertiary)' }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
