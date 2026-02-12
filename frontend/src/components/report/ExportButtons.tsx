import { useState } from 'react'

import { meetingsApi } from '../../services/api'

interface ExportButtonsProps {
  meetingId: string
}

function downloadText(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function ExportButtons({ meetingId }: ExportButtonsProps) {
  const [telegramChatId, setTelegramChatId] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleExportMd = async () => {
    try {
      const markdown = await meetingsApi.exportReport(meetingId, 'md')
      downloadText(`meeting-${meetingId}.md`, markdown, 'text/markdown;charset=utf-8')
      setStatus('Markdown exported')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Export failed')
    }
  }

  const handleExportHtml = async () => {
    try {
      const html = await meetingsApi.exportReport(meetingId, 'html')
      downloadText(`meeting-${meetingId}.html`, html, 'text/html;charset=utf-8')
      setStatus('HTML exported')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Export failed')
    }
  }

  const handleSendTelegram = async () => {
    if (!telegramChatId.trim()) {
      setStatus('Enter Telegram chat id')
      return
    }

    try {
      await meetingsApi.sendExportToTelegram(meetingId, telegramChatId.trim())
      setStatus('Sent to Telegram')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Telegram send failed')
    }
  }

  return (
    <section className="mt-4 rounded-lg border border-slate-200 p-4">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Export</h2>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleExportMd}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white"
        >
          Export MD
        </button>
        <button
          type="button"
          onClick={handleExportHtml}
          className="rounded-md bg-slate-700 px-3 py-2 text-sm font-medium text-white"
        >
          Export HTML
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={telegramChatId}
          onChange={(event) => setTelegramChatId(event.target.value)}
          placeholder="Telegram chat id"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleSendTelegram}
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white"
        >
          Send to Telegram
        </button>
      </div>

      {status && <p className="mt-3 text-sm text-slate-600">{status}</p>}
    </section>
  )
}
