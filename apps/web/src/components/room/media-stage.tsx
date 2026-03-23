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
    <div className="hidden" aria-hidden="true">
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

  useEffect(() => {
    if (!audioRef.current) {
      return;
    }

    audioRef.current.srcObject = stream;
    audioRef.current.volume = volume;
    void audioRef.current.play().catch(() => {});
  }, [stream, volume]);

  return <audio ref={audioRef} autoPlay playsInline />;
}
