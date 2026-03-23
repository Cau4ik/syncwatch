"use client";

import { Maximize2, MonitorPlay, Pause, Play, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import type { PlaybackSnapshot } from "@syncwatch/shared";
import { useEffect, useRef, useState } from "react";

import { formatTime } from "@/lib/utils";

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string;
          playerVars?: Record<string, string | number>;
          events?: {
            onReady?: () => void;
          };
        }
      ) => {
        loadVideoById: (videoId: string, startSeconds?: number) => void;
        playVideo: () => void;
        pauseVideo: () => void;
        seekTo: (seconds: number, allowSeekAhead: boolean) => void;
        getCurrentTime: () => number;
        getPlayerState: () => number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function ensureYouTubeApi() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<void>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    window.onYouTubeIframeAPIReady = () => resolve();
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

export function PlayerFrame({
  playback,
  onTogglePlayback,
  onSeek
}: {
  playback: PlaybackSnapshot;
  onTogglePlayback?: () => void;
  onSeek?: (deltaSeconds: number) => void;
}) {
  const progress = (playback.currentTime / playback.duration) * 100;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<ReturnType<typeof createNullPlayer> | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (playback.sourceType !== "youtube" || !hostRef.current) {
      return;
    }

    let active = true;

    ensureYouTubeApi().then(() => {
      if (!active || !hostRef.current || !window.YT?.Player) {
        return;
      }

      playerRef.current = new window.YT.Player(hostRef.current, {
        videoId: playback.sourceRef,
        playerVars: {
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: () => {
            setReady(true);
          }
        }
      }) as ReturnType<typeof createNullPlayer>;
    });

    return () => {
      active = false;
    };
  }, [playback.sourceRef, playback.sourceType]);

  useEffect(() => {
    if (!ready || playback.sourceType !== "youtube" || !playerRef.current) {
      return;
    }

    const player = playerRef.current;
    const currentTime = player.getCurrentTime?.() ?? 0;

    if (Math.abs(currentTime - playback.currentTime) > 1.25) {
      player.seekTo(playback.currentTime, true);
    }

    if (playback.state === "playing" && player.getPlayerState?.() !== 1) {
      player.playVideo();
    }

    if (playback.state === "paused" && player.getPlayerState?.() !== 2) {
      player.pauseVideo();
    }
  }, [playback, ready]);

  return (
    <div className="rounded-[32px] border border-white/8 bg-[#050b14]/90 p-4 shadow-glow">
      <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-black">
        {playback.sourceType === "youtube" ? (
          <div ref={hostRef} className="aspect-video w-full" />
        ) : (
          <div
            className="aspect-video w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${playback.coverImage})` }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      </div>

      <div className="mt-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
        <div className="mb-4 h-2 rounded-full bg-white/10">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-signal via-flare to-ember"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-4">
            <button
              onClick={onTogglePlayback}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
            >
              {playback.state === "playing" ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              onClick={() => onSeek?.(-10)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={() => onSeek?.(10)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Volume2 className="h-5 w-5" />
            </button>
            <div className="text-sm text-white/85">
              {formatTime(playback.currentTime)} <span className="text-mist">/ {formatTime(playback.duration)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-mist">
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">
              Sync stable
            </div>
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <MonitorPlay className="h-5 w-5" />
            </button>
            <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function createNullPlayer() {
  return {
    loadVideoById(_videoId?: string, _startSeconds?: number) {},
    playVideo() {},
    pauseVideo() {},
    seekTo(_seconds?: number, _allowSeekAhead?: boolean) {},
    getCurrentTime() {
      return 0;
    },
    getPlayerState() {
      return -1;
    }
  };
}
