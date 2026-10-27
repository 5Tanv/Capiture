import type { ReactNode } from 'react'

interface ProgressBarProps {
  value: number
  max: number
  /** Tailwind classes for the fill color. */
  fill: string
  className?: string
  label: string
  children?: ReactNode
}

export function ProgressBar({ value, max, fill, className = 'h-4', label, children }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className={`bar-track ${className}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      <div className={`bar-fill ${fill}`} style={{ width: `${pct}%` }} />
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  )
}
