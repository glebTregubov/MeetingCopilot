import { useMemo, useState } from 'react'

import type { WsEvent } from '../types/events'

export interface CopilotMessage {
  role: 'user' | 'bot'
  text: string
}

interface UseCopilotResult {
  messages: CopilotMessage[]
  ask: (question: string) => void
  quickQuestions: string[]
}

interface UseCopilotOptions {
  meetingId: string | null
  events: WsEvent[]
  sendEvent: (event: WsEvent) => void
}

export function useCopilot({ meetingId, events, sendEvent }: UseCopilotOptions): UseCopilotResult {
  const [localQuestions, setLocalQuestions] = useState<string[]>([])

  const ask = (question: string) => {
    if (!meetingId || !question.trim()) {
      return
    }

    const normalized = question.trim()
    setLocalQuestions((prev) => [...prev, normalized])
    sendEvent({
      type: 'user.question',
      meeting_id: meetingId,
      payload: { question: normalized },
      timestamp: new Date().toISOString(),
    })
  }

  const messages = useMemo<CopilotMessage[]>(() => {
    const eventMessages: CopilotMessage[] = []

    for (const event of events) {
      if (event.type === 'bot.answer') {
        const answer = String(event.payload?.answer ?? '')
        if (answer) {
          eventMessages.push({ role: 'bot', text: answer })
        }
      }
    }

    const questionMessages: CopilotMessage[] = localQuestions.map((question) => ({
      role: 'user',
      text: question,
    }))

    return [...questionMessages, ...eventMessages]
  }, [events, localQuestions])

  return {
    messages,
    ask,
    quickQuestions: ['What is the current summary?', 'List decisions', 'List action items'],
  }
}
