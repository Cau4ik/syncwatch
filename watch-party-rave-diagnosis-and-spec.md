# Watch Party Web: диагноз и полное ТЗ

Дата: 23 марта 2026

## 1. Что именно нужно сделать

Нужно не "скопировать Rave 1 в 1", а построить веб-приложение по той же продуктовой механике:

- комната совместного просмотра;
- синхронный видеоплеер;
- текстовый чат;
- голосовой чат;
- ссылка-приглашение;
- роли в комнате;
- современный desktop-first интерфейс.

Правильная формулировка продукта:

**Browser-based watch party platform for lawful video sources.**

То есть это не "онлайн-кинотеатр", а сервис совместного просмотра разрешенного видео в реальном времени.

## 2. Короткий диагноз Rave

По официальным страницам Rave на 23 марта 2026 года ядро продукта выглядит так:

- совместный просмотр видео "в синхроне";
- текстовый и голосовой чат внутри комнаты;
- приглашение друзей по ссылке;
- поддержка внешних видеоисточников;
- учетные записи, история, социальные механики;
- модерация и safety-инфраструктура.

Официальные страницы Rave прямо описывают сервис как продукт, где люди смотрят видео вместе, общаются текстом и голосом, приглашают друзей и используют сторонние сервисы в рамках их собственных правил.

### 2.1. В чем реальная ценность продукта

Главная ценность Rave не в плеере и не в каталоге.

Главная ценность:

- ощущение "мы смотрим одно и то же одновременно";
- вход в комнату без боли;
- минимальная задержка между участниками;
- живое общение поверх просмотра;
- эффект совместного присутствия.

Если синхронизация слабая, продукт разваливается. Если чат и голос хорошие, а синхронизация плохая, это уже не watch party.

### 2.2. Что составляет ядро продукта

Ядро продукта состоит из 6 модулей:

1. Аутентификация и профиль.
2. Комнаты и приглашения.
3. Источники видео.
4. Синхронизация воспроизведения в realtime.
5. Текстовый чат.
6. Голосовой канал.

Все остальное вторично.

### 2.3. Что у Rave сильнее всего

- Очень понятный use case.
- Низкий порог входа: зашел, кинул ссылку, смотришь.
- Социальный слой встроен прямо в просмотр.
- Комнатная модель масштабируется на разные сценарии: друзья, пары, комьюнити.

### 2.4. Где можно сделать лучше, чем Rave

В веб-продукте можно выиграть у Rave в таких местах:

- более сильный desktop UX;
- чище и современнее интерфейс;
- лучшая комната на большом экране;
- понятнее роли и модерация;
- заметно лучшее состояние reconnect, loading, syncing;
- прозрачнее права на контент и ограничения;
- аккуратнее onboarding для гостя.

### 2.5. Что нельзя копировать

Нельзя копировать:

- бренд Rave;
- название;
- логотип;
- фирменные иллюстрации;
- точный UI 1 в 1;
- тексты legal-документов;
- приватные или недокументированные интеграции.

Можно копировать только **продуктовую механику**, но не бренд и не визуальную айдентику.

## 3. Практический диагноз твоего макета

По присланному экрану направление правильное. Это уже не "идея", а нормальная схема боевого room UI.

### 3.1. Что в макете уже сильное

- Сразу понятен главный сценарий: смотреть видео вместе.
- Плеер занимает основное внимание, это правильно.
- Чат вынесен справа и не мешает просмотру.
- Список участников рядом с чатом логично поддерживает социальный контекст.
- Есть invite link, счетчик участников, кнопка выхода из комнаты.
- Есть быстрые действия: пригласить, микрофон, камера, реакции.
- Визуально направление похоже на смесь streaming UI и community UI, это сильнее, чем просто "плеер на странице".

### 3.2. Что в макете пока не показано, но обязательно нужно

- индикатор роли пользователя: host, moderator, guest;
- индикатор состояния синхронизации;
- источник видео и статус подключения;
- системные сообщения в чате;
- состояния reconnect и resync;
- блок смены видеоисточника;
- mobile-layout комнаты;
- mute/deafen/speaking state для голоса;
- moderation actions;
- empty/loading/error states.

### 3.3. Вывод по дизайну

UI уже близок к правильному продукту. Делать надо не "еще красивее", а "надежнее и понятнее в реальном времени". Для watch party интерфейса важнее:

- контроль комнаты;
- понятные состояния;
- скорость входа;
- стабильность sync;
- ясные права и действия.

## 4. Главное ограничение: контент и законность

Это критический блок. Его нельзя игнорировать.

По официальным Terms и FAQ Rave:

- доступ к стороннему контенту зависит от правил самих платформ;
- пользователь сам должен иметь право смотреть или стримить такой контент;
- платные сервисы требуют собственную подписку пользователя;
- нельзя обещать запись, скачивание или копирование чужих потоков;
- модерация и safety обязательны.

### 4.1. Что это значит для твоего проекта

На MVP нельзя обещать:

- Netflix/Disney/Prime/HBO "как в Rave" без официально разрешенной веб-интеграции;
- обход подписок;
- проксирование или ретрансляцию защищенного контента;
- запись потоков;
- массовую раздачу пиратского видео.

### 4.2. Что можно поддерживать на MVP безопасно

- YouTube через официальный iframe/API;
- загруженные пользователем mp4/webm;
- HLS `.m3u8` по разрешенному URL;
- собственный каталог контента, если у тебя есть права;
- публично доступные и разрешенные embed-источники.

### 4.3. Что обязательно заложить в продукт

- Terms of Service;
- Privacy Policy;
- механизм жалоб;
- бан/мут;
- удаление запрещенного контента;
- явное описание, что пользователь несет ответственность за загружаемый контент.

## 5. Продуктовая стратегия: как правильно ставить задачу Codex

Самая частая ошибка: пытаться заставить Codex "сразу сделать весь Rave".

Это плохая постановка, потому что в одном большом заходе он, скорее всего, сгенерирует слишком широкий и рыхлый проект.

Правильный путь:

1. Сначала MVP.
2. Потом v1.
3. Потом production hardening.

### 5.1. Правильный состав MVP

В MVP должны войти только:

- регистрация и вход;
- guest join по имени;
- создание комнаты;
- вход по ссылке;
- YouTube;
- загрузка своего видео;
- HLS по ссылке;
- синхронный play/pause/seek/load;
- текстовый чат;
- голосовой чат;
- список участников;
- роли host/user/guest;
- базовый профиль;
- адаптивный room UI;
- базовая модерация.

### 5.2. Что не надо включать в первую версию

- полный аналог Netflix-интеграций;
- сложный recommendation engine;
- социальная лента;
- DMs;
- marketplace;
- AI-монтаж видео;
- сложный каталог с CMS;
- сложную аналитику;
- многоуровневую подписку.

## 6. Полное ТЗ

## 6.1. Название проекта

Рабочее название:

- `SyncWatch`
- `WatchTogether`
- `RoomPlay`
- `SyncRoom`

Финальное название должно быть оригинальным и не пересекаться с брендом Rave.

## 6.2. Цель проекта

Разработать fullstack веб-приложение для совместного просмотра видео с друзьями в реальном времени, с комнатами, синхронным воспроизведением, текстовым чатом, голосовым чатом и ссылками-приглашениями.

## 6.3. Формат продукта

- web app;
- desktop-first;
- mobile-friendly;
- realtime;
- SPA/SSR hybrid;
- room-centric UX.

## 6.4. Целевая аудитория

- друзья;
- пары;
- онлайн-компании;
- студенты;
- небольшие комьюнити;
- люди, которые хотят смотреть YouTube и собственные видео вместе.

## 6.5. Роли

### Guest

Может:

- зайти в комнату по ссылке;
- ввести display name;
- смотреть видео;
- писать в чат;
- заходить в voice, если комната разрешает;
- видеть участников.

Не может:

- создавать persistent-комнаты;
- хранить историю;
- редактировать профиль;
- использовать friend system.

### Registered User

Может:

- зарегистрироваться и войти;
- создавать комнаты;
- иметь профиль;
- хранить историю;
- загружать свои видео;
- приглашать друзей;
- иметь список друзей в v1.

### Host

Может:

- загружать и менять источник видео;
- управлять воспроизведением;
- выдавать модератора;
- кикать пользователей;
- менять приватность комнаты;
- передавать host-права;
- закрывать комнату;
- включать chat slow mode или mute room.

### Moderator

Может:

- удалять сообщения;
- мутить пользователей;
- кикать по разрешенным правилам;
- помогать вести комнату.

### Admin

Может:

- банить пользователей;
- просматривать жалобы;
- просматривать комнаты;
- снимать запрещенный контент;
- смотреть moderation logs.

## 6.6. User stories

- Я могу создать комнату за 10 секунд и пригласить друга ссылкой.
- Я могу зайти в комнату как гость без полной регистрации.
- Я вижу то же самое видео и то же самое время, что и остальные.
- Я могу общаться в чате во время просмотра.
- Я могу зайти в голосовой канал и говорить без отдельного Discord.
- Я вижу, кто управляет комнатой.
- Я могу загрузить свое видео и смотреть его вместе.
- Я могу безопасно покинуть комнату и вернуться без потери контекста.

## 6.7. Основные сценарии

### Сценарий A: быстрый вход

1. Пользователь открывает сайт.
2. Нажимает "Создать комнату".
3. Выбирает источник видео.
4. Получает ссылку.
5. Отправляет другу.
6. Друг входит по ссылке как гость.
7. Оба видят один room state.

### Сценарий B: загрузка собственного видео

1. Пользователь входит в аккаунт.
2. Загружает mp4/webm.
3. Сервер сохраняет файл в object storage.
4. Создается video asset.
5. Host добавляет asset в комнату.
6. Все участники получают `video.load`.

### Сценарий C: позднее подключение

1. Пользователь заходит в уже идущую комнату.
2. Сервер отдает текущий snapshot комнаты.
3. Клиент загружает источник.
4. Клиент переходит на актуальный timecode.
5. Если комната в `playing`, клиент запускает воспроизведение.

## 6.8. Функциональные требования

### Аутентификация

- регистрация по email/password;
- вход по email/password;
- Google OAuth;
- refresh token flow;
- logout;
- восстановление пароля;
- защищенные маршруты;
- поддержка guest session.

### Профиль

- username;
- avatar;
- bio;
- createdAt;
- lastSeenAt;
- online/in-room status;
- история просмотров;
- мои комнаты;
- мои загруженные видео.

### Комнаты

- создать комнату;
- public / unlisted / private;
- пароль на комнату опционально;
- join by link;
- ограничение числа участников;
- список участников;
- роли;
- закрытие комнаты;
- удаление комнаты;
- handoff host.

### Видеоисточники MVP

- YouTube link;
- uploaded mp4/webm;
- HLS `.m3u8`;
- internal catalog item.

### Синхронизация

- load source;
- play;
- pause;
- seek;
- rejoin sync;
- resync heartbeat;
- drift correction;
- host authority;
- server snapshot.

### Чат

- realtime сообщения;
- системные сообщения;
- удаление сообщения;
- mute user;
- slow mode;
- emoji reactions в v1.

### Голос

- join/leave voice;
- mute/unmute;
- speaking indicator;
- reconnect after network loss;
- volume per user;
- device selection в v1.

### Социальные функции v1

- friend requests;
- invite to room;
- notification center;
- room history;
- favorites / recent.

### Админка

- users list;
- rooms list;
- reports list;
- bans;
- moderation log;
- flagged uploads.

## 6.9. Нефункциональные требования

### Производительность

- TTFB главной страницы в норме при SSR;
- вход в комнату без тяжелого initial payload;
- чат с низкой задержкой;
- room UI не должен лагать при активном чате;
- room snapshot должен загружаться быстро.

### Realtime качество

- команда play/pause/seek доставляется всем участникам быстро;
- при reconnect пользователь возвращается в актуальное состояние;
- drift должен автоматически выравниваться.

### Масштабирование

- backend должен поддерживать горизонтальное масштабирование;
- Socket.IO должен быть совместим с Redis adapter;
- presence и room state не должны зависеть от одного процесса.

### Безопасность

- пароли через Argon2id или bcrypt;
- rate limiting;
- input validation;
- XSS protection;
- CSRF protection там, где используются cookie-based refresh flows;
- secure cookies;
- audit logging для админ-действий.

### Доступность

- клавиатурная навигация;
- фокус-стейты;
- aria labels;
- достаточная контрастность;
- понятные статусы для screen readers.

### Адаптивность

- desktop 1440+;
- laptop 1024+;
- tablet;
- mobile portrait.

## 6.10. Рекомендуемый стек

### Архитектурный выбор

Рекомендуется monorepo:

- `apps/web`
- `apps/api`
- `packages/shared`
- `packages/config`
- `packages/ui` опционально

### Frontend

- Next.js с App Router;
- TypeScript;
- Tailwind CSS;
- shadcn/ui;
- TanStack Query;
- Zustand для transient room state;
- Socket.IO client;
- hls.js;
- YouTube IFrame API;
- React Hook Form + Zod.

### Backend

- NestJS или Fastify-based API;
- TypeScript;
- Prisma ORM;
- Socket.IO;
- Redis;
- BullMQ опционально для фоновых задач;
- ffprobe/metadata extraction для uploaded video pipeline.

### Database

- PostgreSQL.

### Storage

- S3-compatible object storage.

### Voice

Практический выбор:

- Production: LiveKit или mediasoup SFU.
- Упрощенный MVP: WebRTC с signaling через Socket.IO и строгим лимитом на число голосовых участников.

Если цель реально довести продукт до нормального качества, лучше не строить voice на чистом mesh для больших комнат.

### Infra

- Docker;
- Docker Compose для локального запуска;
- Nginx / Caddy;
- Redis;
- TURN server;
- CI/CD.

## 6.11. Архитектура системы

### Frontend слои

- app routes;
- auth layer;
- room state store;
- socket transport layer;
- player adapters;
- UI component library;
- query/mutation layer;
- voice session layer.

### Backend сервисы

- auth service;
- user service;
- room service;
- playback sync service;
- chat service;
- upload service;
- invite service;
- moderation service;
- admin service;
- notification service.

### Ключевой принцип

Сервер является источником истины для состояния комнаты.

Клиент не "угадывает", а получает room snapshot и применяет локальную коррекцию.

## 6.12. Room state model

Минимальная серверная модель комнаты:

- `roomId`
- `slug`
- `title`
- `visibility`
- `hostUserId`
- `sourceType`
- `sourceRef`
- `playbackState`
- `currentTime`
- `playbackRate`
- `serverTimestamp`
- `lastActionId`
- `participantsCount`
- `chatPolicy`
- `voicePolicy`

### Правило синхронизации

Если `playbackState = playing`, клиент рассчитывает ожидаемую позицию так:

`expectedTime = currentTime + (now - serverTimestamp)`

Далее:

- если drift < 300 ms, ничего не делать;
- если drift 300-1250 ms, мягко скорректировать;
- если drift > 1250 ms, сделать hard seek;
- каждые 3-5 секунд отправлять soft resync.

### Приоритет управления

- только host инициирует `video.load`;
- только host или разрешенный moderator инициирует `seek` и `pause/play`;
- сервер валидирует право на действие;
- события имеют `lastActionId`, чтобы избежать рассинхрона и дублей.

## 6.13. Голосовая архитектура

### MVP

- signaling через Socket.IO;
- WebRTC audio;
- STUN/TURN;
- speaking indicators;
- reconnect logic.

### Production рекомендация

Для комнат более 4-6 голосовых участников желательно использовать SFU.

Иначе:

- растет нагрузка на клиент;
- ухудшается качество;
- сложнее поддерживать стабильность;
- мобильные устройства страдают первыми.

## 6.14. Страницы приложения

### Public

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/legal/terms`
- `/legal/privacy`
- `/404`

### Authenticated

- `/dashboard`
- `/rooms`
- `/rooms/[slug]`
- `/profile/[username]`
- `/settings`
- `/uploads`
- `/friends` в v1

### Admin

- `/admin`
- `/admin/users`
- `/admin/rooms`
- `/admin/reports`
- `/admin/uploads`

## 6.15. Структура страницы комнаты

### Desktop

- сверху: название комнаты, статус, invite, participants count, settings, leave;
- центр: видеоплеер;
- под плеером: source bar, playback controls, sync status, room actions;
- справа: чат, voice status, участники;
- снизу или в тулбаре: invite, mic, camera optional, reactions, fullscreen.

### Mobile

- видео сверху;
- под видео компактная control bar;
- табы `Chat / People / Voice`;
- fixed action button для invite;
- chat input липнет к низу экрана.

## 6.16. Данные и БД

### Таблицы

#### `users`

- `id`
- `email`
- `username`
- `password_hash`
- `avatar_url`
- `bio`
- `auth_provider`
- `created_at`
- `updated_at`
- `last_seen_at`
- `status`

#### `sessions`

- `id`
- `user_id`
- `refresh_token_hash`
- `ip`
- `user_agent`
- `expires_at`
- `created_at`

#### `rooms`

- `id`
- `slug`
- `title`
- `owner_id`
- `visibility`
- `password_hash`
- `max_participants`
- `source_type`
- `source_ref`
- `playback_state`
- `current_time`
- `playback_rate`
- `server_timestamp`
- `is_archived`
- `created_at`
- `updated_at`

#### `room_members`

- `id`
- `room_id`
- `user_id` nullable for guests
- `guest_name` nullable
- `role`
- `joined_at`
- `left_at`

#### `messages`

- `id`
- `room_id`
- `user_id` nullable
- `guest_name` nullable
- `type`
- `text`
- `deleted_at`
- `created_at`

#### `uploaded_videos`

- `id`
- `owner_id`
- `title`
- `storage_key`
- `public_url`
- `preview_url`
- `duration_seconds`
- `mime_type`
- `size_bytes`
- `created_at`

#### `friendships`

- `id`
- `requester_id`
- `addressee_id`
- `status`
- `created_at`

#### `invites`

- `id`
- `room_id`
- `sender_id`
- `receiver_id`
- `status`
- `created_at`

#### `watch_history`

- `id`
- `user_id`
- `room_id`
- `source_type`
- `source_ref`
- `watched_at`

#### `reports`

- `id`
- `reporter_id`
- `target_user_id`
- `target_room_id`
- `target_message_id`
- `reason`
- `status`
- `created_at`

#### `moderation_actions`

- `id`
- `actor_user_id`
- `target_user_id`
- `room_id`
- `action_type`
- `reason`
- `created_at`

## 6.17. API

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Users

- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/users/:username`
- `GET /api/users/search?q=...`

### Rooms

- `POST /api/rooms`
- `GET /api/rooms`
- `GET /api/rooms/:slug`
- `PATCH /api/rooms/:id`
- `DELETE /api/rooms/:id`
- `POST /api/rooms/:id/join`
- `POST /api/rooms/:id/leave`
- `POST /api/rooms/:id/transfer-host`
- `POST /api/rooms/:id/kick`

### Uploads

- `POST /api/uploads/video`
- `GET /api/uploads`
- `GET /api/uploads/:id`
- `DELETE /api/uploads/:id`

### Friends v1

- `POST /api/friends/request`
- `POST /api/friends/accept`
- `POST /api/friends/reject`
- `GET /api/friends/list`

### Reports

- `POST /api/reports`

### Admin

- `GET /api/admin/users`
- `GET /api/admin/rooms`
- `GET /api/admin/reports`
- `POST /api/admin/users/:id/ban`
- `POST /api/admin/users/:id/unban`

## 6.18. Socket events

### Client -> Server

- `room:join`
- `room:leave`
- `room:heartbeat`
- `video:load`
- `video:play`
- `video:pause`
- `video:seek`
- `video:resync-request`
- `chat:send`
- `chat:delete`
- `voice:join`
- `voice:leave`
- `voice:signal`
- `room:kick`
- `room:set-host`
- `room:set-role`

### Server -> Client

- `room:state`
- `room:users`
- `room:user-joined`
- `room:user-left`
- `video:state`
- `video:sync`
- `chat:message`
- `chat:deleted`
- `voice:signal`
- `voice:user-speaking`
- `system:notice`
- `room:error`

## 6.19. UX-логика синхронизации

### Общий принцип

- любое действие host отправляется на сервер;
- сервер валидирует право действия;
- сервер обновляет canonical room state;
- сервер рассылает новое состояние участникам;
- клиенты применяют состояние и корректируют локальный плеер.

### Join flow

1. Клиент получает initial room snapshot.
2. Клиент определяет `sourceType`.
3. Загружает соответствующий player adapter.
4. Переходит в `currentTime`.
5. Если комната в `playing`, запускает локальное воспроизведение.
6. Через короткое время делает verification sync.

### Reconnect flow

1. Клиент теряет socket.
2. UI показывает `Reconnecting...`.
3. После повторного подключения клиент запрашивает fresh snapshot.
4. Если локальный player state устарел, клиент делает hard correction.

## 6.20. Player adapters

Нужно явно разделить адаптеры:

- `YouTubePlayerAdapter`
- `Html5VideoAdapter`
- `HlsPlayerAdapter`

Общий интерфейс:

- `load(source)`
- `play()`
- `pause()`
- `seek(time)`
- `getCurrentTime()`
- `getState()`
- `destroy()`

Это позволит не смешивать логику sync и конкретного плеера.

## 6.21. Права и модерация

### Room-level moderation

- kick user;
- mute chat;
- delete message;
- guest name validation;
- invite abuse protection.

### Platform-level moderation

- report user;
- report room;
- report message;
- ban user;
- remove upload;
- audit logs.

### Антиабьюз

- rate limit на сообщения;
- rate limit на создание комнат;
- ограничения на upload size и mime type;
- URL validation для внешних источников;
- profanity filter опционально;
- link scanning в v1.

## 6.22. Загрузка видео

### Требования

- поддержка `mp4` и `webm`;
- проверка mime type;
- ограничение размера;
- прогресс загрузки;
- извлечение duration и metadata;
- генерация превью опционально;
- удаление файла владельцем;
- привязка к пользователю.

### Pipeline

1. Клиент получает signed upload URL.
2. Загружает файл в storage.
3. Backend подтверждает upload.
4. Создается запись `uploaded_videos`.
5. В фоне извлекаются metadata.
6. Asset становится доступен для комнаты.

## 6.23. Search и catalog

На MVP каталог не должен становиться отдельным тяжелым продуктом.

Минимум:

- recent videos;
- my uploads;
- pinned catalog items;
- room-ready quick select.

Полный Netflix-style каталог можно делать только после того, как стабилизированы комнаты.

## 6.24. Логи, метрики, observability

Нужно предусмотреть:

- structured logs;
- error tracking;
- socket event logging;
- room lifecycle logging;
- upload errors;
- moderation logs;
- metrics по room join success, reconnect rate, sync drift, chat latency.

## 6.25. Тестирование

### Frontend

- unit tests для player adapters;
- component tests для room controls;
- integration tests для auth flows;
- e2e tests для join room / sync / chat.

### Backend

- unit tests для services;
- integration tests для auth, rooms, uploads;
- socket tests для playback sync;
- permission tests для host/moderator/admin.

### Критические e2e сценарии

- создание комнаты и join по ссылке;
- host play/pause/seek;
- late join в активную комнату;
- чат между двумя пользователями;
- голосовой reconnect;
- upload video и запуск в комнате.

## 6.26. Definition of Done для MVP

MVP считается готовым, если:

- пользователь может зарегистрироваться;
- гость может войти по имени;
- пользователь может создать комнату;
- другой пользователь может зайти по ссылке;
- можно загрузить YouTube или собственное видео;
- play/pause/seek/load синхронизируются;
- чат работает в realtime;
- голосовой канал подключается;
- список участников обновляется;
- host controls работают;
- интерфейс адаптивен;
- есть базовые legal pages;
- есть Docker Compose и README.

## 6.27. Ограничения первой версии

В первой версии надо явно зафиксировать:

- поддерживаются только разрешенные источники;
- нет обещаний по Netflix/Disney/Prime;
- нет записи видео и скачивания потоков;
- нет публичного "пиратского каталога";
- нет room sizes без технических лимитов;
- голос имеет лимит, определенный выбранной voice-архитектурой.

## 6.28. Приоритеты разработки

### P0

- auth;
- rooms;
- invite link;
- sync engine;
- YouTube;
- uploaded video;
- HLS;
- chat;
- voice;
- room UI;
- security basics;
- Docker setup.

### P1

- friends;
- history;
- notifications;
- moderation dashboard;
- upload preview;
- reactions;
- room persistence.

### P2

- catalog;
- advanced analytics;
- subscription/payments;
- advanced recommendation;
- richer admin tooling.

## 7. Рекомендуемая структура проекта

```text
syncwatch/
  apps/
    web/
      src/
        app/
        components/
        features/
        lib/
        hooks/
        styles/
    api/
      src/
        modules/
          auth/
          users/
          rooms/
          chat/
          playback/
          uploads/
          moderation/
          admin/
        common/
        config/
        socket/
  packages/
    shared/
      src/
        types/
        constants/
        zod/
    ui/
    config/
  prisma/
    schema.prisma
    migrations/
  docker/
  .env.example
  docker-compose.yml
  README.md
```

## 8. Environment variables

Минимальный набор:

```env
NODE_ENV=
WEB_URL=
API_URL=
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
COOKIE_DOMAIN=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
TURN_URL=
TURN_USERNAME=
TURN_PASSWORD=
YOUTUBE_API_KEY=
```

## 9. Что именно попросить у Codex

Ниже хороший промпт. Он намного практичнее, чем просьба "сделай полный Rave сразу".

### Готовый промпт для Codex

```text
Сделай production-style monorepo fullstack веб-приложение для совместного просмотра видео с друзьями, вдохновленное механикой watch-party сервиса наподобие Rave, но без копирования бренда, логотипов и интерфейса 1 в 1.

Цель:
Создать browser-based watch party platform для разрешенных видеоисточников.

Обязательный scope MVP:
1. Frontend: Next.js + TypeScript + Tailwind + shadcn/ui.
2. Backend: NestJS или Fastify-based API на TypeScript.
3. DB: PostgreSQL + Prisma.
4. Realtime: Socket.IO для rooms, chat и playback sync.
5. Voice: WebRTC audio с signaling через Socket.IO. Если для production качества нужен отдельный voice layer, подготовь архитектуру под LiveKit или SFU, но оставь рабочий MVP.
6. Auth: email/password, Google OAuth, JWT access token, refresh token.
7. Guest join: вход в комнату по ссылке с display name без обязательной регистрации.
8. Rooms: create, join by link, public/unlisted/private, password optional, host transfer, kick user.
9. Video sources MVP: YouTube link через iframe API, uploaded mp4/webm, HLS .m3u8 по валидному URL.
10. Sync: load video, play, pause, seek, late join snapshot, periodic drift correction, reconnect resync.
11. Room page: video player, participants list, text chat, voice section, invite link, sync status, host controls.
12. Chat: realtime messages, system messages, delete by moderator/host, basic rate limit.
13. Profile: username, avatar, bio, uploads, watch history.
14. Moderation MVP: report user/message/room, ban/mute/kick primitives, admin area skeleton.
15. Security: input validation, XSS protection, Argon2 or bcrypt, secure refresh cookie, rate limit, upload validation.
16. Uploads: S3-compatible storage integration, metadata extraction, size and mime validation.
17. Architecture: clear separation between player adapters, room sync service, socket layer, auth layer.
18. Required deliverables: full project structure, Prisma schema, backend modules, socket handlers, frontend pages, reusable UI components, player adapters, Docker Compose, .env.example, README, seed data, basic tests.
19. Add legal placeholder pages for Terms and Privacy with clear wording that only lawful/authorized content is allowed.
20. Do not implement Netflix/Disney/Prime integrations, do not promise copyrighted third-party streams, do not implement video downloading/recording.

Качество реализации:
- clean architecture;
- strongly typed DTOs and events;
- Zod or equivalent validation;
- production-style folder structure;
- reusable components;
- responsive room layout;
- SSR/CSR split where appropriate;
- realistic loading, empty, error and reconnect states.

Room sync requirements:
- server is source of truth;
- keep canonical playback state in backend;
- on join return room snapshot;
- if playing, client calculates expected time using server timestamp;
- soft resync every 3-5 seconds;
- hard seek when drift is too large;
- protect host-only actions on backend.

UI direction:
- cinematic dark streaming UI;
- desktop-first;
- mobile-friendly;
- clean and modern, but not copying Rave visually.

Also generate:
- README with local setup and run instructions;
- docker-compose for web, api, postgres, redis;
- Prisma migrations;
- sample seed with demo room, demo users and demo messages.
```

## 10. Что я бы рекомендовал изменить в твоей исходной идее

Если задача звучит как "сделай сайт как Rave, но только для видео", то лучшая формулировка такая:

**Не делать клон всех функций Rave. Делать сильный веб-MVP совместного просмотра видео.**

Это означает:

- фокус на room experience;
- фокус на sync;
- фокус на chat/voice;
- минимум источников, но законных и стабильных;
- сильный UI;
- простая архитектура для последующего роста.

## 11. Финальный вывод

Твой проект уже попадает в правильную категорию продукта: веб-аналог watch party сервиса.

Если сделать хорошо 5 вещей:

- быстрый вход;
- стабильный sync;
- нормальный room UI;
- хороший chat/voice;
- понятные правила по контенту;

то получится не "клон ради клона", а полноценный конкурентный веб-продукт.

## 12. Проверенные официальные источники Rave

Использованы официальные страницы Rave, проверенные 23 марта 2026 года:

- About: https://rave.io/ru/about
- FAQ: https://rave.io/ru/faq
- Terms: https://rave.io/ru/terms
- Privacy: https://rave.io/privacy
- Safety: https://rave.io/safety
