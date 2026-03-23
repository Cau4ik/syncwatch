"use client";

import { ExternalLink, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import type { PlaybackSnapshot } from "@syncwatch/shared";
import { useEffect, useMemo, useRef, useState } from "react";

import { formatTime } from "@/lib/utils";
import { getSourceLabel } from "@/lib/sources";

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
        getDuration: () => number;
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

function createNullPlayer() {
  return {
    loadVideoById(_videoId?: string, _startSeconds?: number) {},
    playVideo() {},
    pauseVideo() {},
    seekTo(_seconds?: number, _allowSeekAhead?: boolean) {},
    getCurrentTime() {
      return 0;
    },
    getDuration() {
      return 0;
    },
    getPlayerState() {
      return -1;
    }
  };
}

export function PlayerFrame({
  playback,
  isPlaybackLeader,
  onTogglePlayback,
  onSeek,
  onPlaybackTelemetry
}: {
  playback: PlaybackSnapshot;
  isPlaybackLeader?: boolean;
  onTogglePlayback?: () => void;
  onSeek?: (deltaSeconds: number) => void;
  onPlaybackTelemetry?: (payload: { currentTime: number; duration?: number; state?: PlaybackSnapshot["state"] }) => void;
}) {
  const youtubeHostRef = useRef<HTMLDivElement | null>(null);
  const youtubePlayerRef = useRef<ReturnType<typeof createNullPlayer> | null>(null);
  const htmlVideoRef = useRef<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const effectiveCurrentTime = useMemo(() => {
    if (playback.state !== "playing") {
      return playback.currentTime;
    }

    const elapsedSeconds = Math.max(0, (now - playback.serverTimestamp) / 1000) * (playback.playbackRate || 1);
    const nextTime = playback.currentTime + elapsedSeconds;
    return playback.duration > 0 ? Math.min(nextTime, playback.duration) : nextTime;
  }, [now, playback.currentTime, playback.duration, playback.playbackRate, playback.serverTimestamp, playback.state]);

  const progress = playback.duration > 0 ? Math.min(100, (effectiveCurrentTime / playback.duration) * 100) : 0;

  const canSyncControls = useMemo(
    () => playback.sourceType === "youtube" || playback.sourceType === "upload" || playback.sourceType === "hls",
    [playback.sourceType]
  );

  useEffect(() => {
    if (playback.state !== "playing") {
      setNow(Date.now());
      return;
    }

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [playback.state, playback.serverTimestamp]);

  useEffect(() => {
    if (playback.sourceType !== "youtube" || !youtubeHostRef.current) {
      setReady(false);
      return;
    }

    let active = true;

    ensureYouTubeApi().then(() => {
      if (!active || !youtubeHostRef.current || !window.YT?.Player) {
        return;
      }

      youtubeHostRef.current.innerHTML = "";

      youtubePlayerRef.current = new window.YT.Player(youtubeHostRef.current, {
        videoId: playback.sourceRef,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          rel: 0,
          modestbranding: 1,
          playsinline: 1
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
    if (!ready || playback.sourceType !== "youtube" || !youtubePlayerRef.current) {
      return;
    }

    const player = youtubePlayerRef.current;
    const currentTime = player.getCurrentTime?.() ?? 0;

    if (Math.abs(currentTime - effectiveCurrentTime) > 1.25) {
      player.seekTo(effectiveCurrentTime, true);
    }

    if (playback.state === "playing" && player.getPlayerState?.() !== 1) {
      player.playVideo();
    }

    if (playback.state === "paused" && player.getPlayerState?.() !== 2) {
      player.pauseVideo();
    }
  }, [effectiveCurrentTime, playback, ready]);

  useEffect(() => {
    if ((playback.sourceType !== "upload" && playback.sourceType !== "hls") || !htmlVideoRef.current) {
      return;
    }

    const video = htmlVideoRef.current;

    if (Math.abs(video.currentTime - effectiveCurrentTime) > 1.25) {
      video.currentTime = effectiveCurrentTime;
    }

    if (playback.state === "playing") {
      void video.play().catch(() => {});
    } else if (playback.state === "paused") {
      video.pause();
    }
  }, [effectiveCurrentTime, playback]);

  useEffect(() => {
    if (!isPlaybackLeader || !onPlaybackTelemetry) {
      return;
    }

    if (playback.sourceType === "youtube") {
      if (!ready || !youtubePlayerRef.current) {
        return;
      }

      const interval = window.setInterval(() => {
        const player = youtubePlayerRef.current;
        if (!player) {
          return;
        }

        const rawState = player.getPlayerState?.();
        const state: PlaybackSnapshot["state"] =
          rawState === 1 ? "playing" : rawState === 2 ? "paused" : playback.state;

        onPlaybackTelemetry({
          currentTime: player.getCurrentTime?.() ?? 0,
          duration: player.getDuration?.() ?? playback.duration,
          state
        });
      }, 1000);

      return () => {
        window.clearInterval(interval);
      };
    }

    if ((playback.sourceType === "upload" || playback.sourceType === "hls") && htmlVideoRef.current) {
      const interval = window.setInterval(() => {
        const video = htmlVideoRef.current;
        if (!video) {
          return;
        }

        onPlaybackTelemetry({
          currentTime: video.currentTime,
          duration: Number.isFinite(video.duration) ? video.duration : playback.duration,
          state: video.paused ? "paused" : "playing"
        });
      }, 1000);

      return () => {
        window.clearInterval(interval);
      };
    }
  }, [isPlaybackLeader, onPlaybackTelemetry, playback.duration, playback.sourceType, playback.state, ready]);

  return (
    <div className="rounded-[32px] border border-white/8 bg-[#050b14]/90 p-4 shadow-glow">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-2 text-sm">
        <div className="flex items-center gap-3 text-white">
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{getSourceLabel(playback.sourceType)}</div>
          <div className="max-w-[420px] truncate text-white/85">{playback.title}</div>
        </div>

        {playback.sourceUrl ? (
          <a
            href={playback.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-white/80"
          >
            Open original
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>

      <div className="relative overflow-hidden rounded-[28px] border border-white/8 bg-black">
        {playback.sourceType === "youtube" ? (
          <div ref={youtubeHostRef} className="aspect-video w-full" />
        ) : playback.sourceType === "upload" || playback.sourceType === "hls" ? (
          <video ref={htmlVideoRef} className="aspect-video w-full bg-black" src={playback.sourceUrl || playback.sourceRef} playsInline />
        ) : playback.embedUrl || playback.sourceUrl ? (
          <iframe
            src={playback.embedUrl || playback.sourceUrl}
            className="aspect-video w-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="aspect-video w-full bg-[linear-gradient(180deg,#223046,#0a131f)]" />
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
              disabled={!canSyncControls}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 disabled:opacity-40"
            >
              {playback.state === "playing" ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              onClick={() => onSeek?.(-10)}
              disabled={!canSyncControls}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 disabled:opacity-40"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
            <button
              onClick={() => onSeek?.(10)}
              disabled={!canSyncControls}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 disabled:opacity-40"
            >
              <RotateCw className="h-5 w-5" />
            </button>
            <div className="text-sm text-white/85">
              {formatTime(effectiveCurrentTime)} <span className="text-mist">/ {formatTime(playback.duration || 0)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-mist">
            <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-200">
              {canSyncControls ? "Sync controls ready" : "Provider embed mode"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
