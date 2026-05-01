// Centralises metric card styling
import { cn } from '../../components/ui/cn'
import type { InsightVariant } from './types'

const ringByVariant: Record<InsightVariant, string> = {
  success: 'ring-emerald-100/90',
  warning: 'ring-amber-100/90',
  danger: 'ring-rose-100/90',
  neutral: 'ring-slate-200/80',
}

// Each severity maps to a stable ring color
export function insightCardFrameClassName(variant: InsightVariant, className?: string) {
  return cn(
    'flex gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-inset',
    ringByVariant[variant],
    className,
  )
}
