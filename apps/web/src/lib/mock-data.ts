import type { RoomState } from "@syncwatch/shared";

export const featureCards = [
  {
    title: "Синхронный просмотр",
    text: "Хост управляет комнатой, а клиенты получают одно canonical playback state и мягкий resync."
  },
  {
    title: "Комната как хаб",
    text: "Плеер, чат, участники, инвайт и голос собраны в одном устойчивом room UX."
  },
  {
    title: "Законные источники",
    text: "YouTube, HLS и пользовательские загрузки без обещаний по закрытым стриминговым платформам."
  }
];

export const dashboardRooms = [
  {
    slug: "cyber-city-night",
    title: "Киноночь под дождем",
    members: 8,
    status: "Сейчас в эфире",
    category: "Фантастика"
  },
  {
    slug: "lofi-hangout",
    title: "Lo-fi c друзьями",
    members: 5,
    status: "Ожидает старт",
    category: "Музыка"
  },
  {
    slug: "anime-marathon",
    title: "Аниме марафон",
    members: 12,
    status: "Идет обсуждение",
    category: "Сериалы"
  }
];

export const demoRoom: RoomState = {
  id: "room_demo_1",
  slug: "cyber-city-night",
  title: "Вечер кино с друзьями",
  category: "Фантастика",
  hostId: "user_alex",
  visibility: "private",
  inviteUrl: "syncwatch.app/room/cyber-city-night",
  playback: {
    sourceType: "youtube",
    sourceRef: "dQw4w9WgXcQ",
    title: "Neon Skyline Cut",
    coverImage:
      "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=80",
    currentTime: 2732,
    duration: 8095,
    state: "playing",
    playbackRate: 1,
    serverTimestamp: Date.now()
  },
  participants: [
    { id: "user_alex", name: "Алекс", role: "host", avatar: "А", status: "online", isSpeaking: true },
    { id: "user_masha", name: "Маша", role: "user", avatar: "М", status: "online" },
    { id: "user_dima", name: "Дима", role: "moderator", avatar: "Д", status: "online", isMuted: false },
    { id: "guest_ks", name: "Ксюша", role: "guest", avatar: "К", status: "typing" },
    { id: "user_sanya", name: "Саня", role: "user", avatar: "С", status: "listening", isMuted: true }
  ],
  messages: [
    { id: "m1", authorId: "user_alex", authorName: "Алекс", avatar: "А", text: "Всем привет! Сегодня идем ровно по таймкоду.", createdAt: "20:41", type: "user" },
    { id: "m2", authorId: "user_masha", authorName: "Маша", avatar: "М", text: "Уже с попкорном. Погнали.", createdAt: "20:42", type: "user" },
    { id: "m3", authorId: "system", authorName: "Система", avatar: "S", text: "Дима получил роль moderator.", createdAt: "20:42", type: "system" },
    { id: "m4", authorId: "guest_ks", authorName: "Ксюша", avatar: "К", text: "Вау, кадр просто сумасшедший.", createdAt: "20:43", type: "user" },
    { id: "m5", authorId: "user_alex", authorName: "Алекс", avatar: "А", text: "Если у кого drift, жмите resync.", createdAt: "20:44", type: "user" }
  ]
};
