// Supports team batons table
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ROUTES, type TeamDetailLocationState } from '../../app/routes'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { ui } from '../../components/ui/styles'
import type { TeamDetail } from '../../domain'
import type { RiskTone } from '../../domain'

type Key = 'id' | 'title' | 'owner' | 'successor' | 'state' | 'risk' | 'docs'
const cols: { key: Key; label: string }[] = [
  { key: 'id', label: 'Baton ID' },
  { key: 'title', label: 'Title' },
  { key: 'owner', label: 'Owner' },
  { key: 'successor', label: 'Successor' },
  { key: 'state', label: 'State' },
  { key: 'risk', label: 'Risk' },
  { key: 'docs', label: 'Docs' },
]

const cell = 'px-3 py-3.5 text-sm text-slate-600 sm:px-4'

function riskTone(risk: string): RiskTone {
  if (risk === 'Low Risk') return 'green'
  if (risk === 'Medium Risk') return 'yellow'
  return 'red'
}

type TeamBatonsTableProps = {
  batons: TeamDetail['batons']
  teamId: string
  preselectedStaff?: string
  onStaffFilterChange?: (owner: string) => void
}

// Handles batons table
export function TeamBatonsTable({ batons, teamId, preselectedStaff = '', onStaffFilterChange }: TeamBatonsTableProps) {
  const location = useLocation()
  const teamNav = location.state as TeamDetailLocationState | undefined
  const viaDashboard = teamNav?.from === 'dashboard'

  const [riskFilter, setRiskFilter] = useState('')
  const [staffFilter, setStaffFilter] = useState('')
  const [sort, setSort] = useState<{ key: Key; dir: 1 | -1 } | null>(null)
  const [search, setSearch] = useState<Record<Key, string>>(
    Object.fromEntries(cols.map((c) => [c.key, ''])) as Record<Key, string>,
  )

  useEffect(() => {
    setStaffFilter(preselectedStaff)
  }, [preselectedStaff])

  // Handles options for risk
  const riskOptions = useMemo(() => {
    const unique = [...new Set(batons.map((b) => b.risk))].sort()
    return unique
  }, [batons])

  // Handles options for staff
  const staffOptions = useMemo(() => {
    const unique = [...new Set(batons.map((b) => b.owner))].sort((a, b) => a.localeCompare(b))
    return unique
  }, [batons])

  // Handles filtered + sorted batons
  const filteredBatons = useMemo(() => {
    const filtered = batons.filter((baton) => {
      if (riskFilter && baton.risk !== riskFilter) return false
      if (staffFilter && baton.owner !== staffFilter) return false
      return cols.every(
        (c) =>
          !search[c.key] ||
          String(baton[c.key]).toLowerCase().includes(search[c.key].trim().toLowerCase()),
      )
    })
    return sort
      ? [...filtered].sort(
          (a, b) =>
            sort.dir *
            String(a[sort.key]).localeCompare(String(b[sort.key]), undefined, { numeric: true }),
        )
      : filtered
  }, [batons, riskFilter, staffFilter, search, sort])

  const toggleSort = (key: Key) =>
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null))

  const linkState = { from: 'team' as const, teamId, ...(viaDashboard ? { viaDashboard: true as const } : {}) }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Batons</h2>
        <p className="mt-0.5 text-xs text-slate-500">Team batons and handover status</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Select
            className="h-9 border-slate-200 bg-white text-sm"
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
          >
            <option value="">Risk: All</option>
            {riskOptions.map((risk) => (
              <option key={risk} value={risk}>
                {risk}
              </option>
            ))}
          </Select>
          <Select
            className="h-9 border-slate-200 bg-white text-sm"
            value={staffFilter}
            onChange={(event) => {
              const next = event.target.value
              setStaffFilter(next)
              onStaffFilterChange?.(next)
            }}
          >
            <option value="">Staff: All</option>
            {staffOptions.map((owner) => (
              <option key={owner} value={owner}>
                {owner}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className={ui.tableHeader}>
            <tr>
              {cols.map((c) => (
                <th
                  key={c.key}
                  className="cursor-pointer select-none px-3 py-3 font-semibold sm:px-4"
                  onClick={() => toggleSort(c.key)}
                >
                  {c.label}
                  {sort?.key === c.key ? (sort.dir === 1 ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
            <tr>
              {cols.map((c) => (
                <th key={c.key} className="px-2 pb-2 sm:px-3">
                  <input
                    className="w-full rounded border border-slate-200 px-2 py-1 text-xs font-normal normal-case tracking-normal text-slate-700 outline-none focus:border-blue-500"
                    value={search[c.key]}
                    onChange={(e) => setSearch((s) => ({ ...s, [c.key]: e.target.value }))}
                    placeholder="Search"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredBatons.map((baton) => (
              <tr key={baton.id} className="transition-colors hover:bg-slate-50/90">
                <td className={cell}>
                  <Link
                    to={ROUTES.batonDetail(baton.taskId)}
                    state={linkState}
                    className="text-sm text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-800"
                  >
                    {baton.id}
                  </Link>
                </td>
                <td className={cell}>{baton.title}</td>
                <td className={cell}>
                  <span>{baton.owner}</span>
                  <Badge
                    tone={baton.ownerStatus === 'Active' ? 'green' : 'red'}
                    label={baton.ownerStatus === 'Active' ? 'In office' : 'Out of office'}
                    className="ml-2 text-[11px] font-semibold"
                  />
                </td>
                <td className={cell}>{baton.successor}</td>
                <td className={cell}>{baton.state}</td>
                <td className={cell}>
                  <Badge
                    tone={riskTone(baton.risk)}
                    label={baton.risk}
                    className="text-[11px] font-semibold"
                  />
                </td>
                <td className={cell}>
                  <Badge
                    tone={baton.docs === 'Complete' ? 'green' : baton.docs === 'Partial' ? 'yellow' : 'red'}
                    label={baton.docs}
                    className="text-[11px] font-semibold"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
