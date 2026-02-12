import { useEffect, useRef, useState } from 'react'

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
import { providersApi, sttApi } from '../../services/api'
import type { ActionItem, Decision, OpenQuestion, Risk } from '../../types/insights'

export function LiveMeeting() {
  const { meetings, activeMeeting, loading, error, startMeeting, stopMeeting } = useMeetingState()
  const { stream, isCapturing, start: startAudio, stop: stopAudio, error: audioError } = useAudioCapture()
  const { connect: connectRtc, disconnect: disconnectRtc } = useWebRTC()
  const { events, connect: connectWs, disconnect: disconnectWs, send: sendWsEvent } = useWebSocket()
  const [sttProvider, setSttProvider] = useState<'openai' | 'elevenlabs'>('openai')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunkUploadInFlightRef = useRef(false)

  useEffect(() => {
    const loadProvider = async () => {
      try {
        const result = await providersApi.getStt()
        if (result.active === 'elevenlabs' || result.active === 'openai') {
          setSttProvider(result.active)
        }
      } catch {
        setSttProvider('openai')
      }
    }

    void loadProvider()
  }, [])

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
    if (activeMeeting && isCapturing && sttProvider === 'openai') {
      void connectRtc(stream)
    } else {
      disconnectRtc()
    }

    if (activeMeeting && isCapturing) {
      connectWs(activeMeeting.id)
      return
    }

    disconnectWs()
  }, [
    activeMeeting,
    isCapturing,
    stream,
    sttProvider,
    connectRtc,
    connectWs,
    disconnectRtc,
    disconnectWs,
  ])

  useEffect(() => {
    const stopRecorder = () => {
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.stop()
      }
      recorderRef.current = null
    }

    if (!activeMeeting || !isCapturing || !stream || sttProvider !== 'elevenlabs') {
      stopRecorder()
      return
    }

    if (typeof MediaRecorder === 'undefined') {
      return
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = (event: BlobEvent) => {
      if (!event.data || event.data.size === 0 || chunkUploadInFlightRef.current) {
        return
      }

      chunkUploadInFlightRef.current = true
      void (async () => {
        try {
          const arrayBuffer = await event.data.arrayBuffer()
          const bytes = new Uint8Array(arrayBuffer)
          let binary = ''
          for (let index = 0; index < bytes.length; index += 1) {
            binary += String.fromCharCode(bytes[index])
          }
          const audioBase64 = btoa(binary)

          const result = await sttApi.transcribeElevenlabsChunk(audioBase64, mimeType)
          const text = result.text.trim()
          if (!text) {
            return
          }

          sendWsEvent({
            type: 'transcript.segment',
            meeting_id: activeMeeting.id,
            payload: {
              text,
              speaker: 'Attendee',
            },
            timestamp: new Date().toISOString(),
          })
        } catch {
          // ignore chunk-level errors to keep stream alive
        } finally {
          chunkUploadInFlightRef.current = false
        }
      })()
    }

    recorder.start(2500)

    return () => {
      stopRecorder()
    }
  }, [activeMeeting, isCapturing, stream, sttProvider, sendWsEvent])

  const transcriptLines = events
    .filter((event) => event.type === 'transcript.segment')
    .map((event, index) => {
      const payload = (event.payload ?? {}) as { text?: string; speaker?: string }
      const text = String(payload.text ?? '').trim()
      const speaker = String(payload.speaker ?? 'Attendee').trim() || 'Attendee'
      return {
        id: `${index}-${event.timestamp ?? 'no-ts'}-${text}`,
        speaker,
        text,
        timestamp: event.timestamp,
      }
    })
    .filter((item) => item.text)

  const latestState = [...events].reverse().find((event) => event.type === 'meeting.state')
  const statePayload = (latestState?.payload ?? {}) as {
    transcript_lines?: string[]
    summary?: string
    insights?: {
      decisions?: Decision[]
      actions?: ActionItem[]
      risks?: Risk[]
      open_questions?: OpenQuestion[]
    }
  }

  const transcriptFromState = (statePayload.transcript_lines ?? []).map((line, index) => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex > 0) {
      const speaker = line.slice(0, separatorIndex).trim()
      const text = line.slice(separatorIndex + 1).trim()
      return {
        id: `state-${index}-${line}`,
        speaker: speaker || 'Attendee',
        text,
        timestamp: undefined,
      }
    }

    return {
      id: `state-${index}-${line}`,
      speaker: 'Attendee',
      text: line,
      timestamp: undefined,
    }
  })

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

  const summary = deltaPayload.summary ?? statePayload.summary ?? ''
  const decisions = deltaPayload.insights?.decisions ?? statePayload.insights?.decisions ?? []
  const actions = deltaPayload.insights?.actions ?? statePayload.insights?.actions ?? []
  const risks = deltaPayload.insights?.risks ?? statePayload.insights?.risks ?? []
  const questions = deltaPayload.insights?.open_questions ?? statePayload.insights?.open_questions ?? []
  const { messages, ask, quickQuestions } = useCopilot({
    meetingId: activeMeeting?.id ?? null,
    events,
    sendEvent: sendWsEvent,
  })

  return (
    <main className="min-h-screen bg-slate-50">
      <Header title="Meeting Copilot" active={Boolean(activeMeeting)} startedAt={activeMeeting?.started_at} />

      <div className="mx-auto max-w-7xl px-4 pb-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section className="min-w-0">
            <MeetingControls
              hasActiveMeeting={Boolean(activeMeeting)}
              onStart={handleStart}
              onStop={handleStop}
            />

            {audioError && <p className="mt-3 text-sm text-red-600">{audioError}</p>}

            <TranscriptPanel entries={transcriptLines.length ? transcriptLines : transcriptFromState} />
          </section>

          <aside className="space-y-4">
            <SummaryPanel summary={summary} />
            <InsightsPanel decisions={decisions} actions={actions} risks={risks} questions={questions} />

            <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
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
          </aside>
        </div>

        <CopilotChat disabled={!activeMeeting} messages={messages} quickQuestions={quickQuestions} onAsk={ask} />
      </div>
    </main>
  )
}
