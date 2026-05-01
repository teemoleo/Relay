// Supports task detail view
import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageBackNav } from '../../components/app-shell/PageBackNav'
import { ROUTES, type BatonDetailLocationState } from '../../app/routes'
import type { BatonTaskDetail } from '../../domain'
import { TaskDetailMain } from './TaskDetailMain'
import { TaskRiskAnalysis } from './TaskRiskAnalysis'

type TaskDetailViewProps = {
  detail: BatonTaskDetail
  readOnly: boolean
  onEditOverview: () => void
  onEditOwnership: () => void
  onEditDocumentation: () => void
  onEditTechnicalLinks: () => void
  onEditResources: () => void
  onEditReconstructionTime: () => void
  onAddLogEntry: () => void
}

function resolveTeamId(detail: BatonTaskDetail, nav: BatonDetailLocationState | undefined): string | null {
  if (nav?.teamId) return nav.teamId
  return detail.teamId != null ? String(detail.teamId) : null
}

// Handles path
function fallbackPath(detail: BatonTaskDetail, nav: BatonDetailLocationState | undefined): string {
  if (nav?.viaDashboard || nav?.from === 'dashboard') {
    return ROUTES.resilienceDashboard
  }
  if (nav?.from === 'team') {
    const id = resolveTeamId(detail, nav)
    if (id) return ROUTES.teamDetail(id)
  }
  const id = resolveTeamId(detail, nav)
  if (id) return ROUTES.teamDetail(id)
  return ROUTES.batons
}

// Handles detail view rendering
export function TaskDetailView({
  detail,
  readOnly,
  onEditOverview,
  onEditOwnership,
  onEditDocumentation,
  onEditTechnicalLinks,
  onEditResources,
  onEditReconstructionTime,
  onAddLogEntry,
}: TaskDetailViewProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const nav = location.state as BatonDetailLocationState | undefined

  const backTarget = useMemo(() => fallbackPath(detail, nav), [detail, nav])

  // Handles back navigation
  function handleBack() {
    const st: unknown = window.history.state
    const idx =
      typeof st === 'object' && st != null && 'idx' in st && typeof st.idx === 'number'
        ? st.idx
        : undefined
    if (typeof idx === 'number' && idx > 0) {
      void navigate(-1)
      return
    }
    void navigate(backTarget)
  }

  return (
    <div className="space-y-6">
      <PageBackNav onClick={handleBack}>Back</PageBackNav>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr] xl:gap-8">
        <TaskDetailMain
          detail={detail}
          readOnly={readOnly}
          onEditOverview={onEditOverview}
          onEditOwnership={onEditOwnership}
          onEditDocumentation={onEditDocumentation}
          onEditTechnicalLinks={onEditTechnicalLinks}
          onEditResources={onEditResources}
          onEditReconstructionTime={onEditReconstructionTime}
          onAddLogEntry={onAddLogEntry}
        />
        <TaskRiskAnalysis riskAnalysis={detail.riskAnalysis} />
      </div>
    </div>
  )
}
