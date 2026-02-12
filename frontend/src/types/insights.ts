export interface Decision {
  id: string
  meeting_id: string
  content: string
  created_at: string
}

export interface ActionItem {
  id: string
  meeting_id: string
  content: string
  owner?: string | null
  due_date?: string | null
  created_at: string
}

export interface Risk {
  id: string
  meeting_id: string
  content: string
  created_at: string
}

export interface OpenQuestion {
  id: string
  meeting_id: string
  content: string
  created_at: string
}
