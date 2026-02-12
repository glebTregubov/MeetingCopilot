export type MeetingStatus = 'active' | 'stopped'

export interface Meeting {
  id: string
  title: string
  status: MeetingStatus
  started_at: string
  ended_at: string | null
  created_at: string
  updated_at: string
}

export interface MeetingCreatePayload {
  title: string
}

export interface TranscriptSegment {
  id: string
  meeting_id: string
  speaker: string | null
  text: string
  started_at: string | null
  ended_at: string | null
  created_at: string
}
