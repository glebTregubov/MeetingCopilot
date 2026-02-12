import type { WsEvent } from '../types/events'

interface WebSocketClientOptions {
  reconnectAttempts?: number
  reconnectDelayMs?: number
}

export class ReconnectingWebSocketClient {
  private socket: WebSocket | null = null
  private reconnectCount = 0
  private readonly maxReconnectAttempts: number
  private readonly reconnectDelayMs: number
  private readonly url: string
  private readonly onMessage: (event: WsEvent) => void
  private onOpenCallback: (() => void) | null = null
  private onCloseCallback: (() => void) | null = null

  constructor(url: string, onMessage: (event: WsEvent) => void, options: WebSocketClientOptions = {}) {
    this.url = url
    this.onMessage = onMessage
    this.maxReconnectAttempts = options.reconnectAttempts ?? 5
    this.reconnectDelayMs = options.reconnectDelayMs ?? 1000
  }

  onOpen(callback: () => void): void {
    this.onOpenCallback = callback
  }

  onClose(callback: () => void): void {
    this.onCloseCallback = callback
  }

  connect(): void {
    this.socket = new WebSocket(this.url)

    this.socket.onopen = () => {
      console.log('[MeetingCopilot] WebSocket connected to:', this.url)
      this.reconnectCount = 0
      this.onOpenCallback?.()
    }

    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as WsEvent
        this.onMessage(parsed)
      } catch {
        // ignore malformed event
      }
    }

    this.socket.onclose = () => {
      console.log('[MeetingCopilot] WebSocket closed')
      this.onCloseCallback?.()
      if (this.reconnectCount >= this.maxReconnectAttempts) {
        return
      }

      this.reconnectCount += 1
      window.setTimeout(() => this.connect(), this.reconnectDelayMs)
    }
  }

  disconnect(): void {
    this.socket?.close()
    this.socket = null
  }

  send(event: WsEvent): void {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return
    }
    this.socket.send(JSON.stringify(event))
  }
}
