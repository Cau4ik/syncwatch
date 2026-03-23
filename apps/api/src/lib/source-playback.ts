import type { LaunchSource, PlaybackSnapshot } from "@syncwatch/shared";

import { env } from "../config/env.js";

function defaultPlaybackState() {
  return {
    currentTime: 0,
    duration: 0,
    state: "idle" as const,
    playbackRate: 1,
    serverTimestamp: Date.now()
  };
}

function ensureUrl(input: string) {
  try {
    return new URL(input.trim());
  } catch {
    throw new Error("Provide a valid public URL for this source.");
  }
}

function parseYouTubeId(input: string) {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const url = ensureUrl(trimmed);
  if (url.hostname.includes("youtu.be")) {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  const directId = url.searchParams.get("v");
  if (directId) {
    return directId;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const knownIndex = segments.findIndex((segment) => ["embed", "shorts", "live"].includes(segment));
  if (knownIndex >= 0) {
    return segments[knownIndex + 1] ?? null;
  }

  return null;
}

function getTwitchEmbed(url: URL) {
  const host = new URL(env.WEB_URL.trim()).hostname;
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments[0] === "videos" && segments[1]) {
    return `https://player.twitch.tv/?video=${segments[1]}&parent=${host}&autoplay=false`;
  }

  if (segments[0]) {
    return `https://player.twitch.tv/?channel=${segments[0]}&parent=${host}&autoplay=false`;
  }

  return url.toString();
}

function getRutubeEmbed(url: URL) {
  const segments = url.pathname.split("/").filter(Boolean);
  const videoIndex = segments.findIndex((segment) => segment === "video");

  if (videoIndex >= 0 && segments[videoIndex + 1]) {
    return `https://rutube.ru/play/embed/${segments[videoIndex + 1]}`;
  }

  return url.toString();
}

function getVkEmbed(url: URL) {
  if (url.pathname.includes("video_ext.php")) {
    return url.toString();
  }

  return url.toString();
}

function fileNameFromUrl(url: URL) {
  const lastSegment = url.pathname.split("/").filter(Boolean).pop();
  return lastSegment ? decodeURIComponent(lastSegment) : url.hostname;
}

export function getSourceCategory(source: LaunchSource) {
  switch (source) {
    case "youtube":
      return "YouTube";
    case "vkvideo":
      return "VK Video";
    case "rutube":
      return "Rutube";
    case "twitch":
      return "Twitch";
    case "file":
      return "File";
    case "link":
      return "Link";
  }
}

export function buildPlaybackFromLaunch({
  source,
  rawValue,
  title
}: {
  source: LaunchSource;
  rawValue: string;
  title?: string;
}): PlaybackSnapshot {
  if (source === "youtube") {
    const videoId = parseYouTubeId(rawValue);
    if (!videoId) {
      throw new Error("Provide a valid YouTube link or video ID.");
    }

    return {
      sourceType: "youtube",
      sourceRef: videoId,
      title: title?.trim() || "YouTube watch party",
      sourceUrl: `https://www.youtube.com/watch?v=${videoId}`,
      embedUrl: `https://www.youtube.com/embed/${videoId}?rel=0`,
      ...defaultPlaybackState()
    };
  }

  const url = ensureUrl(rawValue);
  const normalizedUrl = url.toString();

  if (source === "vkvideo") {
    return {
      sourceType: "vkvideo",
      sourceRef: normalizedUrl,
      title: title?.trim() || "VK Video room",
      sourceUrl: normalizedUrl,
      embedUrl: getVkEmbed(url),
      ...defaultPlaybackState()
    };
  }

  if (source === "rutube") {
    return {
      sourceType: "rutube",
      sourceRef: normalizedUrl,
      title: title?.trim() || "Rutube room",
      sourceUrl: normalizedUrl,
      embedUrl: getRutubeEmbed(url),
      ...defaultPlaybackState()
    };
  }

  if (source === "twitch") {
    return {
      sourceType: "twitch",
      sourceRef: normalizedUrl,
      title: title?.trim() || "Twitch room",
      sourceUrl: normalizedUrl,
      embedUrl: getTwitchEmbed(url),
      ...defaultPlaybackState()
    };
  }

  if (source === "file") {
    const lowerPath = url.pathname.toLowerCase();
    const sourceType = lowerPath.endsWith(".m3u8") ? "hls" : "upload";

    return {
      sourceType,
      sourceRef: normalizedUrl,
      title: title?.trim() || fileNameFromUrl(url),
      sourceUrl: normalizedUrl,
      ...defaultPlaybackState()
    };
  }

  const lowerPath = url.pathname.toLowerCase();
  const sourceType = lowerPath.endsWith(".m3u8") ? "hls" : "url";

  return {
    sourceType,
    sourceRef: normalizedUrl,
    title: title?.trim() || fileNameFromUrl(url),
    sourceUrl: normalizedUrl,
    embedUrl: sourceType === "url" ? normalizedUrl : undefined,
    ...defaultPlaybackState()
  };
}
