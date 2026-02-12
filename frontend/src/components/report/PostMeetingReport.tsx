import { Link, useParams } from 'react-router-dom'

import { ExportButtons } from './ExportButtons'

export function PostMeetingReport() {
  const { meetingId } = useParams<{ meetingId: string }>()

  return (
    <main className="mx-auto max-w-4xl p-6">
      <h1 className="text-xl font-semibold text-slate-900">Post Meeting Report</h1>
      <p className="mt-2 text-sm text-slate-600">Generate and export meeting report artifacts.</p>

      {!meetingId ? (
        <p className="mt-4 text-sm text-red-600">Meeting id is missing in route.</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-slate-700">
            Meeting ID: <span className="font-mono">{meetingId}</span>
          </p>
          <ExportButtons meetingId={meetingId} />
        </>
      )}

      <div className="mt-6">
        <Link to="/" className="text-sm font-medium text-slate-700 underline">
          Back to live meeting
        </Link>
      </div>
    </main>
  )
}
