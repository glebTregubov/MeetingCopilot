import { useState } from 'react'
import type { FormEvent } from 'react'

interface MeetingControlsProps {
  hasActiveMeeting: boolean
  onStart: (title: string) => Promise<void>
  onStop: () => Promise<void>
}

export function MeetingControls({ hasActiveMeeting, onStart, onStop }: MeetingControlsProps) {
  const [title, setTitle] = useState('Team Sync')
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) {
      return
    }

    setPending(true)
    try {
      await onStart(title.trim())
    } finally {
      setPending(false)
    }
  }

  async function handleStop() {
    setPending(true)
    try {
      await onStop()
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Meeting Controls</h3>
      {hasActiveMeeting ? (
        <button
          type="button"
          onClick={handleStop}
          disabled={pending}
          className="rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
        >
          Stop Recording
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-full border border-slate-300 px-4 py-2 text-sm"
            placeholder="Meeting title"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            Start Meeting
          </button>
        </form>
      )}
    </div>
  )
}
