// Applies baton status transitions so handover actions consistently follow role and successor rules
import { normalizeRole, type UserRole } from '@/roles'
import { relayService } from '@/services/relayService'
import type { BatonTask, TeamRosterMember } from '@/domain'
import { BATON_STATUS } from './batonStatus'
import { isAwaitingAcceptFlow } from './model/status'

type AdvanceStatusAction = 'in_progress' | 'done' | 'approve_handover' | 'decline_handover'

type AdvanceStatusArgs = {
  task: BatonTask
  nextStatus: AdvanceStatusAction
  role: UserRole
  userId: number
  ownerFilter: number | null
  roster: TeamRosterMember[]
}

// Moves baton status
export async function advanceBatonStatus({
  task,
  nextStatus,
  role,
  userId,
  ownerFilter,
  roster,
}: AdvanceStatusArgs): Promise<void> {
  // Updates baton status to done
  if (nextStatus === 'done') {
    await relayService.updateBaton(task.id, { baton_status: BATON_STATUS.DONE })
    return
  }

  // Updates baton status to awaiting handover
  if (nextStatus === 'approve_handover') {
    // Team lead approval releases the baton to the next in-office successor
    const approvableSuccessorId = task.handoverTargetId ?? task.successorIds[0] ?? null
    // Checks if the user is a team lead and if the successor is available
    if (role !== 'team_lead' || approvableSuccessorId == null) {
      throw new Error('Only team leads can approve handover when a successor is available.')
    }
    await relayService.updateBaton(task.id, { baton_status: BATON_STATUS.AWAITING_HANDOVER })
    return
  }

  // Updates baton status to decline handover
  if (nextStatus === 'decline_handover') {
    // Decline flow rotates to remaining successors or escalates ownership to team lead
    const decliningId = userId
    const actingAsSuccessorOnAwaiting =
      !task.ownerInOffice &&
      (task.workflowStatus === 'Awaiting Handover' || task.workflowStatus === 'Waiting to Be Accepted') &&
      ((task.handoverTargetId != null && Number(task.handoverTargetId) === Number(decliningId)) ||
        (task.successorIds[0] != null && Number(task.successorIds[0]) === Number(decliningId)))
    const isAwaitingFlow =
      task.workflowStatus === 'Awaiting Handover' || task.workflowStatus === 'Waiting to Be Accepted'

    // Updates baton status to in progress
    if (role === 'team_lead' && !actingAsSuccessorOnAwaiting && !isAwaitingFlow) {
      await relayService.updateBaton(task.id, { baton_status: BATON_STATUS.IN_PROGRESS })
      return
    }

    if (
      role === 'software_engineer' ||
      role === 'unknown' ||
      (role === 'team_lead' && (actingAsSuccessorOnAwaiting || isAwaitingFlow))
    ) {
      const declinedSuccessorId =
        role === 'team_lead' && isAwaitingFlow && !actingAsSuccessorOnAwaiting
          ? (task.handoverTargetId ?? task.successorIds[0] ?? null)
          : decliningId
      const remainingSuccessors = task.successorIds.filter(
        (id) => (declinedSuccessorId != null ? Number(id) !== Number(declinedSuccessorId) : true),
      )

      let nextInOfficeSuccessorId: number | null = null
      // Finds the next in-office successor
      for (const successorId of remainingSuccessors) {
        try {
          const person = await relayService.getPerson(successorId)
          // Checks if the successor is in office
          if (person.in_office !== false) {
            nextInOfficeSuccessorId = successorId
            break
          }
        } catch {
          continue
        }
      }

      // Updates baton status to handover pending approval
      if (nextInOfficeSuccessorId != null) {
        const reordered = [
          nextInOfficeSuccessorId,
          ...remainingSuccessors.filter((id) => id !== nextInOfficeSuccessorId),
        ]
        await relayService.updateBaton(task.id, {
          successor_ids: reordered,
          baton_status: BATON_STATUS.HANDOVER_PENDING_APPROVAL,
        })
        return
      }

      const manager = roster.find((member) => normalizeRole(member.role) === 'team_lead')
      // Checks if a team lead is found to receive declined handover
      if (!manager) {
        throw new Error('No team lead found to receive declined handover.')
      }
      const escalatedSuccessors = remainingSuccessors.filter((id) => Number(id) !== Number(manager.id))
      await relayService.updateBaton(task.id, {
        owner_id: manager.id,
        successor_ids: escalatedSuccessors,
        baton_status: BATON_STATUS.ENRICH_TICKET,
      })
      return
    }

    throw new Error('You cannot decline this handover.')
  }

  const acceptingSuccessorId = task.handoverTargetId ?? task.successorIds[0] ?? null
  if (isAwaitingAcceptFlow(task)) {
    // Accept flow transfers ownership and keeps successor chain intact
    if (acceptingSuccessorId == null) {
      throw new Error('No successor available to accept this handover.')
    }
    const remainingSuccessors = task.successorIds.filter((id) => Number(id) !== Number(acceptingSuccessorId))
    await relayService.updateBaton(task.id, {
      owner_id: acceptingSuccessorId,
      successor_ids: remainingSuccessors,
      baton_status: remainingSuccessors.length === 0 ? BATON_STATUS.ENRICH_TICKET : BATON_STATUS.IN_PROGRESS,
    })
    return
  }

  const leadActingForSuccessor =
    role === 'team_lead' &&
    ownerFilter != null &&
    !task.ownerInOffice &&
    (task.handoverTargetId != null
      ? Number(task.handoverTargetId) === Number(ownerFilter)
      : task.successorIds[0] != null && Number(task.successorIds[0]) === Number(ownerFilter))
  const newOwnerId = leadActingForSuccessor ? ownerFilter : userId
  const newSuccessors = task.successorIds.filter((id) => Number(id) !== Number(newOwnerId))
  await relayService.updateBaton(task.id, {
    owner_id: newOwnerId,
    successor_ids: newSuccessors,
    baton_status: newSuccessors.length === 0 ? BATON_STATUS.ENRICH_TICKET : BATON_STATUS.IN_PROGRESS,
  })
}
