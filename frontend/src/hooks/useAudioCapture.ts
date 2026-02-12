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

      setStream(mediaStream)
      setIsCapturing(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to capture audio')
      setIsCapturing(false)
    }
  }, [])

  const stop = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop())
    audioContextRef.current?.close()
    audioContextRef.current = null
    setStream(null)
    setIsCapturing(false)
  }, [stream])

  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return { stream, isCapturing, error, start, stop }
}
