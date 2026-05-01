// Supports tables on Batons on the Baton Board
import type { ReactNode } from 'react'
import { cn } from './cn'
import { ui } from './styles'

type TableProps = {
  headers: string[]
  children: ReactNode
  className?: string
}

// Defines Table component and renders it
export function Table({ headers, children, className = '' }: TableProps) {
  return (
    <div className={cn('overflow-hidden', ui.card, className)}>
      <table className="min-w-full border-collapse text-sm">
        <thead className={ui.tableHeader}>
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-3 font-semibold sm:px-4">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  )
}
