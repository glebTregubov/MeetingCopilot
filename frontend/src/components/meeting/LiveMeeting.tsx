import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { Header } from '../layout/Header'
import { AudioVisualizer } from './AudioVisualizer'
import { CopilotChat } from './CopilotChat'
import { InsightsPanel } from './InsightsPanel'
import { MeetingControls } from './MeetingControls'
import { SummaryPanel } from './SummaryPanel'
import { TranscriptPanel } from './TranscriptPanel'
import { useMeetingState } from '../../hooks/useMeetingState'
import { useAudioCapture } from '../../hooks/useAudioCapture'
import { useCopilot } from '../../hooks/useCopilot'
import { useWebSocket } from '../../hooks/useWebSocket'
import { providersApi, sttApi } from '../../services/api'
import type { ActionItem, Decision, OpenQuestion, Risk } from '../../types/insights'

export function LiveMeeting() {
  const { meetings, activeMeeting, loading, error, startMeeting, stopMeeting } = useMeetingState()
  const { stream, isCapturing, start: startAudio, stop: stopAudio, error: audioError } = useAudioCapture()
  const { events, connected: wsConnected, connect: connectWs, disconnect: disconnectWs, send: sendWsEvent } = useWebSocket()
  const [sttProvider, setSttProvider] = useState<'openai' | 'elevenlabs'>('elevenlabs')
  const [manualText, setManualText] = useState('')
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunkQueueRef = useRef<Blob[]>([])
  const chunkUploadInFlightRef = useRef(false)

  useEffect(() => {
    const loadProvider = async () => {
      try {
        const result = await providersApi.getStt()
        console.log('[MeetingCopilot] STT provider loaded:', result.active)
        if (result.active === 'elevenlabs' || result.active === 'openai') {
          setSttProvider(result.active)
        }
      } catch (err) {
        console.warn('[MeetingCopilot] Failed to load STT provider, defaulting to elevenlabs:', err)
        setSttProvider('elevenlabs')
      }
    }

    void loadProvider()
  }, [])

  async function handleStart(title: string) {
    console.log('[MeetingCopilot] Starting meeting:', title)
    await startMeeting(title)
    // Audio capture is optional — don't let failure block the meeting
    try {
      await startAudio()
      console.log('[MeetingCopilot] Audio capture started')
    } catch (err) {
      console.warn('[MeetingCopilot] Audio capture failed (meeting continues without mic):', err)
    }
  }

  async function handleStop() {
    console.log('[MeetingCopilot] Stopping meeting')
    if (activeMeeting) {
      await stopMeeting(activeMeeting.id)
    }
    stopAudio()
    disconnectWs()
  }

  function handleManualSubmit() {
    const text = manualText.trim()
    if (!text || !activeMeeting) return
    console.log('[MeetingCopilot] Manual transcript:', text)
    sendWsEvent({
      type: 'transcript.segment',
      meeting_id: activeMeeting.id,
      payload: { text, speaker: 'Attendee' },
      timestamp: new Date().toISOString(),
    })
    setManualText('')
  }

  // WebSocket connects whenever there is an active meeting (independent of audio)
  useEffect(() => {
    if (activeMeeting) {
      console.log('[MeetingCopilot] Connecting WebSocket for meeting:', activeMeeting.id)
      connectWs(activeMeeting.id)
    } else {
      disconnectWs()
    }
  }, [activeMeeting, connectWs, disconnectWs])

  // Process queued chunks sequentially
  const processChunkQueue = async (meetingId: string, mime: string) => {
    if (chunkUploadInFlightRef.current) return
    chunkUploadInFlightRef.current = true

    while (chunkQueueRef.current.length > 0) {
      const blob = chunkQueueRef.current.shift()!
      try {
        const arrayBuffer = await blob.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let index = 0; index < bytes.length; index += 1) {
          binary += String.fromCharCode(bytes[index])
        }
        const audioBase64 = btoa(binary)

        const result = await sttApi.transcribeElevenlabsChunk(audioBase64, mime)
        const text = result.text.trim()
        console.log('[MeetingCopilot] STT result:', text || '(silence)')
        if (text) {
          sendWsEvent({
            type: 'transcript.segment',
            meeting_id: meetingId,
            payload: { text, speaker: 'Attendee' },
            timestamp: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.warn('[MeetingCopilot] Chunk transcription error:', err)
      }
    }

    chunkUploadInFlightRef.current = false
  }

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
      console.warn('[MeetingCopilot] MediaRecorder not available')
      return
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'

    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = (event: BlobEvent) => {
      if (!event.data || event.data.size === 0) return
      console.log('[MeetingCopilot] Audio chunk:', event.data.size, 'bytes')
      chunkQueueRef.current.push(event.data)
      void processChunkQueue(activeMeeting.id, mimeType)
    }

    console.log('[MeetingCopilot] MediaRecorder started, mimeType:', mimeType)
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

            {/* Status indicators */}
            {activeMeeting && (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <span className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium ${wsConnected ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                  <span className={`inline-block h-2 w-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
                  {wsConnected ? 'LIVE' : 'Connecting…'}
                </span>
                {isCapturing ? (
                  <span className="flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3 py-1 font-medium text-green-700">
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    Mic active · {sttProvider}
                  </span>
                ) : (
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-500">
                    {audioError ? `Mic: ${audioError}` : 'No mic — use text input below'}
                  </span>
                )}
              </div>
            )}

            {/* Audio Visualizer — real-time mic level bars */}
            <AudioVisualizer stream={stream} isActive={isCapturing && Boolean(activeMeeting)} />

            {audioError && <p className="mt-2 text-sm text-red-600">{audioError}</p>}

            <TranscriptPanel entries={transcriptLines.length ? transcriptLines : transcriptFromState} />

            {/* Manual text input fallback */}
            {activeMeeting && (
              <div className="mt-3 flex gap-2">
                <input
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit() }}
                  className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="Type transcript text here (Enter to send)"
                />
                <button
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={!manualText.trim()}
                  className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            )}
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
                      <p className="text-xs text-slate-500">{meeting.id.slice(0, 8)}…</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${meeting.status === 'active' ? 'text-green-600' : 'text-slate-500'}`}>
                        {meeting.status === 'active' ? '● Live' : 'Ended'}
                      </span>
                      {meeting.status === 'stopped' && (
                        <Link
                          to={`/reports/${meeting.id}`}
                          className="rounded-md border border-slate-300 px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          Report
                        </Link>
                      )}
                    </div>
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
