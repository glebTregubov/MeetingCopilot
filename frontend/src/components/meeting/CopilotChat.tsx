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
  const [isOpen, setIsOpen] = useState(false)
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
    <>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="fixed right-6 bottom-6 z-40 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
      >
        {isOpen ? 'Close Copilot' : 'Ask Copilot'}
      </button>

      {isOpen && (
        <section className="fixed right-6 bottom-22 z-40 flex h-[460px] w-[360px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-200 bg-slate-900 px-4 py-3">
            <h2 className="text-sm font-semibold text-white">Meeting Assistant</h2>
            <p className="text-xs text-slate-300">Ask questions from current meeting context</p>
          </div>

          <div className="border-b border-slate-200 p-3">
            <div className="flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  type="button"
                  disabled={disabled}
                  onClick={() => onAsk(question)}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700 disabled:opacity-50"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-500">No Q&A yet.</p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}-${message.text}`}
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'ml-auto bg-blue-600 text-white'
                      : 'mr-auto border border-slate-200 bg-white text-slate-800'
                  }`}
                >
                  {message.text}
                </div>
              ))
            )}
          </div>

          <form onSubmit={submit} className="flex gap-2 border-t border-slate-200 p-3">
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
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </section>
      )}
    </>
  )
}
