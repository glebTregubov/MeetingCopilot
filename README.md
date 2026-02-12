# MeetingCopilot

MeetingCopilot — локальный browser-first ассистент встреч с Telegram-интеграцией.

## Ключевые возможности
- Live транскрипция встречи
- Live summary и структурированные инсайты (decisions/actions/risks/open questions)
- Ask Copilot по контексту текущей встречи
- Пост-встречный отчёт + отправка в Telegram

## Поддерживаемые STT-подходы
- `openai` (Realtime WebRTC)
- `elevenlabs` (Scribe v2 Realtime)

Полная техническая спецификация: [docs/meeting_copilot_browser_first_telegram_расширенное_техописание.md](docs/meeting_copilot_browser_first_telegram_расширенное_техописание.md)

## Quickstart (WSL / macOS)

### 1) Клонирование и переменные окружения
```bash
git clone <your-repo-url> MeetingCopilot
cd MeetingCopilot
cp .env.example .env
```

### 2) Backend setup (Python 3.11+)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
cd ..
```

### 3) Frontend setup (Node 20+)
```bash
cd frontend
npm install
cd ..
```

### 4) Запуск в 2 терминалах
Terminal A:
```bash
make dev-backend
```

Terminal B:
```bash
make dev-frontend
```

### 5) Тесты и проверка
```bash
cd backend && source .venv/bin/activate && pytest -q
cd ../frontend && npm run lint && npm run build
```

### 6) Экспорт отчёта
- Markdown: `GET /api/meetings/{id}/export?format=md`
- HTML: `GET /api/meetings/{id}/export?format=html`
- Отправка в Telegram: `POST /api/meetings/{id}/export/telegram` с телом `{"chat_id":"<id>"}`