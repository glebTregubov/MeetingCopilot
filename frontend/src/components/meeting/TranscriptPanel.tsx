interface TranscriptEntry {
  id: string
  speaker: string
  text: string
  timestamp?: string
}

interface TranscriptPanelProps {
  entries: TranscriptEntry[]
}

function formatTime(value?: string): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function TranscriptPanel({ entries }: TranscriptPanelProps) {
  return (
    <section className="mt-4 flex h-[calc(100vh-220px)] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Live Transcript</h2>
        <p className="text-xs text-slate-500">Realtime speech segments from active meeting</p>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-4 text-sm text-slate-500">
          Transcript will appear when realtime stream is connected.
        </div>
      ) : (
        <ul className="flex-1 space-y-3 overflow-y-auto p-4">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">{entry.speaker}</span>
                {entry.timestamp && <span className="text-[11px] text-slate-400">{formatTime(entry.timestamp)}</span>}
              </div>
              <p className="text-sm leading-relaxed text-slate-800">{entry.text}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
