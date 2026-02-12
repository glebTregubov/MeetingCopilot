interface SummaryPanelProps {
  summary: string
}

export function SummaryPanel({ summary }: SummaryPanelProps) {
  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Live Summary</h2>
      {summary ? (
        <pre className="whitespace-pre-wrap text-sm text-slate-700">{summary}</pre>
      ) : (
        <p className="text-sm text-slate-500">Summary will appear after transcript updates.</p>
      )}
    </section>
  )
}
