// Supports constants for baton workflows
import type { BatonTask } from '../../domain'

export const INDIVIDUAL_BATON_COLUMNS = [
  'Approve handover',
  'Waiting to Be Accepted',
  'Enrich Baton',
  'In Progress',
  'Awaiting Handover',
  'Done',
] as const

export const TEAM_BOARD_COLUMNS = [
  'Approve handover',
  'Awaiting Handover',
  'Enrich Baton',
  'In Progress',
  'Done',
] as const

export type IndividualBatonColumn = (typeof INDIVIDUAL_BATON_COLUMNS)[number]
export type TeamBoardColumn = (typeof TEAM_BOARD_COLUMNS)[number]
export type BatonColumn = IndividualBatonColumn | TeamBoardColumn

export type BoardViewMode = 'team' | 'individual'

// Checks if successor linked handover task
export function isSuccessorLinkedHandoverTask(task: BatonTask, personId: number): boolean {
  return (
    (task.workflowStatus === 'Awaiting Handover' || task.status === 'Waiting to Be Accepted') &&
    (task.handoverTargetId === personId || task.successorIds.some((id) => id === personId))
  )
}

// Handles key for board view
export function columnKeyForBoardView(
  taskStatus: string,
  viewMode: BoardViewMode,
): BatonColumn {
  // Checks if the view mode is team
  if (viewMode === 'team') {
    // Checks if the task status is approve handover
    if (taskStatus === 'Approve handover') {
      return 'Approve handover'
    }
    // Checks if the task status is waiting to be accepted or awaiting handover
    if (taskStatus === 'Waiting to Be Accepted' || taskStatus === 'Awaiting Handover') {
      return 'Awaiting Handover'
    }
    if ((TEAM_BOARD_COLUMNS as readonly string[]).includes(taskStatus)) {
      return taskStatus as TeamBoardColumn
    }
    return 'Awaiting Handover'
  }
  if ((INDIVIDUAL_BATON_COLUMNS as readonly string[]).includes(taskStatus)) {
    return taskStatus as IndividualBatonColumn
  }
  return 'Waiting to Be Accepted'
}

export type IndividualBoardLens = {
  filterPersonId: number
  filterPersonInOffice: boolean
}
// Handles key for individual view
export function columnKeyForIndividualLens(task: BatonTask, lens: IndividualBoardLens): BatonColumn {
  const { filterPersonId, filterPersonInOffice } = lens

  // Checks if the person is not in office and the task is assigned to the person
  if (!filterPersonInOffice && task.ownerId === filterPersonId) {
    const s = task.status
    if (s === 'Waiting to Be Accepted') return 'Awaiting Handover'
    return columnKeyForBoardView(s, 'individual')
  }

  if (isSuccessorLinkedHandoverTask(task, filterPersonId)) {
    return 'Waiting to Be Accepted'
  }

  return columnKeyForBoardView(task.status, 'individual')
}
