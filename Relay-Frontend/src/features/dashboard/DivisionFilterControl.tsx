// Renders dashboard division controls
import { Select } from '../../components/ui/Select'

type DivisionFilterControlProps = {
  divisionFilterLocked: boolean
  divisionOptions: string[]
  divisionFilter: string
  onDivisionFilterChange: (nextDivision: string) => void
}

// Makes ownership scope explicit, use case: when team leads access resilience dashboard
export function DivisionFilterControl({
  divisionFilterLocked,
  divisionOptions,
  divisionFilter,
  onDivisionFilterChange,
}: DivisionFilterControlProps) {
  if (divisionFilterLocked) {
    return (
      <p className="text-sm font-medium text-slate-800">
        Division: <span className="text-slate-600">{divisionOptions[0] ?? '—'}</span>
      </p>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[180px_auto] sm:items-center">
      <Select
        className="h-8 px-2 py-1 text-xs"
        value={divisionFilter}
        onChange={(event) => onDivisionFilterChange(event.target.value)}
      >
        {divisionOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  )
}
