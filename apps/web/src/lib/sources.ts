import type { LaunchSource, SourceType } from "@syncwatch/shared";

export interface LaunchSourceDefinition {
  id: LaunchSource;
  label: string;
  description: string;
  helper: string;
  placeholder: string;
  externalUrl?: string;
  accent: string;
}

export const launchSources: LaunchSourceDefinition[] = [
  {
    id: "youtube",
    label: "YouTube",
    description: "Вставь ссылку на YouTube или ID видео и запусти синхронную комнату.",
    helper: "Открой YouTube, выбери видео, скопируй ссылку и создай комнату.",
    placeholder: "https://www.youtube.com/watch?v=...",
    externalUrl: "https://www.youtube.com/",
    accent: "radial-gradient(circle at top left, rgba(255,111,97,0.22), transparent 48%)"
  },
  {
    id: "vkvideo",
    label: "VK Видео",
    description: "Создай комнату по публичной ссылке VK Видео.",
    helper: "Выбери публичное видео VK, скопируй ссылку и создай комнату здесь.",
    placeholder: "https://vk.com/video...",
    externalUrl: "https://vk.com/video",
    accent: "radial-gradient(circle at top left, rgba(76,139,245,0.24), transparent 48%)"
  },
  {
    id: "rutube",
    label: "Rutube",
    description: "Запусти совместный просмотр по публичной ссылке Rutube.",
    helper: "Открой Rutube, выбери видео и вставь публичную ссылку.",
    placeholder: "https://rutube.ru/video/...",
    externalUrl: "https://rutube.ru/",
    accent: "radial-gradient(circle at top left, rgba(20,217,141,0.22), transparent 48%)"
  },
  {
    id: "twitch",
    label: "Twitch",
    description: "Используй ссылку на Twitch-канал или запись как источник комнаты.",
    helper: "Для стримов используй ссылку на канал. Для записей используй ссылку вида /videos/...",
    placeholder: "https://www.twitch.tv/... или /videos/...",
    externalUrl: "https://www.twitch.tv/",
    accent: "radial-gradient(circle at top left, rgba(155,109,255,0.24), transparent 48%)"
  },
  {
    id: "file",
    label: "Ссылка на файл",
    description: "Запусти комнату по прямой ссылке на MP4, WebM или M3U8.",
    helper: "Используй прямую ссылку на медиафайл. Локальная загрузка с компьютера в этом MVP пока не поддерживается.",
    placeholder: "https://cdn.example.com/video.mp4",
    accent: "radial-gradient(circle at top left, rgba(255,202,87,0.24), transparent 48%)"
  },
  {
    id: "link",
    label: "Веб-ссылка",
    description: "Создай комнату по встраиваемой странице или ссылке на HLS-поток.",
    helper: "Используй это для публичных embed-ссылок и потоков, если для сервиса нет отдельной карточки.",
    placeholder: "https://example.com/embed/... или stream.m3u8",
    accent: "radial-gradient(circle at top left, rgba(124,247,212,0.22), transparent 48%)"
  }
];

export function getLaunchSource(source: string) {
  return launchSources.find((item) => item.id === source);
}

const sourceLabels: Record<SourceType | LaunchSource, string> = {
  youtube: "YouTube",
  vkvideo: "VK Видео",
  rutube: "Rutube",
  twitch: "Twitch",
  file: "Ссылка на файл",
  link: "Веб-ссылка",
  upload: "Ссылка на файл",
  hls: "Ссылка на поток",
  url: "Embed-ссылка",
  internal: "Внутренний источник"
};

export function getSourceLabel(source: SourceType | LaunchSource) {
  return sourceLabels[source];
}
