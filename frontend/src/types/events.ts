export type WsEventType =
  | 'meeting.started'
  | 'meeting.stopped'
  | 'transcript.segment'
  | 'meeting.delta'
  | 'user.question'
  | 'bot.answer'
  | 'meeting.connected'

export interface WsEvent<TPayload = Record<string, unknown>> {
  type: WsEventType
  meeting_id: string
  payload?: TPayload
  timestamp?: string
}
