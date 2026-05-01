  // Orchestrates baton board decisions by combining role rules, filters, and status updates in one screen
import { useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import {
  canAccessBatonBoard,
  canShowBatonBoardActions,
} from '../../roles'
import { useAuthSession } from '../../app/useAuthSession'
import { ROUTES } from '../../app/routes'
import type { BatonTask } from '../../domain'
import { BatonBoardToolbar } from './BatonBoardToolbar'
import { advanceBatonStatus } from './advanceBatonStatus'
import { BatonColumnBoard } from './BatonColumnBoard'
import { WorkforceSnapshot } from './WorkforceSnapshot'
import { useBatonBoardData } from './useBatonBoardData'
import { shouldShowApproveColumn } from './model/visibility'
import { canShowTaskActions } from './model/policies'

// Centralises board behaviour so every baton status transition uses the same policy checks
export function BatonBoardView() {
  const { user } = useAuthSession()
  const {
    role,
    teamTasks,
    roster,
    error,
    setError,
    projectFilter,
    setProjectFilter,
    ownerFilter,
    setOwnerFilter,
    projectOptions,
    workforce,
    individualLens,
    visibleTasks,
    refresh,
  } = useBatonBoardData(user)

  const hasOwnerFilter = ownerFilter !== null
  const boardViewMode = ownerFilter === null ? 'team' : 'individual'

  // Status changes must update the backend and immediately refresh the board to avoid stale handover state
  async function handleAdvanceStatus(
    task: BatonTask,
    nextStatus: 'in_progress' | 'done' | 'approve_handover' | 'decline_handover',
  ) {
    const sessionUser = user
    if (!sessionUser) return
    try {
      await advanceBatonStatus({
        task,
        nextStatus,
        role,
        userId: sessionUser.user_id,
        ownerFilter,
        roster,
      })
      await refresh()
      setError(null)
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update baton status')
    }
  }

  // Action buttons show only when both board-level and task-level permissions allow them
  const showBoardActionsForTask = (task: BatonTask) =>
    canShowBatonBoardActions(user, task) && canShowTaskActions(user, task)

  // The approval column appears only for contexts where handovers require explicit acceptance
  const showApproveHandoverColumn = useMemo(() => {
    return shouldShowApproveColumn({
      ownerFilter,
      roster,
      role,
      userId: user?.user_id ?? null,
    })
  }, [ownerFilter, roster, role, user?.user_id])

  if (!canAccessBatonBoard(role)) {
    return <Navigate to={ROUTES.resilienceDashboard} replace />
  }

  return (
    <div className="space-y-5">
      <BatonBoardToolbar
        hasOwnerFilter={hasOwnerFilter}
        projectFilter={projectFilter}
        projectOptions={projectOptions}
        onProjectFilterChange={setProjectFilter}
        onBackToTeamView={() => setOwnerFilter(null)}
      />

      <WorkforceSnapshot
        people={workforce}
        selectedOwnerId={ownerFilter}
        onSelectOwner={(ownerId) => setOwnerFilter(ownerId)}
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {!error && teamTasks.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <p className="font-medium">No batons loaded</p>
        </div>
      ) : null}
      <div className="space-y-2 pt-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Baton status</h2>
        <BatonColumnBoard
          tasks={visibleTasks}
          viewMode={boardViewMode}
          showApproveHandoverColumn={showApproveHandoverColumn}
          individualLens={individualLens}
          onAdvanceStatus={handleAdvanceStatus}
          showBoardActions={showBoardActionsForTask}
        />
      </div>
    </div>
  )
}
