'use client'

import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive'
type ButtonSize = 'sm' | 'md' | 'lg'

const sizeStyle: Record<ButtonSize, CSSProperties> = {
  // 36px: still compact, but a real touch target (QA P3-3; WCAG 2.5.8 minimum is 24, 44 recommended for primary actions).
  // Spec update (Oct 2026): 6px corners, lower height, 1px bottom shadow — no cushion look.
  sm: { minHeight: 32, padding: '0 12px', fontSize: 13, gap: 6, borderRadius: 'var(--radius-xs)' },
  md: { minHeight: 36, padding: '0 14px', fontSize: 13.5, gap: 8, borderRadius: 'var(--radius-xs)' },
  lg: { minHeight: 42, padding: '0 18px', fontSize: 14.5, gap: 8, borderRadius: 'var(--radius-xs)' },
}

function variantStyle(variant: ButtonVariant): CSSProperties {
  switch (variant) {
    // Primary is INK, not the brand green — the green marks only the active step,
    // selection, and the client document's branding (spec update, Oct 2026).
    case 'primary':
      return { background: 'var(--btn-primary-bg, #1C1D1F)', color: 'var(--btn-primary-text, #fff)', border: '1px solid transparent', boxShadow: '0 1px 0 rgba(23,24,26,0.22)' }
    case 'secondary':
      return { background: 'var(--bg-surface)', color: 'var(--text-heading)', border: '1px solid var(--separator-strong)', boxShadow: '0 1px 0 rgba(23,24,26,0.06)' }
    case 'destructive':
      return { background: 'var(--destructive-bg)', color: 'var(--destructive-text)', border: '1px solid transparent', boxShadow: '0 1px 0 rgba(23,24,26,0.08)' }
    case 'ghost':
    default:
      return { background: 'transparent', color: 'var(--text-heading)', border: '1px solid transparent' }
  }
}

export const Button = forwardRef<HTMLButtonElement, {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  style?: CSSProperties
} & ButtonHTMLAttributes<HTMLButtonElement>>(function Button(
  { children, variant = 'secondary', size = 'md', fullWidth = false, style, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-main)',
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? '100%' : undefined,
        transition: 'background var(--duration-fast) var(--easing-standard), transform var(--duration-fast) var(--easing-standard), box-shadow var(--duration-fast) var(--easing-standard)',
        ...sizeStyle[size],
        ...variantStyle(variant),
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
})

export const IconButton = forwardRef<HTMLButtonElement, {
  children: ReactNode
  label: string
  size?: number
  active?: boolean
  style?: CSSProperties
} & ButtonHTMLAttributes<HTMLButtonElement>>(function IconButton(
  { children, label, size = 36, active = false, style, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        border: 0,
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--abd-accent-light)' : 'transparent',
        color: active ? 'var(--abd-accent)' : 'var(--text-body)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background var(--duration-fast) var(--easing-standard), color var(--duration-fast) var(--easing-standard)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  )
})
