import { ROUTES } from './app/routes'
import type { AuthUser, BatonTask, BatonTaskDetail } from './domain'

export type UserRole = 'resilience_manager' | 'team_lead' | 'software_engineer' | 'unknown'

/** Map backend role strings to a small union used for routing and permissions. */
export function normalizeRole(role: string | undefined | null): UserRole {
  const r = (role ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_')
  if (r === 'resilience_manager' || (r.includes('resilience') && r.includes('manager'))) {
    return 'resilience_manager'
  }
  if (r === 'team_lead' || (r.includes('team') && r.includes('lead'))) {
    return 'team_lead'
  }
  if (r === 'software_engineer' || r.includes('software') || r.includes('engineer')) {
    return 'software_engineer'
  }
  return 'unknown'
}

export function postLoginPath(role: UserRole): string {
  return role === 'resilience_manager' ? ROUTES.resilienceDashboard : ROUTES.batons
}

export function canAccessBatonBoard(role: UserRole): boolean {
  return role === 'team_lead' || role === 'software_engineer' || role === 'unknown'
}

export function canAccessResilienceDashboard(role: UserRole): boolean {
  return role === 'resilience_manager' || role === 'team_lead'
}

/** Navbar: same rule as route access for baton board. */
export const showBatonBoardNav = canAccessBatonBoard

/** Navbar: same rule as route access for resilience dashboard. */
export const showResilienceDashboardNav = canAccessResilienceDashboard

function isTeamLeadForTeam(user: AuthUser, teamId: number | null, role: UserRole): boolean {
  return role === 'team_lead' && teamId != null && user.team_id != null && teamId === user.team_id
}

export function canEditBaton(user: AuthUser | null, detail: BatonTaskDetail): boolean {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === 'resilience_manager') return false
  if (isTeamLeadForTeam(user, detail.teamId, role)) return true
  if (role === 'software_engineer') {
    return detail.ownership.ownerId === user.user_id
  }
  return false
}

export function canShowBatonBoardActions(user: AuthUser | null, task: BatonTask): boolean {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === 'resilience_manager') return false
  if (isTeamLeadForTeam(user, task.teamId, role)) return true

  if (role === 'software_engineer' || role === 'unknown') {
    const uid = Number(user.user_id)
    if (Number(task.ownerId) === uid) return true
    if (task.handoverTargetId != null && Number(task.handoverTargetId) === uid) return true
    if (
      task.successorIds?.[0] != null &&
      Number(task.successorIds[0]) === uid &&
      task.ownerInOffice === false
    ) {
      return true
    }
  }
  return false
}

export function isTeamLeadForBaton(user: AuthUser | null, task: { teamId: number | null }): boolean {
  if (!user || task.teamId == null || user.team_id == null) return false
  return normalizeRole(user.role) === 'team_lead' && user.team_id === task.teamId
}

export function canReassignBaton(
  user: AuthUser | null,
  task: { teamId: number | null; ownerId: number },
): boolean {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === 'resilience_manager') return false
  if (isTeamLeadForTeam(user, task.teamId, role)) return true
  if (role === 'software_engineer') {
    return task.ownerId === user.user_id
  }
  return false
}

export function canAdvanceBatonStatus(
  user: AuthUser | null,
  task: {
    ownerId: number
    teamId: number | null
    handoverTargetId?: number | null
    successorIds?: number[]
    ownerInOffice?: boolean
  },
): boolean {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === 'resilience_manager') return false
  if (isTeamLeadForTeam(user, task.teamId, role)) return true
  if (role === 'software_engineer') {
    if (task.ownerId === user.user_id) return true
    if (task.handoverTargetId != null && task.handoverTargetId === user.user_id) return true
    if (task.successorIds?.[0] === user.user_id && task.ownerInOffice === false) {
      return true
    }
  }
  return false
}
