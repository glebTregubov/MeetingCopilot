interface SummaryPanelProps {
  summary: string
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 text-sm font-semibold text-slate-900">Live Summary</h2>
      <p className="mb-3 text-xs text-slate-500">Rolling synthesis from transcript deltas</p>
      {summary ? (
        <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
          {summary}
        </pre>
      ) : (
        <p className="text-sm text-slate-500">Summary will appear after transcript updates.</p>
      )}
    </section>
  )
}
