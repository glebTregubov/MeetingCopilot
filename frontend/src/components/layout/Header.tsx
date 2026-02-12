import { Timer } from '../common/Timer'
import { StatusBadge } from '../common/StatusBadge'

interface HeaderProps {
  title: string
  active: boolean
  startedAt?: string
}

export function Header({ title, active, startedAt }: HeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500">Live meeting assistant</p>
      </div>
      <div className="flex items-center gap-3">
        <Timer startedAt={startedAt} />
        <StatusBadge active={active} />
      </div>
    </header>
  )
}
