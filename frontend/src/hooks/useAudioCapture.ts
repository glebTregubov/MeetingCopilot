import { useCallback, useEffect, useRef, useState } from 'react'

interface UseAudioCaptureResult {
  stream: MediaStream | null
  isCapturing: boolean
  error: string | null
  start: () => Promise<void>
  stop: () => void
}

export function useAudioCapture(): UseAudioCaptureResult {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const start = useCallback(async () => {
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      const context = new AudioContext()
      audioContextRef.current = context
      const source = context.createMediaStreamSource(mediaStream)
      const gain = context.createGain()
      source.connect(gain)

      streamRef.current = mediaStream
      setStream(mediaStream)
      setIsCapturing(true)
      console.log('[MeetingCopilot] Audio stream acquired:', mediaStream.getAudioTracks().length, 'tracks')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to capture audio'
      console.warn('[MeetingCopilot] Audio capture failed:', msg)
      setError(msg)
      setIsCapturing(false)
    }
  }, [])

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    audioContextRef.current?.close()
    audioContextRef.current = null
    streamRef.current = null
    setStream(null)
    setIsCapturing(false)
  }, [])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return { stream, isCapturing, error, start, stop }
}
