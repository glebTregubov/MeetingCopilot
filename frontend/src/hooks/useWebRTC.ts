import { useCallback, useEffect, useRef, useState } from 'react'

import { RealtimeSession } from '../services/webrtc'

interface UseWebRTCResult {
  connected: boolean
  error: string | null
  connect: (stream?: MediaStream | null) => Promise<void>
  disconnect: () => void
}

export function useWebRTC(): UseWebRTCResult {
  const sessionRef = useRef<RealtimeSession | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(async (stream?: MediaStream | null) => {
    try {
      setError(null)
      const session = new RealtimeSession()
      await session.connect()
      if (stream) {
        await session.attachAudioTrack(stream)
      }
      sessionRef.current = session
      setConnected(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect WebRTC session')
      setConnected(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    sessionRef.current?.disconnect()
    sessionRef.current = null
    setConnected(false)
  }, [])

  useEffect(() => {
    return () => disconnect()
  }, [disconnect])

  return { connected, error, connect, disconnect }
}
