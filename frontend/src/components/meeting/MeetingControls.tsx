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
    <div className="rounded-lg border border-slate-200 p-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Meeting Controls</h3>
      {hasActiveMeeting ? (
        <button
          type="button"
          onClick={handleStop}
          disabled={pending}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Stop Meeting
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Meeting title"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Start
          </button>
        </form>
      )}
    </div>
  )
}
