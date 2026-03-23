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
    description: "Paste a YouTube link or video ID and launch a synced room.",
    helper: "Open YouTube, pick a video, copy the link, then create the room.",
    placeholder: "https://www.youtube.com/watch?v=...",
    externalUrl: "https://www.youtube.com/",
    accent: "radial-gradient(circle at top left, rgba(255,111,97,0.22), transparent 48%)"
  },
  {
    id: "vkvideo",
    label: "VK Video",
    description: "Create a room from a public VK Video link.",
    helper: "Pick a public VK Video item, copy its URL, then generate the room here.",
    placeholder: "https://vk.com/video...",
    externalUrl: "https://vk.com/video",
    accent: "radial-gradient(circle at top left, rgba(76,139,245,0.24), transparent 48%)"
  },
  {
    id: "rutube",
    label: "Rutube",
    description: "Launch a watch party from a Rutube public video page.",
    helper: "Open Rutube, choose a video, and paste the public link.",
    placeholder: "https://rutube.ru/video/...",
    externalUrl: "https://rutube.ru/",
    accent: "radial-gradient(circle at top left, rgba(20,217,141,0.22), transparent 48%)"
  },
  {
    id: "twitch",
    label: "Twitch",
    description: "Use a Twitch VOD or channel link as the room source.",
    helper: "For live streams use a channel link. For replays use a /videos/... link.",
    placeholder: "https://www.twitch.tv/... or /videos/...",
    externalUrl: "https://www.twitch.tv/",
    accent: "radial-gradient(circle at top left, rgba(155,109,255,0.24), transparent 48%)"
  },
  {
    id: "file",
    label: "File URL",
    description: "Start a room from a direct MP4, WebM, or M3U8 file link.",
    helper: "Use a direct media URL. Local desktop files are not uploaded in this MVP yet.",
    placeholder: "https://cdn.example.com/video.mp4",
    accent: "radial-gradient(circle at top left, rgba(255,202,87,0.24), transparent 48%)"
  },
  {
    id: "link",
    label: "Web Link",
    description: "Create a room from an embeddable page or HLS stream link.",
    helper: "Use this for public embeds or stream links when there is no dedicated source card.",
    placeholder: "https://example.com/embed/... or stream.m3u8",
    accent: "radial-gradient(circle at top left, rgba(124,247,212,0.22), transparent 48%)"
  }
];

export function getLaunchSource(source: string) {
  return launchSources.find((item) => item.id === source);
}

const sourceLabels: Record<SourceType | LaunchSource, string> = {
  youtube: "YouTube",
  vkvideo: "VK Video",
  rutube: "Rutube",
  twitch: "Twitch",
  file: "File URL",
  link: "Web Link",
  upload: "File URL",
  hls: "Stream Link",
  url: "Embed Link",
  internal: "Internal"
};

export function getSourceLabel(source: SourceType | LaunchSource) {
  return sourceLabels[source];
}
