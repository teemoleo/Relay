// Supports select fields on Batons on the Baton Board
import type { SelectHTMLAttributes } from 'react'
import { cn } from './cn'
import { ui } from './styles'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

// Defines Select component and renders it
export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select className={cn(ui.control, className)} {...props}>
      {children}
    </select>
  )
}
