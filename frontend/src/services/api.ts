import type { Meeting, MeetingCreatePayload } from '../types/meeting'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const meetingsApi = {
  list: () => request<Meeting[]>('/api/meetings'),
  create: (payload: MeetingCreatePayload) =>
    request<Meeting>('/api/meetings', { method: 'POST', body: JSON.stringify(payload) }),
  get: (meetingId: string) => request<Meeting>(`/api/meetings/${meetingId}`),
  stop: (meetingId: string) => request<Meeting>(`/api/meetings/${meetingId}/stop`, { method: 'POST' }),
  delete: (meetingId: string) => request<void>(`/api/meetings/${meetingId}`, { method: 'DELETE' }),
  exportReport: async (meetingId: string, format: 'md' | 'html'): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/api/meetings/${meetingId}/export?format=${format}`)
    if (!response.ok) {
      throw new Error(await response.text())
    }
    return response.text()
  },
  sendExportToTelegram: (meetingId: string, chatId: string) =>
    request<{ status: string }>(`/api/meetings/${meetingId}/export/telegram`, {
      method: 'POST',
      body: JSON.stringify({ chat_id: chatId }),
    }),
}

export const providersApi = {
  getStt: () => request<{ active: string; available: string[] }>('/api/providers/stt'),
  setStt: (provider: 'openai' | 'elevenlabs') =>
    request<{ active: string; available: string[] }>('/api/providers/stt', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    }),
}

export const sttApi = {
  transcribeElevenlabsChunk: (audioBase64: string, mimeType: string) =>
    request<{ text: string }>('/api/stt/elevenlabs/chunk', {
      method: 'POST',
      body: JSON.stringify({ audio_base64: audioBase64, mime_type: mimeType }),
    }),
}
