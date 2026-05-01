// Coordinates dashboard access and filtering
import { Navigate } from 'react-router-dom'
import { canAccessResilienceDashboard, normalizeRole } from '../../roles'
import { useAuthSession } from '../../app/useAuthSession'
import { ROUTES } from '../../app/routes'
import { DivisionFilterControl } from './DivisionFilterControl'
import { DashboardSummaryCards } from './DashboardSummaryCards'
import { TeamsAtRiskTable } from './TeamsAtRiskTable'
import { useDashboardData } from './useDashboardData'

// Enforces role-based dashboard visibility before loading management-level metrics
export function DashboardView() {
  const { user } = useAuthSession()
  const role = normalizeRole(user?.role)
  const lockedDivisionId = role === 'team_lead' ? user?.division_id ?? null : null
  const lockedTeamId =
    role === 'team_lead' && lockedDivisionId == null && user?.team_id != null
      ? String(user.team_id)
      : null

  const {
    loading,
    divisionFilter,
    setDivisionFilter,
    divisionOptions,
    filteredTeams,
    summaryCards,
    divisionFilterLocked,
  } = useDashboardData({ lockedDivisionId, lockedTeamId })

  if (!canAccessResilienceDashboard(role)) {
    return <Navigate to={ROUTES.batons} replace />
  }

  return (
    <div className="space-y-5">
      <DivisionFilterControl
        divisionFilterLocked={divisionFilterLocked}
        divisionOptions={divisionOptions}
        divisionFilter={divisionFilter}
        onDivisionFilterChange={setDivisionFilter}
      />

      {loading ? <p className="text-sm text-slate-500">Loading dashboard data...</p> : null}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Key metrics</h2>
        <div className="mt-3">
          <DashboardSummaryCards summaryCards={summaryCards} />
        </div>
      </div>

      <TeamsAtRiskTable teams={filteredTeams} />
    </div>
  )
}
