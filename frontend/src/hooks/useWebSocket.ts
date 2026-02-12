import { useCallback, useEffect, useRef, useState } from 'react'

import { ReconnectingWebSocketClient } from '../services/websocket'
import type { WsEvent } from '../types/events'

interface UseWebSocketResult {
  events: WsEvent[]
  connected: boolean
  connect: (meetingId: string) => void
  disconnect: () => void
  send: (event: WsEvent) => void
}

export function useWebSocket(): UseWebSocketResult {
  const [events, setEvents] = useState<WsEvent[]>([])
  const [connected, setConnected] = useState(false)
  const clientRef = useRef<ReconnectingWebSocketClient | null>(null)

  const disconnect = useCallback(() => {
    clientRef.current?.disconnect()
    clientRef.current = null
    setConnected(false)
  }, [])

  const connect = useCallback((meetingId: string) => {
    disconnect()
    // Clear stale events from previous sessions
    setEvents([])

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsUrl = `${protocol}://${window.location.hostname}:8000/ws/meetings/${meetingId}`

    const client = new ReconnectingWebSocketClient(wsUrl, (event) => {
      setEvents((prev) => [...prev, event])
    })

    client.onOpen(() => setConnected(true))
    client.onClose(() => setConnected(false))

    client.connect()
    clientRef.current = client
  }, [disconnect])

  const send = useCallback((event: WsEvent) => {
    clientRef.current?.send(event)
  }, [])

  useEffect(() => {
    return () => disconnect()
  }, [disconnect])

  return { events, connected, connect, disconnect, send }
}
