import { useState } from 'react'
import type { FormEvent } from 'react'

import type { CopilotMessage } from '../../hooks/useCopilot'

interface CopilotChatProps {
  disabled?: boolean
  messages: CopilotMessage[]
  quickQuestions: string[]
  onAsk: (question: string) => void
}

export function CopilotChat({ disabled = false, messages, quickQuestions, onAsk }: CopilotChatProps) {
  const [input, setInput] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!input.trim() || disabled) {
      return
    }
    onAsk(input.trim())
    setInput('')
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Ask Copilot</h2>

      <div className="mb-3 flex flex-wrap gap-2">
        {quickQuestions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onAsk(question)}
            className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 disabled:opacity-50"
          >
            {question}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mb-3 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about this meeting..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Ask
        </button>
      </form>

      <div className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">No Q&A yet.</p>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}-${message.text}`}
              className={`rounded-md px-3 py-2 text-sm ${
                message.role === 'user' ? 'bg-slate-100 text-slate-900' : 'bg-blue-50 text-blue-900'
              }`}
            >
              <p className="text-xs uppercase tracking-wide opacity-70">{message.role}</p>
              <p>{message.text}</p>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
