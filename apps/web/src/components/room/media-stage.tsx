"use client";

import { useEffect, useRef } from "react";

export type RemoteMediaTile = {
  participantId: string;
  stream: MediaStream;
};

export function MediaStage({
  remoteMediaTiles,
  remoteVolumes
}: {
  remoteMediaTiles: RemoteMediaTile[];
  remoteVolumes: Record<string, number>;
}) {
  return (
    <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
      {remoteMediaTiles.map((tile) => (
        <RemoteAudio key={tile.participantId} stream={tile.stream} volume={remoteVolumes[tile.participantId] ?? 1} />
      ))}
    </div>
  );
}

function RemoteAudio({
  stream,
  volume
}: {
  stream: MediaStream;
  volume: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioTrackCount = stream.getAudioTracks().length;

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.srcObject = stream;
    audioRef.current.volume = volume;
    if (audioTrackCount > 0) {
      void audioRef.current.play().catch(() => {});
    }
  }, [audioTrackCount, stream, volume]);

  return <audio ref={audioRef} autoPlay playsInline />;
}
