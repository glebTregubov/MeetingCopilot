import { useCallback, useEffect, useMemo, useState } from 'react'

import { meetingsApi } from '../services/api'
import type { Meeting } from '../types/meeting'

interface UseMeetingStateResult {
  meetings: Meeting[]
  activeMeeting: Meeting | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  startMeeting: (title: string) => Promise<void>
  stopMeeting: (meetingId: string) => Promise<void>
}

export function useMeetingState(): UseMeetingStateResult {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await meetingsApi.list()
      setMeetings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load meetings')
    } finally {
      setLoading(false)
    }
  }, [])

  const startMeeting = useCallback(async (title: string) => {
    await meetingsApi.create({ title })
    await refresh()
  }, [refresh])

  const stopMeeting = useCallback(async (meetingId: string) => {
    await meetingsApi.stop(meetingId)
    await refresh()
  }, [refresh])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const activeMeeting = useMemo(
    () => meetings.find((meeting) => meeting.status === 'active') ?? null,
    [meetings],
  )

  return {
    meetings,
    activeMeeting,
    loading,
    error,
    refresh,
    startMeeting,
    stopMeeting,
  }
}
