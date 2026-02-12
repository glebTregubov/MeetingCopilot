interface TranscriptPanelProps {
  lines: string[]
}

export function TranscriptPanel({ lines }: TranscriptPanelProps) {
  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Live Transcript</h2>
      {lines.length === 0 ? (
        <p className="text-sm text-slate-500">Transcript will appear when realtime stream is connected.</p>
      ) : (
        <ul className="space-y-2">
          {lines.map((line, index) => (
            <li key={`${index}-${line}`} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {line}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
