// Renders baton board controls so teams can quickly switch between project-wide and owner-focused views
import { pageBackButtonClass } from '../../components/app-shell/PageBackNav'
import { Select } from '../../components/ui/Select'

type ProjectOption = {
  projectId: number
  label: string
}

type BatonBoardToolbarProps = {
  hasOwnerFilter: boolean
  projectFilter: number | null
  projectOptions: ProjectOption[]
  onProjectFilterChange: (nextProjectId: number | null) => void
  onBackToTeamView: () => void
}

// Keeps filtering actions in one place so board-level decisions stay quick during handovers
export function BatonBoardToolbar({
  hasOwnerFilter,
  projectFilter,
  projectOptions,
  onProjectFilterChange,
  onBackToTeamView,
}: BatonBoardToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Select
        className="h-8 w-full px-2 py-1 text-xs sm:w-[180px]"
        value={projectFilter ?? ''}
        onChange={(event) => onProjectFilterChange(event.target.value ? Number(event.target.value) : null)}
      >
        <option value="">All Projects</option>
        {projectOptions.map((project) => (
          <option key={project.projectId} value={project.projectId}>
            {project.label}
          </option>
        ))}
      </Select>
      {hasOwnerFilter ? (
        <button type="button" className={`${pageBackButtonClass} w-full sm:w-auto`} onClick={onBackToTeamView}>
          Back to Project/Team View
        </button>
      ) : null}
    </div>
  )
}
