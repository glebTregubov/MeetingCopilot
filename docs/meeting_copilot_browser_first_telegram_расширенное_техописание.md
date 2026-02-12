# Техническое задание: Meeting Copilot (Browser-first + Telegram)

Версия: 1.0  
Дата: 2026-02-12  
Статус: Базовое ТЗ для реализации MVP + план развития

Обновление: добавлен поддерживаемый STT-подход через ElevenLabs (Scribe v2 Realtime)

---

## 1) Цель и бизнес-контекст

Разработать локально запускаемый продукт **Meeting Copilot** для маркетинговых аналитических встреч (Zoom/Google Meet/Teams/офлайн), который:
- в реальном времени расшифровывает речь;
- формирует инкрементальный конспект;
- выделяет решения, задачи, риски и открытые вопросы;
- отвечает на вопросы по контексту текущей встречи;
- после завершения встречи формирует отчёт и отправляет его в Telegram.

Ключевая ценность: снижение ручных затрат на протоколы, контроль договорённостей и быстрое распространение итогов в команде.

---

## 2) Область охвата (Scope)

### 2.1 MVP (входит)
- Browser-first локальный UI на `http://localhost`.
- Захват **микрофона** через браузер.
- Realtime-транскрипция (Mode A: браузер → AI Realtime API через WebRTC).
- Альтернативная realtime-транскрипция через ElevenLabs Scribe v2 Realtime.
- Live Summary (обновление каждые 30–60 сек).
- Извлечение блоков: `Decisions`, `Action Items`, `Risks`, `Open Questions`.
- Встроенный чат `Ask Copilot`.
- Экспорт отчёта в Markdown (HTML — опционально в MVP).
- Telegram-бот в режиме long polling.
- Автопост итогов в Telegram-чат/канал.

### 2.2 Post-MVP (не входит в текущую поставку)
- Полноценный system audio capture (WASAPI/BlackHole и т.п.).
- Bot-participant в Zoom/Meet/Teams.
- Интеграции Notion/Bitrix/Jira.
- Централизованный multi-user SaaS режим.
- Полноценный CI/CD и cloud backup.

---

## 3) Целевые пользователи и сценарии

### 3.1 Пользователи
- Маркетинговые аналитики.
- Руководители маркетинга/роста.
- Участники еженедельных performance/review встреч.

### 3.2 Ключевые сценарии
1. Пользователь запускает локальный сервис и открывает UI.
2. Нажимает `Start` и проводит встречу.
3. Во время встречи наблюдает транскрипт и инсайты.
4. Задает вопросы агенту по текущему контексту.
5. По завершении получает minutes + action items.
6. Итоги автоматически отправляются в Telegram.

---

## 4) Архитектура решения

## 4.1 Архитектурный подход
Трёхслойная схема:
- **Frontend (React SPA)**: микрофон, UI, WebRTC/WS клиент.
- **Backend (FastAPI)**: оркестрация, состояние встречи, API, Telegram, экспорт.
- **AI Providers**: realtime транскрипция + LLM-структурирование/Q&A.

## 4.2 Рекомендуемый режим MVP
**Mode A (рекомендован):**
- Браузер напрямую устанавливает WebRTC-сессию с Realtime API.
- Backend выдаёт ephemeral token и управляет доменной логикой.

Плюсы: минимальная задержка, проще realtime-поток, ключ API не хранится на клиенте.

## 4.3 Поддерживаемый альтернативный режим STT: ElevenLabs
**Mode B (поддерживаемый):**
- Браузер передаёт PCM-аудио в backend по WebSocket.
- Backend проксирует поток в ElevenLabs Scribe v2 Realtime (streaming API).
- Backend получает транскрипт-события и отправляет `meeting.delta` в UI.

Плюсы: сильный ASR-фокус, diarization/timestamps, удобный fallback при проблемах с основным провайдером.

Ограничение: архитектурно сложнее Mode A и выше нагрузка на backend.

## 4.4 Политика выбора провайдера
- По умолчанию: `STT_PROVIDER=openai`.
- Поддерживаемый вариант: `STT_PROVIDER=elevenlabs`.
- Допускается fallback: при деградации активного STT-провайдера переключение на резервный.

---

## 5) Технологический стек (MVP)

### 5.1 Backend
- Python 3.12+
- FastAPI
- Uvicorn
- Pydantic v2
- aiosqlite (локальная БД)
- openai SDK (+ опционально anthropic SDK)
- elevenlabs SDK (или прямой WebSocket-клиент ElevenLabs Realtime STT)
- python-telegram-bot (long polling)

### 5.2 Frontend
- React 18+
- Vite
- TypeScript
- Tailwind CSS

### 5.3 Инфраструктура и качество
- SQLite (локально)
- Pytest + pytest-asyncio
- Vitest + React Testing Library
- Ruff, ESLint, Prettier
- Docker/docker-compose (опционально для dev)

---

## 6) Функциональные требования

## FR-01 Управление встречей
- Создание встречи.
- Старт/стоп встречи из UI.
- Graceful stop при потере соединения.

## FR-02 Realtime-транскрипция
- Получение аудио с микрофона (`getUserMedia`).
- Отображение сегментов в live-панели.
- Таймкоды обязательны, speaker label — опционально.
- Поддержка двух STT-провайдеров: OpenAI Realtime и ElevenLabs Scribe v2 Realtime.
- Переключение STT-провайдера через конфиг без изменения UI-контракта.

## FR-03 Live Summary
- Обновление summary по дельте транскрипта каждые 30–60 сек.
- Хранение истории снапшотов summary.

## FR-04 Извлечение структурированных блоков
- Категории: `Decisions`, `Action Items`, `Risks`, `Open Questions`.
- Дедупликация записей между итерациями.

## FR-05 Ask Copilot
- Пользователь отправляет свободный вопрос.
- Ответ формируется только из контекста текущей встречи.

## FR-06 Отчёт после встречи
- Формирование финального протокола.
- Экспорт в Markdown (`.md`), опционально HTML.

## FR-07 Telegram-интеграция
- Команды: `/start_meeting`, `/stop_meeting`, `/summary`, `/actions`, `/decisions`, `/ask`.
- Автопост итогов в `TELEGRAM_DEFAULT_CHAT_ID`.

## FR-08 Приватность
- Режим «не хранить аудио» (по умолчанию).
- Хранение только транскрипта и отчётов.
- Возможность удалить встречу локально.

---

## 7) Нефункциональные требования

## NFR-01 Производительность
- Обновление UI: 1–5 сек.
- Цикл обновления summary: 30–60 сек.
- Ответ Telegram команд без LLM: до 3 сек.
- Ответ LLM-команд: до 10 сек.

## NFR-02 Надёжность
- Автосохранение состояния: каждые 10–30 сек.
- Восстановление WebSocket после разрыва + ресинхронизация state.
- Fallback на резервный STT-провайдер при ошибках активного провайдера (retry policy + circuit breaker).

## NFR-03 Безопасность
- Секреты только в backend (`.env`).
- Ephemeral token с коротким TTL (целевой 60 сек).
- Whitelist пользователей/чатов Telegram.
- Ключ ElevenLabs хранится только в backend (`ELEVENLABS_API_KEY`), не передаётся во frontend.

## NFR-04 Кроссплатформенность
- Поддержка Windows (WSL2 + Ubuntu) и macOS.

---

## 8) Модель данных (минимум)

- `Meeting`: `meeting_id`, `title`, `status`, `started_at`, `ended_at`.
- `TranscriptSegment`: `ts_start`, `ts_end`, `speaker?`, `text`, `confidence?`.
- `LiveSummarySnapshot`: `timestamp`, `summary_md`.
- `Decision`: `id`, `text`, `confidence?`, `related_segment_ids[]`.
- `ActionItem`: `id`, `text`, `owner?`, `due_date?`, `status`.
- `Risk`: `id`, `text`, `severity?`, `timestamp`.
- `OpenQuestion`: `id`, `text`, `timestamp`.

Идентификаторы инсайтов должны быть устойчивыми (hash normalized text).

---

## 9) API-контракты

### 9.1 REST
- `POST /api/meetings` — создать встречу.
- `GET /api/meetings/{id}` — получить состояние.
- `POST /api/meetings/{id}/stop` — завершить встречу.
- `GET /api/meetings/{id}/export?format=md|html` — экспорт отчёта.
- `POST /api/token/ephemeral` — выдача ephemeral token для WebRTC.
- `GET /api/providers/stt` — текущий активный STT-провайдер и доступные провайдеры.
- `POST /api/providers/stt` — смена STT-провайдера (`openai|elevenlabs`) для новой встречи.

### 9.2 WebSocket
Канал: `/ws/meetings/{meeting_id}`

События сервер → клиент:
- `meeting.state` (полный snapshot)
- `meeting.delta` (инкрементальные изменения)
- `bot.answer`
- `bot.flag`
- `provider.status` (статус STT-провайдера и события fallback)

События клиент → сервер:
- `user.question`
- `meeting.command`
- `transcript.segments` (если требуется relay в backend)

---

## 10) Telegram-бот (MVP)

### 10.1 Команды
- `/start_meeting <title>`
- `/stop_meeting`
- `/summary`
- `/actions`
- `/decisions`
- `/ask <вопрос>`

### 10.2 Режим
- Long polling (без входящих публичных портов).

### 10.3 Безопасность
- Разрешённые пользователи/чаты по whitelist.
- В группах команды принимаются от админов или whitelist.

---

## 11) UX-структура экранов

### 11.1 Live Meeting
- Header: название, таймер, REC, Start/Stop.
- Левая колонка: live transcript.
- Правая колонка: summary + insights (decisions/actions/risks/questions).
- Нижняя панель: `Ask Copilot` + быстрые кнопки.

### 11.2 Post-Meeting Report
- Структурированный minutes.
- Кнопки: `Export Markdown`, `Send to Telegram`.
- `Create tasks` — placeholder (post-MVP).

---

## 12) Алгоритм обработки данных

1. Браузер получает микрофонный поток.
2. Через WebRTC отправляет аудио в Realtime API.
3. Транскрипт приходит инкрементально.
4. Backend получает сегменты и запускает delta-обновление state.
5. LLM генерирует обновления summary и структурных блоков.
6. Состояние сохраняется в БД и отправляется в UI через WebSocket.
7. По `stop` формируется финальный отчёт и отправляется в Telegram.

---

## 13) Политика дедупликации

- Нормализация текста (lowercase, cleanup пунктуации/пробелов).
- Стабильный hash normalized text.
- Similarity matching для почти одинаковых формулировок.
- При конфликте — merge с приоритетом более полной записи.

---

## 14) Требования к безопасности и приватности

- API-ключи не должны попадать во frontend.
- Все секреты только в `.env` backend.
- Ephemeral token выдаётся с коротким TTL и ограничением области применения.
- `ELEVENLABS_API_KEY` хранится только на backend, ротация через env-конфиг.
- В логах маскировать секреты и PII.
- Функция удаления данных встречи обязательна.
- По умолчанию не сохранять сырой аудиопоток.

### 14.1 Переменные окружения (минимум)
- `STT_PROVIDER=openai|elevenlabs`
- `STT_FALLBACK_PROVIDER=openai|elevenlabs|none`
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `AI_PROVIDER=openai|anthropic` (для summary/Q&A/report)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_DEFAULT_CHAT_ID`

---

## 15) Полный план тестирования

## 15.1 Виды тестов
- **Unit (backend):** state manager, deduplication, export service, provider adapters.
- **Unit (frontend):** hooks (`useWebRTC`, `useWebSocket`, `useMeetingState`), панели UI.
- **Integration:** REST API, WebSocket поток, Telegram command flow.
- **E2E:** сценарий «старт встречи → live работа → стоп → отчёт → Telegram».
- **Resilience:** обрыв WS, истечение token, временная недоступность AI.
- **Security:** проверка whitelist Telegram, проверка утечек секретов.
- **Performance (MVP-базово):** задержка транскрипта, latency summary, время ответа команд.
- **Provider parity:** сравнение качества/задержки OpenAI vs ElevenLabs на одном наборе аудио.

## 15.2 Цели покрытия
- Core business logic backend: целевое покрытие не ниже 85%.
- AI adapter слой: не ниже 75% (с моками провайдеров).

## 15.3 Набор тест-кейсов (минимум)
1. Создание встречи возвращает валидный `meeting_id`.
2. Stop активной встречи фиксирует `ended_at` и генерирует report.
3. Дублирующиеся action items не создаются повторно.
4. WS reconnect восстанавливает `meeting.state`.
5. `/summary` отдаёт актуальный summary.
6. `/ask` возвращает ответ в контексте текущей встречи.
7. Запрещённый пользователь Telegram получает отказ.
8. Экспорт `.md` формируется корректно.
9. Режим `do_not_store_audio=true` не сохраняет аудио.
10. Потеря связи с AI приводит к graceful деградации, без падения backend.
11. При `STT_PROVIDER=elevenlabs` транскрипт проходит end-to-end без изменений UI-контракта.
12. При недоступности активного STT происходит fallback на резервный провайдер (если включен).

## 15.4 Критерии приёмки (Acceptance Criteria)
- На Windows (WSL2) и macOS воспроизводимо запускается локально.
- Функции FR-01…FR-08 выполняются без критических дефектов.
- Telegram-команды работают в long polling режиме.
- Финальный отчёт формируется и отправляется в Telegram.

---

## 16) Пошаговый план реализации (последовательный roadmap)

## Этап 0 — Инициализация проекта
- Репозиторная структура (backend/frontend/config/docs).
- Настройка линтеров, форматтеров, базовых тестов.
- `.env.example` и конфигурация окружений.

**Результат этапа:** проект собирается, локально запускается «пустой каркас».

## Этап 1 — Базовая платформа (meeting lifecycle)
- `POST /api/meetings`, `GET /api/meetings/{id}`, `POST /stop`.
- SQLite schema + репозитории.
- Базовый экран Live Meeting (Start/Stop, таймер, статус).

**Результат этапа:** можно создавать/завершать встречи и хранить state.

## Этап 2 — Realtime аудио и транскрипция
- `getUserMedia` + WebRTC канал в Realtime API.
- Ephemeral token endpoint в backend.
- Live transcript panel с таймкодами.
- Реализация STT-адаптера ElevenLabs Realtime + единый интерфейс STT провайдеров.

**Результат этапа:** рабочий realtime transcript в UI.

## Этап 3 — Intelligence layer
- State manager с delta processing.
- Live summary (30–60 сек).
- Извлечение `Decisions/Actions/Risks/Open Questions` + дедупликация.

**Результат этапа:** UI показывает структурированные инсайты в реальном времени.

## Этап 4 — Ask Copilot + Telegram
- WebSocket события `user.question`/`bot.answer`.
- Telegram bot long polling + команды.
- Автопост итогов после stop.

**Результат этапа:** двусторонняя работа через UI и Telegram.

## Этап 5 — Экспорт, стабилизация, релиз MVP
- Экспорт Markdown/HTML.
- Полный smoke/e2e прогон.
- Фиксация DoD и релизные инструкции.

**Результат этапа:** MVP готов к пилотному использованию.

---

## 17) Риски и меры снижения

1. **Плохая слышимость участников** → MVP режим микрофона + рекомендации по гарнитуре.
2. **Шум/эхо** → WebRTC constraints (echo cancellation, noise suppression).
3. **Дубли инсайтов** → hash + similarity + merge policy.
4. **Обрывы соединения** → retry/backoff + resync snapshot.
5. **Истечение ephemeral token** → предобновление токена до expiry.
6. **Деградация одного STT-провайдера** → резервный провайдер + health-check + fallback policy.

---

## 18) Definition of Done (MVP)

- Проект стабильно запускается на Windows WSL2 и macOS.
- Работает live transcript, live summary, insights extraction.
- Транскрипция подтверждена как минимум для двух режимов STT: OpenAI и ElevenLabs.
- Работает Ask Copilot в UI.
- Работает Telegram long polling и команды `/summary /actions /ask`.
- Автопост итогов после завершения встречи выполняется.
- Экспорт Markdown работает.
- Пройдены обязательные тесты и acceptance-критерии.

---

## 19) Сверка с сохранённой страницей Blitzy Platform.html

При сравнении с HTML-страницей в это ТЗ **добавлено/уточнено**:

1. Явно зафиксирован базовый стек реализации: `Python + FastAPI`, `React + Vite + TypeScript`, `python-telegram-bot`, `SQLite`.
2. Добавлен отдельный endpoint для ephemeral token: `POST /api/token/ephemeral`.
3. Уточнены требования по TTL ephemeral token (короткий срок, целевой 60 сек).
4. Уточнены требования по восстановлению WebSocket и ресинхронизации состояния.
5. Добавлены целевые метрики качества и SLA-like ограничения для MVP latency.
6. Добавлены конкретные цели test coverage (85% core, 75% AI adapters).
7. Добавлены security-проверки Telegram whitelist как обязательный тестовый блок.
8. Добавлены требования к graceful деградации при сбоях AI провайдера.
9. Добавлен полноценный последовательный roadmap этапов 0–5.

Все ключевые сущности и функции, описанные в текущем ТЗ, соответствуют содержимому сохранённой страницы; дополнительные пункты со страницы интегрированы в разделы 5, 7, 9, 14, 15 и 16.

---

## 20) Источники/референсы

- OpenAI Realtime API docs
- OpenAI Realtime transcription docs
- OpenAI Realtime WebRTC guide
- OpenAI Audio/STT guide
- ElevenLabs Speech-to-Text docs
- ElevenLabs Realtime Speech-to-Text docs
- FastAPI docs
- python-telegram-bot docs
