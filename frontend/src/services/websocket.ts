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

  constructor(url: string, onMessage: (event: WsEvent) => void, options: WebSocketClientOptions = {}) {
    this.url = url
    this.onMessage = onMessage
    this.maxReconnectAttempts = options.reconnectAttempts ?? 5
    this.reconnectDelayMs = options.reconnectDelayMs ?? 1000
  }

  connect(): void {
    this.socket = new WebSocket(this.url)

    this.socket.onopen = () => {
      this.reconnectCount = 0
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
