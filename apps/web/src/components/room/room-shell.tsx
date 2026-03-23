"use client";

import { AudioLines, Copy, ExternalLink, Heart, Link2, Mic, PanelRight, ShieldCheck, UsersRound, Video } from "lucide-react";
import type { ChatMessage, RoomState } from "@syncwatch/shared";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

import { PlayerFrame } from "@/components/room/player-frame";
import { ChatPanel } from "@/components/room/chat-panel";
import { ParticipantsPanel } from "@/components/room/participants-panel";
import { apiFetch } from "@/lib/api";
import { socketUrl } from "@/lib/config";
import { clearRoomPresence, loadRoomPresence, saveRoomPresence } from "@/lib/room-presence";
import { loadSession, subscribeSessionChange, type SessionState } from "@/lib/session";
import { getSourceLabel } from "@/lib/sources";

export function RoomShell({ slug }: { slug: string }) {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [guestName, setGuestName] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const autoJoinRef = useRef(false);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
      videoStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const syncSession = () => setSession(loadSession());
    syncSession();
    return subscribeSessionChange(syncSession);
  }, []);

  useEffect(() => {
    let active = true;

    autoJoinRef.current = false;
    setError("");
    setLoading(true);

    const presence = loadRoomPresence(slug);
    setGuestName(presence.name || loadSession()?.user.username || "");
    setParticipantId(presence.participantId);

    apiFetch<RoomState>(`/api/rooms/${slug}`)
      .then((data) => {
        if (!active) return;
        setRoom(data);
      })
      .catch((cause: Error) => {
        if (!active) return;
        clearRoomPresence(slug);
        setParticipantId("");
        setError(cause.message);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [slug]);

  useEffect(() => {
    if (!room || participantId || joining || autoJoinRef.current) {
      return;
    }

    const participantName = guestName.trim() || session?.user.username?.trim();
    if (!participantName || !session) {
      return;
    }

    autoJoinRef.current = true;
    void joinRoom(participantName);
  }, [guestName, joining, participantId, room, session]);

  useEffect(() => {
    const participantName = guestName.trim() || session?.user.username?.trim() || "";
    if (!room || !participantId || !participantName || socketRef.current) {
      return;
    }

    const roomHostId = room.hostId;
    const participantRole = participantId === roomHostId ? "host" : session ? "user" : "guest";

    const socket = io(socketUrl, {
      withCredentials: true,
      reconnection: true
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("room:join", {
        roomSlug: slug,
        name: participantName,
        role: participantRole,
        participantId
      });
    });

    socket.on("room:state", (nextRoom: RoomState) => {
      setRoom(nextRoom);
    });

    socket.on("room:users", (participants: RoomState["participants"]) => {
      setRoom((current) => (current ? { ...current, participants } : current));
    });

    socket.on("chat:message", (message: ChatMessage) => {
      setRoom((current) =>
        current
          ? {
              ...current,
              messages: [...current.messages, message]
            }
          : current
      );
    });

    socket.on("video:state", (playback: RoomState["playback"]) => {
      setRoom((current) => (current ? { ...current, playback } : current));
    });

    socket.on("room:error", ({ message }: { message: string }) => {
      setError(message);
    });

    socket.on("connect_error", () => {
      setSocketConnected(false);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketConnected(false);
    };
  }, [guestName, participantId, room?.hostId, session, slug]);

  useEffect(() => {
    if (!room) {
      return;
    }

    let active = true;

    const interval = window.setInterval(() => {
      apiFetch<RoomState>(`/api/rooms/${slug}`)
        .then((nextRoom) => {
          if (!active) return;
          setRoom(nextRoom);
        })
        .catch(() => {});
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [room?.slug, slug]);

  const canInteract = Boolean(room && participantId);

  async function joinRoom(nameOverride?: string) {
    const participantName = nameOverride?.trim() || guestName.trim() || session?.user.username?.trim() || "";

    if (!participantName) {
      setError("Enter a name to join this room.");
      return;
    }

    setJoining(true);
    setError("");

    try {
      const joined = await apiFetch<RoomState & { participantId: string }>(`/api/rooms/${slug}/join`, {
        method: "POST",
        body: JSON.stringify({ name: participantName }),
        token: session?.accessToken
      });

      saveRoomPresence(slug, {
        name: participantName,
        participantId: joined.participantId
      });

      setGuestName(participantName);
      setParticipantId(joined.participantId);
      setRoom(joined);
    } catch (cause) {
      autoJoinRef.current = false;
      setError(cause instanceof Error ? cause.message : "Failed to join room.");
    } finally {
      setJoining(false);
    }
  }

  async function sendChat(text: string) {
    if (!canInteract) {
      setError("Join the room before sending messages.");
      return;
    }

    const authorName = guestName.trim() || session?.user.username || "Guest";

    if (socketRef.current && socketConnected) {
      socketRef.current.emit("chat:send", {
        roomSlug: slug,
        text,
        authorName
      });
      return;
    }

    await apiFetch(`/api/rooms/${slug}/messages`, {
      method: "POST",
      token: session?.accessToken,
      body: JSON.stringify({
        text,
        authorName
      })
    });

    const nextRoom = await apiFetch<RoomState>(`/api/rooms/${slug}`);
    setRoom(nextRoom);
  }

  function togglePlayback() {
    if (!socketRef.current || !room) return;
    socketRef.current.emit(room.playback.state === "playing" ? "video:pause" : "video:play", {
      roomSlug: slug
    });
  }

  function seek(deltaSeconds: number) {
    if (!socketRef.current || !room) return;
    const nextTime = Math.max(0, Math.min(room.playback.duration || 0, room.playback.currentTime + deltaSeconds));
    socketRef.current.emit("video:seek", {
      roomSlug: slug,
      currentTime: nextTime
    });
  }

  async function copyInviteLink() {
    if (!room) return;

    try {
      await navigator.clipboard.writeText(room.inviteUrl);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 1800);
    } catch {
      setError("Failed to copy room link.");
    }
  }

  async function toggleMicrophone() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Microphone API is not available in this browser.");
      return;
    }

    try {
      if (!audioStreamRef.current) {
        audioStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicrophoneEnabled(true);
        setError("");
        return;
      }

      const nextEnabled = !microphoneEnabled;
      audioStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = nextEnabled;
      });
      setMicrophoneEnabled(nextEnabled);
      setError("");
    } catch {
      setError("Microphone permission was blocked.");
    }
  }

  async function toggleCamera() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Camera API is not available in this browser.");
      return;
    }

    try {
      if (!videoStreamRef.current) {
        videoStreamRef.current = await navigator.mediaDevices.getUserMedia({ video: true });
        setCameraEnabled(true);
        setError("");
        return;
      }

      const nextEnabled = !cameraEnabled;
      videoStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = nextEnabled;
      });
      setCameraEnabled(nextEnabled);
      setError("");
    } catch {
      setError("Camera permission was blocked.");
    }
  }

  async function sendReaction() {
    try {
      await sendChat("🔥");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Failed to send reaction.");
    }
  }

  if (loading) {
    return <RoomStateCard title="Loading room..." description="Fetching room state, source, and participant list." />;
  }

  if (error && !room) {
    return <RoomStateCard title="Room unavailable" description={error} />;
  }

  if (!room) {
    return <RoomStateCard title="Room not found" description="Check the invite link or start a new room from the source launcher." />;
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1.45fr)_420px] lg:px-8">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
          <ShieldCheck className="h-4 w-4" />
          Source attached room
        </div>

        <PlayerFrame playback={room.playback} onTogglePlayback={togglePlayback} onSeek={seek} />

        <section className="grid gap-5 rounded-[28px] border border-white/8 bg-[#0a131f]/90 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <div className="mb-2 text-4xl font-semibold tracking-tight text-white">{room.title}</div>
            <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-mist">
              <span>{getSourceLabel(room.playback.sourceType)}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{room.category}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{room.participants.length} participants</span>
            </div>

            <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <div className="mb-3 text-xs uppercase tracking-[0.24em] text-mist">Room invite link</div>
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#08111b] px-4 py-4 text-white">
                <div className="truncate">{room.inviteUrl}</div>
                <button type="button" onClick={copyInviteLink} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {room.playback.sourceUrl ? (
              <a
                href={room.playback.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-3 rounded-[22px] bg-white px-5 py-4 text-base font-semibold text-slate-950"
              >
                <ExternalLink className="h-5 w-5" />
                Open source
              </a>
            ) : (
              <button className="flex items-center justify-center gap-3 rounded-[22px] bg-white px-5 py-4 text-base font-semibold text-slate-950">
                <Video className="h-5 w-5" />
                Source attached
              </button>
            )}
            <button
              type="button"
              onClick={() => void toggleMicrophone()}
              className={`flex items-center justify-center gap-3 rounded-[22px] border px-5 py-4 text-base font-medium ${
                microphoneEnabled ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/[0.03] text-white"
              }`}
            >
              <AudioLines className="h-5 w-5" />
              {microphoneEnabled ? "Voice active" : "Voice room"}
            </button>
            <button
              type="button"
              onClick={() => setPanelOpen((current) => !current)}
              className="flex items-center justify-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-4 text-base font-medium text-white"
            >
              <PanelRight className="h-5 w-5" />
              {panelOpen ? "Hide side panels" : "Open side panels"}
            </button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ActionPill icon={<UsersRound className="h-5 w-5" />} label={copiedInvite ? "Copied" : "Invite"} onClick={copyInviteLink} active={copiedInvite} />
          <ActionPill icon={<Mic className="h-5 w-5" />} label={microphoneEnabled ? "Mic on" : "Microphone"} onClick={() => void toggleMicrophone()} active={microphoneEnabled} />
          <ActionPill icon={<Video className="h-5 w-5" />} label={cameraEnabled ? "Camera on" : "Camera"} onClick={() => void toggleCamera()} active={cameraEnabled} />
          <ActionPill icon={<Heart className="h-5 w-5" />} label="Reaction" onClick={() => void sendReaction()} />
        </section>

        {!canInteract ? (
          <section className="rounded-[28px] border border-white/8 bg-[#0a131f]/90 p-6">
            <div className="mb-3 text-2xl font-semibold text-white">Join this room</div>
            <p className="mb-5 text-sm text-mist">Enter a name if you opened the invite as a guest. Signed-in users can auto-join with their account name.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                placeholder="Your name"
                className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white outline-none placeholder:text-mist"
              />
              <button
                onClick={() => void joinRoom()}
                disabled={joining}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {joining ? "Joining..." : "Join room"}
              </button>
            </div>
            {error ? <div className="mt-3 text-sm text-amber-200">{error}</div> : null}
          </section>
        ) : null}
      </div>

      <div className="space-y-6">
        <ChatPanel messages={room.messages} onSend={sendChat} disabled={!canInteract} />
        {panelOpen ? <ParticipantsPanel participants={room.participants} /> : null}
        <section className="rounded-[28px] border border-white/8 bg-[#0a131f]/90 p-5">
          <div className="mb-3 flex items-center gap-3 text-white">
            <Link2 className="h-5 w-5 text-signal" />
            Room status
          </div>
          <div className="space-y-3 text-sm text-mist">
            <p>Source: {getSourceLabel(room.playback.sourceType)}</p>
            <p>Realtime: {socketConnected ? "connected" : "fallback sync mode"}</p>
            <p>Microphone: {microphoneEnabled ? "enabled" : "off"}</p>
            <p>Camera: {cameraEnabled ? "enabled" : "off"}</p>
            <p>Temporary room session: stays available for a short grace period after everyone leaves</p>
            <p>Invite link points directly to this selected source room</p>
          </div>
        </section>
        {error && room ? <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{error}</div> : null}
      </div>
    </div>
  );
}

function ActionPill({
  icon,
  label,
  onClick,
  active = false
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-3 rounded-[24px] border px-5 py-5 text-base text-white transition ${
        active ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function RoomStateCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-4xl items-center px-5 py-12 lg:px-8">
      <div className="rounded-[36px] border border-white/8 bg-[#0a131f]/85 p-10">
        <div className="mb-4 text-4xl font-semibold text-white">{title}</div>
        <div className="text-lg text-mist">{description}</div>
      </div>
    </div>
  );
}
