import { useEffect, useState } from 'react'

interface TimerProps {
  startedAt?: string
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return [hours, minutes, seconds].map((part) => part.toString().padStart(2, '0')).join(':')
}

export function Timer({ startedAt }: TimerProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0)
      return
    }

    const start = new Date(startedAt).getTime()
    const update = () => {
      const now = Date.now()
      setElapsed(Math.max(0, Math.floor((now - start) / 1000)))
    }

    update()
    const intervalId = window.setInterval(update, 1000)
    return () => window.clearInterval(intervalId)
  }, [startedAt])

  return <span className="font-mono text-sm text-slate-600">{formatDuration(elapsed)}</span>
}
