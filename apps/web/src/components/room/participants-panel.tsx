import { Camera, CameraOff, Crown, Mic, MicOff, MoreHorizontal } from "lucide-react";
import type { Participant } from "@syncwatch/shared";

export function ParticipantsPanel({ participants }: { participants: Participant[] }) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-[#0a131f]/90">
      <div className="border-b border-white/8 px-5 py-4">
        <div className="text-xl font-semibold text-white">Participants ({participants.length})</div>
        <div className="text-sm text-mist">Voice, camera, roles, and room presence.</div>
      </div>

      <div className="space-y-3 px-5 py-5">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/15 to-white/5 text-sm font-semibold text-white">
                {participant.avatar}
                <span
                  className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0a131f] ${
                    participant.status === "typing"
                      ? "bg-amber-400"
                      : participant.status === "listening"
                        ? "bg-sky-400"
                        : "bg-emerald-400"
                  }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 font-medium text-white">
                  {participant.name}
                  {participant.role === "host" ? <Crown className="h-4 w-4 text-flare" /> : null}
                </div>
                <div className="text-sm capitalize text-mist">{participant.status}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  participant.isMuted ? "bg-white/5 text-mist" : "bg-violet-500/20 text-violet-200"
                }`}
              >
                {participant.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </div>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  participant.cameraEnabled ? "bg-emerald-400/10 text-emerald-200" : "bg-white/5 text-mist"
                }`}
              >
                {participant.cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              </div>
              <button type="button" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-mist">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
