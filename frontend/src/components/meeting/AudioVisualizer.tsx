import { useEffect, useRef } from 'react'

interface AudioVisualizerProps {
  stream: MediaStream | null
  isActive: boolean
}

/**
 * Realtime audio level visualizer — shows animated bars that respond
 * to actual microphone input levels (like a mini equalizer).
 */
export function AudioVisualizer({ stream, isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !stream || !isActive) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx
    const source = audioCtx.createMediaStreamSource(stream)
    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.7
    source.connect(analyser)
    analyserRef.current = analyser

    const bufferLength = analyser.frequencyBinCount // 32 bins
    const dataArray = new Uint8Array(bufferLength)
    const barCount = 24
    const barGap = 2
    const barWidth = (canvas.width - (barCount - 1) * barGap) / barCount

    function draw() {
      if (!ctx || !canvas) return
      animationRef.current = requestAnimationFrame(draw)

      analyser!.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < barCount; i++) {
        // Map bar index to frequency bin (skip DC, focus on speech range)
        const binIndex = Math.min(i + 1, bufferLength - 1)
        const value = dataArray[binIndex] / 255

        // Minimum bar height so it looks alive even when quiet
        const minH = 3
        const barHeight = Math.max(minH, value * canvas.height * 0.9)
        const x = i * (barWidth + barGap)
        const y = (canvas.height - barHeight) / 2

        // Gradient from blue-400 to blue-600
        const intensity = Math.floor(100 + value * 155)
        ctx.fillStyle = `rgb(59, ${intensity}, 246)`
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth, barHeight, 2)
        ctx.fill()
      }
    }

    draw()

    return () => {
      cancelAnimationFrame(animationRef.current)
      analyser.disconnect()
      source.disconnect()
      audioCtx.close()
      audioCtxRef.current = null
      analyserRef.current = null
    }
  }, [stream, isActive])

  if (!isActive) {
    return null
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </div>
      <span className="text-xs font-medium text-slate-600">REC</span>
      <canvas
        ref={canvasRef}
        width={200}
        height={32}
        className="h-8 w-[200px]"
      />
    </div>
  )
}
