import { useEffect } from 'react'

import { Header } from '../layout/Header'
import { CopilotChat } from './CopilotChat'
import { InsightsPanel } from './InsightsPanel'
import { MeetingControls } from './MeetingControls'
import { SummaryPanel } from './SummaryPanel'
import { TranscriptPanel } from './TranscriptPanel'
import { useMeetingState } from '../../hooks/useMeetingState'
import { useAudioCapture } from '../../hooks/useAudioCapture'
import { useCopilot } from '../../hooks/useCopilot'
import { useWebRTC } from '../../hooks/useWebRTC'
import { useWebSocket } from '../../hooks/useWebSocket'
import type { ActionItem, Decision, OpenQuestion, Risk } from '../../types/insights'

export function LiveMeeting() {
  const { meetings, activeMeeting, loading, error, startMeeting, stopMeeting } = useMeetingState()
  const { stream, isCapturing, start: startAudio, stop: stopAudio, error: audioError } = useAudioCapture()
  const { connect: connectRtc, disconnect: disconnectRtc } = useWebRTC()
  const { events, connect: connectWs, disconnect: disconnectWs, send: sendWsEvent } = useWebSocket()

  async function handleStart(title: string) {
    await startMeeting(title)
    await startAudio()
  }

  async function handleStop() {
    if (activeMeeting) {
      await stopMeeting(activeMeeting.id)
    }
    stopAudio()
    disconnectRtc()
    disconnectWs()
  }

  useEffect(() => {
    if (activeMeeting && isCapturing) {
      void connectRtc(stream)
      connectWs(activeMeeting.id)
      return
    }

    disconnectRtc()
    disconnectWs()
  }, [activeMeeting, isCapturing, stream, connectRtc, connectWs, disconnectRtc, disconnectWs])

  const transcriptLines = events
    .filter((event) => event.type === 'transcript.segment')
    .map((event) => String(event.payload?.text ?? ''))
    .filter(Boolean)

  const latestDelta = [...events].reverse().find((event) => event.type === 'meeting.delta')
  const deltaPayload = (latestDelta?.payload ?? {}) as {
    summary?: string
    insights?: {
      decisions?: Decision[]
      actions?: ActionItem[]
      risks?: Risk[]
      open_questions?: OpenQuestion[]
    }
  }

  const summary = deltaPayload.summary ?? ''
  const decisions = deltaPayload.insights?.decisions ?? []
  const actions = deltaPayload.insights?.actions ?? []
  const risks = deltaPayload.insights?.risks ?? []
  const questions = deltaPayload.insights?.open_questions ?? []
  const { messages, ask, quickQuestions } = useCopilot({
    meetingId: activeMeeting?.id ?? null,
    events,
    sendEvent: sendWsEvent,
  })

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Header title="Meeting Copilot" active={Boolean(activeMeeting)} startedAt={activeMeeting?.started_at} />

      <MeetingControls
        hasActiveMeeting={Boolean(activeMeeting)}
        onStart={handleStart}
        onStop={handleStop}
      />

      {audioError && <p className="mt-3 text-sm text-red-600">{audioError}</p>}

      <TranscriptPanel lines={transcriptLines} />
      <SummaryPanel summary={summary} />
      <InsightsPanel decisions={decisions} actions={actions} risks={risks} questions={questions} />
      <CopilotChat disabled={!activeMeeting} messages={messages} quickQuestions={quickQuestions} onAsk={ask} />

      <section className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Meetings</h2>

        {loading && <p className="text-sm text-slate-500">Loading meetings…</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && meetings.length === 0 && (
          <p className="text-sm text-slate-500">No meetings yet. Start one to begin.</p>
        )}

        <ul className="space-y-2">
          {meetings.map((meeting) => (
            <li
              key={meeting.id}
              className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{meeting.title}</p>
                <p className="text-xs text-slate-500">{meeting.id}</p>
              </div>
              <span className="text-xs text-slate-600">{meeting.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
