interface StatusBadgeProps {
  active: boolean
}

export function StatusBadge({ active }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
        active ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
      }`}
    >
      {active ? 'REC' : 'IDLE'}
    </span>
  )
}
