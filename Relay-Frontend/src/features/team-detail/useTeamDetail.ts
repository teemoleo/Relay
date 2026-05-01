// Supports use team detail
import { useEffect, useState } from 'react'
import type { TeamDetail } from '@/domain'
import { relayService } from '@/services/relayService'

// Prepares team detail
export function useTeamDetail(teamId: string | undefined) {
  const [detail, setDetail] = useState<TeamDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!teamId) return
    const resolvedTeamId = teamId
    let mounted = true

    // Loads team detail data for workforce snapshot
    async function load() {
      try {
        setLoading(true)
        const response = await relayService.getTeamDetail(resolvedTeamId)
        if (!mounted) return
        setDetail(response)
        setError(null)
      } catch (loadError) {
        if (!mounted) return
        setDetail(null)
        setError(loadError instanceof Error ? loadError.message : 'Failed to load team detail')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    return () => {
      mounted = false
    }
  }, [teamId])

  return { detail, error, loading }
}
