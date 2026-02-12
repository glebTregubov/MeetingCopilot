import { useMemo, useState } from 'react'

import type { ActionItem, Decision, OpenQuestion, Risk } from '../../types/insights'

type InsightTab = 'decisions' | 'actions' | 'risks' | 'questions'

interface InsightsPanelProps {
  decisions: Decision[]
  actions: ActionItem[]
  risks: Risk[]
  questions: OpenQuestion[]
}

export function InsightsPanel({ decisions, actions, risks, questions }: InsightsPanelProps) {
  const [activeTab, setActiveTab] = useState<InsightTab>('decisions')

  const tabs = useMemo(
    () => [
      { key: 'decisions' as const, label: 'Decisions', count: decisions.length },
      { key: 'actions' as const, label: 'Actions', count: actions.length },
      { key: 'risks' as const, label: 'Risks', count: risks.length },
      { key: 'questions' as const, label: 'Questions', count: questions.length },
    ],
    [decisions.length, actions.length, risks.length, questions.length],
  )

  const content =
    activeTab === 'decisions'
      ? decisions.map((item) => item.content)
      : activeTab === 'actions'
        ? actions.map((item) => item.content)
        : activeTab === 'risks'
          ? risks.map((item) => item.content)
          : questions.map((item) => item.content)

  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Insights</h2>

      <div className="mb-3 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-3 py-1 text-xs font-medium ${
              activeTab === tab.key ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {content.length === 0 ? (
        <p className="text-sm text-slate-500">No items yet.</p>
      ) : (
        <ul className="space-y-2">
          {content.map((text, index) => (
            <li key={`${activeTab}-${index}-${text}`} className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {text}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
