export type WsEventType =
  | 'meeting.started'
  | 'meeting.stopped'
  | 'meeting.state'
  | 'transcript.segment'
  | 'transcript.segments'
  | 'meeting.delta'
  | 'meeting.command'
  | 'user.question'
  | 'bot.answer'
  | 'bot.flag'
  | 'provider.status'
  | 'meeting.connected'

export interface WsEvent<TPayload = Record<string, unknown>> {
  type: WsEventType
  meeting_id: string
  payload?: TPayload
  timestamp?: string
}
