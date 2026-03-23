"use client";

import { Mic, MicOff, Radio } from "lucide-react";
import type { Participant } from "@syncwatch/shared";
import { useEffect, useRef } from "react";

export type RemoteMediaTile = {
  participantId: string;
  stream: MediaStream;
};

export function MediaStage({
  localName,
  localMicrophoneEnabled,
  remoteParticipants,
  remoteMediaTiles,
  remoteVolumes
}: {
  localName: string;
  localMicrophoneEnabled: boolean;
  remoteParticipants: Participant[];
  remoteMediaTiles: RemoteMediaTile[];
  remoteVolumes: Record<string, number>;
}) {
  const remoteTileMap = new Map(remoteMediaTiles.map((tile) => [tile.participantId, tile.stream]));

  return (
    <section className="rounded-[28px] border border-white/8 bg-[#0a131f]/90 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-white">Voice room</div>
          <div className="text-sm text-mist">One shared screen for video, separate voice presence for everyone in the room.</div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80">Audio live</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <VoiceCard name={localName} badge="You" microphoneEnabled={localMicrophoneEnabled} speaking={false} />

        {remoteParticipants.map((participant) => (
          <VoiceCard
            key={participant.id}
            name={participant.name}
            badge={participant.role === "host" ? "Host" : "Guest"}
            stream={remoteTileMap.get(participant.id) ?? null}
            microphoneEnabled={!(participant.isMuted ?? true)}
            speaking={Boolean(participant.isSpeaking)}
            volume={remoteVolumes[participant.id] ?? 1}
          />
        ))}
      </div>
    </section>
  );
}

function VoiceCard({
  name,
  badge,
  stream,
  microphoneEnabled,
  speaking,
  volume = 1
}: {
  name: string;
  badge: string;
  stream?: MediaStream | null;
  microphoneEnabled: boolean;
  speaking: boolean;
  volume?: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioTrackCount = stream?.getAudioTracks().length ?? 0;

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.srcObject = stream ?? null;
    audioRef.current.volume = volume;

    if (audioTrackCount > 0) {
      void audioRef.current.play().catch(() => {});
    }
  }, [audioTrackCount, stream, volume]);

  return (
    <article className={`overflow-hidden rounded-[24px] border bg-[#08111b] ${speaking ? "border-emerald-400/35 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]" : "border-white/8"}`}>
      <div className="relative flex min-h-[210px] items-center justify-center bg-[radial-gradient(circle_at_top,rgba(124,247,212,0.12),transparent_24%),linear-gradient(180deg,#182536,#08111b)] px-6 py-8">
        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/90">{badge}</div>
        <div className="text-center">
          <div
            className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border text-2xl font-semibold text-white ${
              speaking ? "border-emerald-400/60 bg-emerald-400/10 shadow-[0_0_0_6px_rgba(16,185,129,0.12)]" : "border-white/10 bg-white/[0.04]"
            }`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="mb-2 text-lg font-semibold text-white">{name}</div>
          <div className="text-sm text-mist">{speaking ? "Speaking right now" : microphoneEnabled ? "Voice connected" : "Microphone muted"}</div>
        </div>
        {stream ? <audio ref={audioRef} autoPlay /> : null}
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${microphoneEnabled ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-mist"}`}>
            {microphoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </div>
          <span className="text-sm text-mist">{microphoneEnabled ? "Audio on" : "Audio off"}</span>
        </div>

        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${speaking ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-mist"}`}>
          <Radio className="h-3.5 w-3.5" />
          {speaking ? "Live" : "Idle"}
        </div>
      </div>
    </article>
  );
}
