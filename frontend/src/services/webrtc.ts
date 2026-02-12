export interface RealtimeSessionOptions {
  baseUrl?: string
  model?: string
}

export class RealtimeSession {
  private peerConnection: RTCPeerConnection | null = null

  async connect(options: RealtimeSessionOptions = {}): Promise<void> {
    const stunServer = { urls: 'stun:stun.l.google.com:19302' }
    this.peerConnection = new RTCPeerConnection({ iceServers: [stunServer] })

    const dataChannel = this.peerConnection.createDataChannel('events')
    dataChannel.onopen = () => {
      void options
    }
  }

  async attachAudioTrack(stream: MediaStream): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('RealtimeSession is not connected')
    }

    for (const track of stream.getAudioTracks()) {
      this.peerConnection.addTrack(track, stream)
    }
  }

  disconnect(): void {
    this.peerConnection?.close()
    this.peerConnection = null
  }
}
