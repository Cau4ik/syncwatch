"use client";

import { Camera, CameraOff, Mic, MicOff } from "lucide-react";
import type { Participant } from "@syncwatch/shared";
import { type RefObject, useEffect, useRef } from "react";

export type RemoteMediaTile = {
  participantId: string;
  stream: MediaStream;
};

export function MediaStage({
  localName,
  localStream,
  localPreviewRef,
  localCameraEnabled,
  localMicrophoneEnabled,
  remoteParticipants,
  remoteMediaTiles
}: {
  localName: string;
  localStream: MediaStream | null;
  localPreviewRef: RefObject<HTMLVideoElement | null>;
  localCameraEnabled: boolean;
  localMicrophoneEnabled: boolean;
  remoteParticipants: Participant[];
  remoteMediaTiles: RemoteMediaTile[];
}) {
  const remoteTileMap = new Map(remoteMediaTiles.map((tile) => [tile.participantId, tile.stream]));

  return (
    <section className="rounded-[28px] border border-white/8 bg-[#0a131f]/90 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xl font-semibold text-white">Live camera and voice</div>
          <div className="text-sm text-mist">Everyone in the room can hear audio and see camera tiles after permission is granted.</div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/80">Peer mesh</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StreamCard
          name={localName}
          badge="You"
          stream={localStream}
          cameraEnabled={localCameraEnabled}
          microphoneEnabled={localMicrophoneEnabled}
          muted
          videoRef={localPreviewRef}
        />

        {remoteParticipants.map((participant) => (
          <StreamCard
            key={participant.id}
            name={participant.name}
            badge={participant.role === "host" ? "Host" : "Guest"}
            stream={remoteTileMap.get(participant.id) ?? null}
            cameraEnabled={Boolean(participant.cameraEnabled)}
            microphoneEnabled={!(participant.isMuted ?? true)}
            speaking={Boolean(participant.isSpeaking)}
          />
        ))}
      </div>
    </section>
  );
}

function StreamCard({
  name,
  badge,
  stream,
  cameraEnabled,
  microphoneEnabled,
  muted,
  speaking = false,
  videoRef
}: {
  name: string;
  badge: string;
  stream: MediaStream | null;
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  muted: boolean;
  speaking?: boolean;
  videoRef?: RefObject<HTMLVideoElement | null>;
}) {
  const internalVideoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef?.current ?? internalVideoRef.current;
    if (videoElement) {
      videoElement.srcObject = stream;
    }

    if (audioRef.current) {
      audioRef.current.srcObject = stream;
    }
  }, [stream, videoRef]);

  const showsVideo = Boolean(stream && cameraEnabled && stream.getVideoTracks().length > 0);

  return (
    <article className={`overflow-hidden rounded-[24px] border bg-[#08111b] ${speaking ? "border-emerald-400/25" : "border-white/8"}`}>
      <div className="relative aspect-video bg-[radial-gradient(circle_at_top,rgba(124,247,212,0.12),transparent_20%),linear-gradient(180deg,#182536,#08111b)]">
        {showsVideo ? (
          <video ref={videoRef ?? internalVideoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-3 text-lg font-semibold text-white">{name}</div>
              <div className="text-sm text-mist">{cameraEnabled ? "Waiting for video stream..." : "Camera is off"}</div>
            </div>
          </div>
        )}
        {!muted ? <audio ref={audioRef} autoPlay /> : null}
        <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/90">{badge}</div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-mist">{speaking ? "Speaking" : "Connected"}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${microphoneEnabled ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-mist"}`}>
            {microphoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-full ${cameraEnabled ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-mist"}`}>
            {cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
          </div>
        </div>
      </div>
    </article>
  );
}
