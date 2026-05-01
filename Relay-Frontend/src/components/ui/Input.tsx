// Supports input fields on Batons on the Baton Board
import type { InputHTMLAttributes } from 'react'
import { cn } from './cn'
import { ui } from './styles'

type InputProps = InputHTMLAttributes<HTMLInputElement>

// Defines Input component and renders it
export function Input({ className = '', ...props }: InputProps) {
  return <input className={cn('w-full text-slate-800', ui.control, className)} {...props} />
}
