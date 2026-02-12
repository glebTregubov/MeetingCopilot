import { Timer } from '../common/Timer'
import { StatusBadge } from '../common/StatusBadge'

interface HeaderProps {
  title: string
  active: boolean
  startedAt?: string
}

export function Header({ title, active, startedAt }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 mb-4 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
          MC
        </div>
        <div>
          <h1 className="text-base font-semibold text-slate-900">{title}</h1>
          <p className="text-xs text-slate-500">Marketing meeting intelligence</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
            active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-600'
          }`}
        >
          {active ? 'LIVE' : 'READY'}
        </span>
        <Timer startedAt={startedAt} />
        <StatusBadge active={active} />
      </div>
    </header>
  )
}
