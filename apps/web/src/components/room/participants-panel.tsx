import { Crown, Mic, MicOff, Volume2 } from "lucide-react";

type DisplayParticipant = {
  id: string;
  name: string;
  avatar: string;
  role: "host" | "moderator" | "user" | "guest";
  status: "online" | "typing" | "listening" | "away";
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
  memberIds: string[];
};

export function ParticipantsPanel({
  participants,
  volumes,
  onVolumeChange
}: {
  participants: DisplayParticipant[];
  volumes: Record<string, number>;
  onVolumeChange: (participantId: string, volume: number) => void;
}) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-[#0a131f]/90">
      <div className="border-b border-white/8 px-5 py-4">
        <div className="text-xl font-semibold text-white">Participants ({participants.length})</div>
        <div className="text-sm text-mist">Speaking status and per-person volume.</div>
      </div>

      <div className="space-y-3 px-5 py-5">
        {participants.map((participant) => (
          <div
            key={participant.id}
            className={`flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 ${
              participant.isSpeaking ? "border-emerald-400/35 bg-emerald-400/5" : "border-white/6 bg-white/[0.03]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`relative flex h-11 w-11 items-center justify-center rounded-full border bg-gradient-to-br from-white/15 to-white/5 text-sm font-semibold text-white ${
                  participant.isSpeaking ? "border-emerald-400/60 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" : "border-white/10"
                }`}
              >
                {participant.avatar}
                <span
                  className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#0a131f] ${
                    participant.isSpeaking ? "bg-emerald-400" : participant.status === "typing" ? "bg-amber-400" : "bg-sky-400"
                  }`}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 font-medium text-white">
                  <span className="truncate">{participant.name}</span>
                  {participant.role === "host" ? <Crown className="h-4 w-4 shrink-0 text-flare" /> : null}
                </div>
                <div className="flex items-center gap-2 text-sm text-mist">
                  {participant.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-emerald-300" />}
                  <span>{participant.isSpeaking ? "Speaking" : participant.status}</span>
                </div>
              </div>
            </div>

            <div className="flex min-w-[150px] items-center gap-3">
              <Volume2 className="h-4 w-4 shrink-0 text-mist" />
              {participant.isLocal ? (
                <div className="text-xs uppercase tracking-[0.18em] text-mist">You</div>
              ) : (
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round((volumes[participant.id] ?? 1) * 100)}
                  onChange={(event) => onVolumeChange(participant.id, Number(event.target.value) / 100)}
                  className="w-full accent-emerald-400"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
