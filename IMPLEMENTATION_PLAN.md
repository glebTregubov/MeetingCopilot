# Plan: Тотальная реализация Meeting Copilot

**TL;DR:** Полное создание проекта от пустого репо до рабочего MVP за 5 этапов (~80+ файлов). Каждый этап завершается зелёными тестами и записью в `STATUS.md` + `BUILD_LOG.md`. Два STT-провайдера (OpenAI, ElevenLabs), Telegram-бот, экспорт отчётов.

## Общий прогресс
- [x] Подготовить `STATUS.md` и `BUILD_LOG.md` для трекинга
- [x] Завершить Этап 0 — Каркас проекта
- [x] Завершить Этап 1 — Meeting Lifecycle (CRUD + UI каркас)
- [x] Завершить Этап 2 — Realtime аудио и транскрипция
- [x] Завершить Этап 3 — Intelligence Layer
- [x] Завершить Этап 4 — Ask Copilot + Telegram
- [x] Завершить Этап 5 — Экспорт, стабилизация, релиз

## Файлы трекинга прогресса
- [x] `STATUS.md` — чеклист задач по этапам, текущий статус, тесты, точка остановки
- [x] `BUILD_LOG.md` — хронологический лог: дата, что сделано, тесты, проблемы

## Steps

### Этап 0 — Каркас проекта (scaffolding)
- [x] Создать `STATUS.md` и `BUILD_LOG.md` — файлы трекинга
- [x] Создать структуру директорий:
	- [x] `backend/src/` (`config`, `api`, `models`, `services`, `integrations`, `db`, `common`)
	- [x] `backend/tests/` (`unit`, `integration`, `fixtures`)
	- [x] `frontend/src/` (`components`, `hooks`, `services`, `types`, `utils`, `styles`)
	- [x] `config/prompts/`
- [x] Backend: `backend/pyproject.toml`, `backend/requirements.txt`, `backend/requirements-dev.txt`
- [x] Backend: `backend/src/main.py` — FastAPI app factory с lifespan
- [x] Backend: `backend/src/config/settings.py` — Pydantic Settings (все env vars)
- [x] Frontend: `npm create vite` → React + TS + Tailwind + ESLint
- [x] `.env.example` — шаблон всех переменных окружения
- [x] `Makefile` — команды `make dev`, `make test`, `make lint`
- [x] `docker-compose.yml` — опциональная оркестрация
- [x] Настроить Ruff, ESLint, Prettier
- [x] Smoke-тест: backend стартует на порту, frontend собирается
- [x] Запись в `STATUS.md` и `BUILD_LOG.md`

### Этап 1 — Meeting Lifecycle (CRUD + UI каркас)
- [x] `backend/src/db/database.py` — `aiosqlite` подключение
- [x] `backend/src/db/migrations.py` — DDL: meetings, transcript_segments, snapshots, insights
- [x] `backend/src/db/repositories.py` — CRUD для meetings и связанных таблиц
- [x] `backend/src/models/meeting.py` — Pydantic модели Meeting, TranscriptSegment, LiveSummarySnapshot
- [x] `backend/src/models/insights.py` — Decision, ActionItem, Risk, OpenQuestion
- [x] `backend/src/models/websocket_events.py` — WS event schemas
- [x] `backend/src/services/meeting_service.py` — create, stop, get, delete
- [x] `backend/src/api/router.py` — агрегация роутов
- [x] `backend/src/api/meetings.py` — REST endpoints
- [x] `backend/src/api/websocket.py` — WS endpoint (базовый)
- [x] Frontend: `frontend/src/App.tsx` — роутинг (LiveMeeting, PostMeetingReport)
- [x] Frontend: `frontend/src/components/layout/Header.tsx` — название, таймер, REC, Start/Stop
- [x] Frontend: `frontend/src/components/meeting/LiveMeeting.tsx` — контейнер
- [x] Frontend: `frontend/src/components/meeting/MeetingControls.tsx` — Start/Stop
- [x] Frontend: `frontend/src/components/common/Timer.tsx`, `StatusBadge.tsx`
- [x] Frontend: `frontend/src/services/api.ts` — REST клиент
- [x] Frontend: `frontend/src/hooks/useMeetingState.ts` — state management
- [x] Тесты: `test_meeting_service.py`, `test_api_meetings.py`
- [x] Запись в `STATUS.md` и `BUILD_LOG.md`

### Этап 2 — Realtime аудио и транскрипция
- [x] `backend/src/services/ai/provider_base.py` — абстрактный STT/LLM интерфейс
- [x] `backend/src/services/ai/openai_provider.py` — OpenAI: ephemeral token + LLM
- [x] `backend/src/services/ai/elevenlabs_provider.py` — ElevenLabs Scribe v2 Realtime
- [x] `backend/src/services/ai/prompts.py` — загрузчик prompt-шаблонов
- [x] `backend/src/api/token.py` — POST `/api/token/ephemeral`
- [x] `config/prompts/structuring.md`, `summarization.md`, `qa.md`, `report.md`
- [x] Frontend: `frontend/src/hooks/useAudioCapture.ts` — `getUserMedia` + AudioWorklet
- [x] Frontend: `frontend/src/hooks/useWebRTC.ts` — WebRTC к OpenAI Realtime API
- [x] Frontend: `frontend/src/hooks/useWebSocket.ts` — WS к backend
- [x] Frontend: `frontend/src/services/webrtc.ts` — session management
- [x] Frontend: `frontend/src/services/websocket.ts` — reconnect logic
- [x] Frontend: `frontend/src/components/meeting/TranscriptPanel.tsx` — live transcript
- [x] Frontend: `frontend/src/types/meeting.ts`, `insights.ts`, `events.ts`
- [x] Тесты: `test_ai_providers.py`, `test_token_endpoint.py`
- [x] Запись в `STATUS.md` и `BUILD_LOG.md`

### Этап 3 — Intelligence Layer
- [x] `backend/src/services/state_manager.py` — delta processing engine
- [x] `backend/src/services/deduplication.py` — hash + similarity
- [x] Интеграция: `state_manager` вызывает LLM каждые 30–60 сек для summary + insights
- [x] WS broadcasting: `meeting.delta` при обновлении state
- [x] Frontend: `frontend/src/components/meeting/SummaryPanel.tsx` — live summary
- [x] Frontend: `frontend/src/components/meeting/InsightsPanel.tsx` — tabs: Decisions/Actions/Risks/Questions
- [x] Тесты: `test_state_manager.py`, `test_deduplication.py`
- [x] Запись в `STATUS.md` и `BUILD_LOG.md`

### Этап 4 — Ask Copilot + Telegram
- [x] WS event `user.question` → LLM answer → `bot.answer`
- [x] Frontend: `frontend/src/components/meeting/CopilotChat.tsx` + быстрые кнопки
- [x] Frontend: `frontend/src/hooks/useCopilot.ts` — Q&A логика
- [x] `backend/src/integrations/telegram/bot.py` — init, long polling, lifecycle
- [x] `backend/src/integrations/telegram/commands.py` — `/start_meeting`, `/stop_meeting`, `/summary`, `/actions`, `/decisions`, `/ask`
- [x] `backend/src/integrations/telegram/formatters.py` — MarkdownV2 форматирование
- [x] `backend/src/integrations/telegram/security.py` — whitelist
- [x] Автопост итогов при stop meeting
- [x] Тесты: `test_telegram_bot.py`, `test_copilot_qa.py`
- [x] Запись в `STATUS.md` и `BUILD_LOG.md`

### Этап 5 — Экспорт, стабилизация, релиз
- [x] `backend/src/services/export_service.py` — Markdown/HTML генерация
- [x] Frontend: `frontend/src/components/report/PostMeetingReport.tsx`
- [x] Frontend: `frontend/src/components/report/ExportButtons.tsx` — Export MD, Send to Telegram
- [x] `GET /api/meetings/{id}/export?format=md` — endpoint
- [x] Тесты: `test_export_service.py`
- [x] E2E smoke: полный цикл start → transcript → insights → stop → report → telegram
- [x] Обновить `README.md` — quickstart для WSL и macOS
- [x] Финальная запись в `STATUS.md`: MVP COMPLETE
- [x] Запись в `BUILD_LOG.md`: итоговый отчёт

## Verification
- [x] После каждого этапа: `make test` (pytest + vitest), результаты записываются в `BUILD_LOG.md`
- [x] `STATUS.md` обновляется с чеклистом: `[x]` выполнено, `[ ]` в работе, результаты тестов
- [x] Финальная проверка: полный E2E цикл на этапе 5

## Decisions
- [x] Начинаем с backend, затем frontend — так тесты можно гонять сразу
- [x] `STATUS.md` хранит чеклист задач + секция «на чём остановились»
- [x] `BUILD_LOG.md` хранит хронологический лог с датами, результатами тестов и проблемами
- [x] Оба файла в корне репо, коммитятся вместе с кодом
- [x] Поддерживаем навигационные JSON-реестры: `docs/project_box_map.json` и `docs/database_schema_map.json` (обновление при каждом изменении структуры/схемы БД)
- [x] После завершения каждого этапа обязательно делать отдельный git commit (код + `STATUS.md` + `BUILD_LOG.md` + актуальные JSON-реестры)
