// Supports policies for baton workflows  
import type { AuthUser, BatonTask } from '@/domain'
import { normalizeRole } from '@/roles'

//Checks if successor eligible for a baton handover
export function isSuccessorEligibleForAccept(userId: number | null, task: BatonTask): boolean {
  if (userId == null) return false
  if (task.handoverTargetId != null && Number(task.handoverTargetId) === Number(userId)) return true
  return task.successorIds[0] != null && Number(task.successorIds[0]) === Number(userId)
}

// Checks whether to show task actions for a baton
export function canShowTaskActions(user: AuthUser | null, task: BatonTask): boolean {
  if (!user) return false
  const role = normalizeRole(user.role)
  if (role === 'resilience_manager') return false
  // Checks if the user is a team lead and if the task is assigned to the team
  if (role === 'team_lead') {
    return task.teamId != null && user.team_id != null && task.teamId === user.team_id
  }
  const uid = Number(user.user_id)
  if (Number(task.ownerId) === uid) return true
  if (task.handoverTargetId != null && Number(task.handoverTargetId) === uid) return true
  if (task.successorIds?.[0] != null && Number(task.successorIds[0]) === uid && task.ownerInOffice === false) {
    return true
  }
  return false
}

