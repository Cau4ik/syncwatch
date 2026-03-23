"use client";

import {
  AudioLines,
  Copy,
  ExternalLink,
  Link2,
  LogOut,
  Mic,
  MicOff,
  PanelRight,
  ShieldCheck,
  UsersRound,
  Video
} from "lucide-react";
import type { ChatMessage, Participant, RoomState } from "@syncwatch/shared";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";

import { ChatPanel } from "@/components/room/chat-panel";
import { MediaStage, type RemoteMediaTile } from "@/components/room/media-stage";
import { ParticipantsPanel } from "@/components/room/participants-panel";
import { PlayerFrame } from "@/components/room/player-frame";
import { apiFetch } from "@/lib/api";
import { socketUrl } from "@/lib/config";
import { clearRoomPresence, loadRoomPresence, saveRoomPresence } from "@/lib/room-presence";
import { loadSession, subscribeSessionChange, type SessionState } from "@/lib/session";
import { getSourceLabel } from "@/lib/sources";

type VoiceSignalPayload =
  | { type: "offer"; description: RTCSessionDescriptionInit }
  | { type: "answer"; description: RTCSessionDescriptionInit }
  | { type: "candidate"; candidate: RTCIceCandidateInit }
  | { type: "renegotiate" };

const rtcConfiguration: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

type DisplayParticipant = {
  id: string;
  name: string;
  avatar: string;
  role: Participant["role"];
  status: Participant["status"];
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
  memberIds: string[];
};

export function RoomShell({ slug }: { slug: string }) {
  const router = useRouter();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [guestName, setGuestName] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [remoteMediaTiles, setRemoteMediaTiles] = useState<RemoteMediaTile[]>([]);
  const [remoteVolumes, setRemoteVolumes] = useState<Record<string, number>>({});
  const [remoteSpeaking, setRemoteSpeaking] = useState<Record<string, boolean>>({});
  const [localMediaVersion, setLocalMediaVersion] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const autoJoinRef = useRef(false);
  const localMediaStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const pendingIceCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const negotiationLocksRef = useRef<Set<string>>(new Set());
  const microphoneEnabledRef = useRef(false);
  const mediaTouchedRef = useRef(false);
  const localSpeakingRef = useRef(false);
  const speakingMonitorRef = useRef<number | null>(null);
  const speakingAudioContextRef = useRef<AudioContext | null>(null);
  const remoteSpeakingContextsRef = useRef<Map<string, AudioContext>>(new Map());
  const remoteSpeakingIntervalsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const syncSession = () => setSession(loadSession());
    syncSession();
    return subscribeSessionChange(syncSession);
  }, []);

  useEffect(() => {
    microphoneEnabledRef.current = microphoneEnabled;
  }, [microphoneEnabled]);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
      for (const connection of peerConnectionsRef.current.values()) {
        connection.close();
      }
      peerConnectionsRef.current.clear();
      remoteStreamsRef.current.clear();
      pendingIceCandidatesRef.current.clear();
      localMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      localMediaStreamRef.current = null;
      if (speakingMonitorRef.current !== null) {
        window.clearInterval(speakingMonitorRef.current);
      }
      speakingMonitorRef.current = null;
      void speakingAudioContextRef.current?.close().catch(() => {});
      speakingAudioContextRef.current = null;
      stopRemoteSpeakingMonitors(false);
    };
  }, []);

  useEffect(() => {
    let active = true;

    autoJoinRef.current = false;
    mediaTouchedRef.current = false;
    setError("");
    setLoading(true);

    const presence = loadRoomPresence(slug);
    setGuestName(presence.name || loadSession()?.user.username || "");
    setParticipantId(presence.participantId);

    apiFetch<RoomState>(`/api/rooms/${slug}`)
      .then((data) => {
        if (active) {
          setRoom(data);
        }
      })
      .catch((cause: Error) => {
        if (!active) return;
        clearRoomPresence(slug);
        setParticipantId("");
        setError(cause.message);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
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
    if (!participantId || !room) {
      return;
    }

    const me = room.participants.find((participant) => participant.id === participantId);
    if (!me) {
      return;
    }

    if (mediaTouchedRef.current) {
      return;
    }

    setMicrophoneEnabled(!(me.isMuted ?? true));
  }, [participantId, room]);

  function refreshRemoteTiles() {
    setRemoteMediaTiles(
      [...remoteStreamsRef.current.entries()].map(([remoteParticipantId, stream]) => ({
        participantId: remoteParticipantId,
        stream
      }))
    );
  }

  function updateRemoteVolume(remoteParticipantId: string, volume: number) {
    setRemoteVolumes((current) => {
      const next = { ...current };

      for (const participant of room?.participants ?? []) {
        if (participant.id !== participantId && getParticipantGroupKey(participant) === remoteParticipantId) {
          next[participant.id] = volume;
        }
      }

      return next;
    });
  }

  function stopSpeakingMonitor() {
    if (speakingMonitorRef.current !== null) {
      window.clearInterval(speakingMonitorRef.current);
      speakingMonitorRef.current = null;
    }

    if (localSpeakingRef.current) {
      localSpeakingRef.current = false;
      emitParticipantMediaPatch({ isSpeaking: false, status: microphoneEnabledRef.current ? "listening" : "online" });
    }

    void speakingAudioContextRef.current?.close().catch(() => {});
    speakingAudioContextRef.current = null;
  }

  function stopRemoteSpeakingMonitors(resetState = true) {
    for (const intervalId of remoteSpeakingIntervalsRef.current.values()) {
      window.clearInterval(intervalId);
    }
    remoteSpeakingIntervalsRef.current.clear();

    for (const context of remoteSpeakingContextsRef.current.values()) {
      void context.close().catch(() => {});
    }
    remoteSpeakingContextsRef.current.clear();
    if (resetState) {
      setRemoteSpeaking({});
    }
  }

  function closePeerConnection(remoteParticipantId: string) {
    const existing = peerConnectionsRef.current.get(remoteParticipantId);
    if (existing) {
      existing.ontrack = null;
      existing.onicecandidate = null;
      existing.onconnectionstatechange = null;
      existing.close();
      peerConnectionsRef.current.delete(remoteParticipantId);
    }

    remoteStreamsRef.current.delete(remoteParticipantId);
    pendingIceCandidatesRef.current.delete(remoteParticipantId);
    negotiationLocksRef.current.delete(remoteParticipantId);
    refreshRemoteTiles();
  }

  function attachLocalTracks(connection: RTCPeerConnection) {
    const localStream = localMediaStreamRef.current;
    if (!localStream) {
      return;
    }

    for (const track of localStream.getTracks()) {
      const alreadyAdded = connection.getSenders().some((sender) => sender.track?.id === track.id);
      if (!alreadyAdded) {
        connection.addTrack(track, localStream);
      }
    }
  }

  function ensurePeerConnection(remoteParticipantId: string) {
    const existing = peerConnectionsRef.current.get(remoteParticipantId);
    if (existing) {
      return existing;
    }

    const connection = new RTCPeerConnection(rtcConfiguration);
    const remoteStream = remoteStreamsRef.current.get(remoteParticipantId) ?? new MediaStream();
    remoteStreamsRef.current.set(remoteParticipantId, remoteStream);

    attachLocalTracks(connection);

    connection.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current) {
        return;
      }

      socketRef.current.emit("voice:signal", {
        roomSlug: slug,
        targetParticipantId: remoteParticipantId,
        payload: {
          type: "candidate",
          candidate: event.candidate.toJSON()
        } satisfies VoiceSignalPayload
      });
    };

    connection.ontrack = (event) => {
      const nextRemoteStream = remoteStreamsRef.current.get(remoteParticipantId) ?? new MediaStream();
      const sourceStream = event.streams[0];

      if (sourceStream) {
        for (const track of sourceStream.getTracks()) {
          const exists = nextRemoteStream.getTracks().some((item) => item.id === track.id);
          if (!exists) {
            nextRemoteStream.addTrack(track);
          }
        }
      } else {
        const exists = nextRemoteStream.getTracks().some((item) => item.id === event.track.id);
        if (!exists) {
          nextRemoteStream.addTrack(event.track);
        }
      }

      remoteStreamsRef.current.set(remoteParticipantId, nextRemoteStream);
      refreshRemoteTiles();
    };

    connection.onconnectionstatechange = () => {
      if (connection.connectionState === "failed" || connection.connectionState === "closed") {
        closePeerConnection(remoteParticipantId);
      }
    };

    peerConnectionsRef.current.set(remoteParticipantId, connection);
    refreshRemoteTiles();
    return connection;
  }

  async function flushPendingIceCandidates(remoteParticipantId: string, connection: RTCPeerConnection) {
    const pending = pendingIceCandidatesRef.current.get(remoteParticipantId);
    if (!pending?.length) {
      return;
    }

    pendingIceCandidatesRef.current.delete(remoteParticipantId);

    for (const candidate of pending) {
      await connection.addIceCandidate(candidate);
    }
  }

  async function renegotiateWith(remoteParticipantId: string) {
    if (!socketRef.current || !socketConnected) {
      return;
    }

    const connection = ensurePeerConnection(remoteParticipantId);
    if (connection.signalingState !== "stable" || negotiationLocksRef.current.has(remoteParticipantId)) {
      return;
    }

    negotiationLocksRef.current.add(remoteParticipantId);

    try {
      attachLocalTracks(connection);
      const offer = await connection.createOffer();
      await connection.setLocalDescription(offer);

      if (connection.localDescription) {
        socketRef.current.emit("voice:signal", {
          roomSlug: slug,
          targetParticipantId: remoteParticipantId,
          payload: {
            type: "offer",
            description: connection.localDescription.toJSON()
          } satisfies VoiceSignalPayload
        });
      }
    } catch {
      setError("Failed to negotiate live audio/video connection.");
    } finally {
      negotiationLocksRef.current.delete(remoteParticipantId);
    }
  }

  function requestPeerRefresh(targetParticipantIds?: string[]) {
    if (!participantId || !socketRef.current) {
      return;
    }

    const remoteIds =
      targetParticipantIds ?? room?.participants.filter((participant) => participant.id !== participantId).map((participant) => participant.id) ?? [];

    for (const remoteParticipantId of remoteIds) {
      if (participantId < remoteParticipantId) {
        void renegotiateWith(remoteParticipantId);
      } else {
        socketRef.current.emit("voice:signal", {
          roomSlug: slug,
          targetParticipantId: remoteParticipantId,
          payload: {
            type: "renegotiate"
          } satisfies VoiceSignalPayload
        });
      }
    }
  }

  function renegotiateAllPeers() {
    if (!participantId || !room || !socketConnected) {
      return;
    }

    const remoteParticipantIds = room.participants.filter((participant) => participant.id !== participantId).map((participant) => participant.id);
    for (const remoteParticipantId of remoteParticipantIds) {
      void renegotiateWith(remoteParticipantId);
    }
  }

  async function handleVoiceSignal({
    fromParticipantId,
    targetParticipantId,
    payload
  }: {
    fromParticipantId: string;
    targetParticipantId?: string;
    payload: VoiceSignalPayload;
  }) {
    if (!participantId || fromParticipantId === participantId) {
      return;
    }

    if (targetParticipantId && targetParticipantId !== participantId) {
      return;
    }

    const connection = ensurePeerConnection(fromParticipantId);

    try {
      if (payload.type === "offer") {
        await connection.setRemoteDescription(payload.description);
        attachLocalTracks(connection);
        await flushPendingIceCandidates(fromParticipantId, connection);
        const answer = await connection.createAnswer();
        await connection.setLocalDescription(answer);

        if (connection.localDescription && socketRef.current) {
          socketRef.current.emit("voice:signal", {
            roomSlug: slug,
            targetParticipantId: fromParticipantId,
            payload: {
              type: "answer",
              description: connection.localDescription.toJSON()
            } satisfies VoiceSignalPayload
          });
        }

        return;
      }

      if (payload.type === "answer") {
        await connection.setRemoteDescription(payload.description);
        await flushPendingIceCandidates(fromParticipantId, connection);
        return;
      }

      if (payload.type === "candidate") {
        if (connection.remoteDescription) {
          await connection.addIceCandidate(payload.candidate);
        } else {
          const pending = pendingIceCandidatesRef.current.get(fromParticipantId) ?? [];
          pending.push(payload.candidate);
          pendingIceCandidatesRef.current.set(fromParticipantId, pending);
        }
        return;
      }

      if (payload.type === "renegotiate" && participantId < fromParticipantId) {
        await renegotiateWith(fromParticipantId);
      }
    } catch {
      setError("Failed to process live audio/video signaling.");
    }
  }

  useEffect(() => {
    const participantName = guestName.trim() || session?.user.username?.trim() || "";
    if (!room || !participantId || !participantName || socketRef.current) {
      return;
    }

    const participantRole = participantId === room.hostId ? "host" : session ? "user" : "guest";
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
        participantId,
        accountId: session?.user.id
      });
      socket.emit("chat:history-sync", { roomSlug: slug });
      socket.emit("participant:media", {
        roomSlug: slug,
        patch: {
          isMuted: !microphoneEnabledRef.current,
          cameraEnabled: false,
          status: microphoneEnabledRef.current ? "listening" : "online"
        }
      });
    });

    socket.on("room:state", (nextRoom: RoomState) => {
      setRoom(nextRoom);
    });

    socket.on("room:users", (participants: RoomState["participants"]) => {
      setRoom((current) => (current ? { ...current, participants } : current));
    });

    socket.on("chat:message", (message: ChatMessage) => {
      setRoom((current) => {
        if (!current || current.messages.some((item) => item.id === message.id)) {
          return current;
        }

        return {
          ...current,
          messages: [...current.messages, message]
        };
      });
    });

    socket.on("video:state", (playback: RoomState["playback"]) => {
      setRoom((current) => (current ? { ...current, playback } : current));
    });

    socket.on(
      "voice:signal",
      (signal: {
        fromParticipantId: string;
        targetParticipantId?: string;
        payload: VoiceSignalPayload;
      }) => {
        void handleVoiceSignal(signal);
      }
    );

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
    if (!socketConnected || !participantId || !socketRef.current) {
      return;
    }

    socketRef.current.emit("participant:media", {
      roomSlug: slug,
      patch: {
        isMuted: !microphoneEnabled,
        cameraEnabled: false,
        status: microphoneEnabled ? "listening" : "online"
      }
    });
  }, [microphoneEnabled, participantId, slug, socketConnected]);

  const participantIdsKey = room?.participants.map((participant) => participant.id).sort().join("|") ?? "";

  useEffect(() => {
    if (!room || !participantId) {
      return;
    }

    const remoteParticipantIds = room.participants.filter((participant) => participant.id !== participantId).map((participant) => participant.id);
    setRemoteVolumes((current) => {
      const next: Record<string, number> = {};
      for (const remoteParticipantId of remoteParticipantIds) {
        next[remoteParticipantId] = current[remoteParticipantId] ?? 1;
      }
      return next;
    });
  }, [participantId, participantIdsKey, room]);

  useEffect(() => {
    if (!room || !participantId || !socketConnected) {
      return;
    }

    const remoteParticipantIds = room.participants.filter((participant) => participant.id !== participantId).map((participant) => participant.id);

    for (const remoteParticipantId of remoteParticipantIds) {
      ensurePeerConnection(remoteParticipantId);
    }

    for (const remoteParticipantId of [...peerConnectionsRef.current.keys()]) {
      if (!remoteParticipantIds.includes(remoteParticipantId)) {
        closePeerConnection(remoteParticipantId);
      }
    }

    requestPeerRefresh(remoteParticipantIds);
  }, [participantId, participantIdsKey, socketConnected]);

  useEffect(() => {
    if (!socketConnected || !participantId) {
      return;
    }

    renegotiateAllPeers();
  }, [localMediaVersion, participantId, participantIdsKey, socketConnected]);

  useEffect(() => {
    const localStream = localMediaStreamRef.current;
    const audioTrack = localStream?.getAudioTracks()[0];

    if (!participantId || !microphoneEnabled || !audioTrack?.enabled || !localStream) {
      stopSpeakingMonitor();
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const audioContext = new AudioContextClass();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const sourceNode = audioContext.createMediaStreamSource(localStream);
    sourceNode.connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    speakingAudioContextRef.current = audioContext;

    speakingMonitorRef.current = window.setInterval(() => {
      analyser.getByteTimeDomainData(samples);

      let sumSquares = 0;
      for (const sample of samples) {
        const normalized = (sample - 128) / 128;
        sumSquares += normalized * normalized;
      }

      const rms = Math.sqrt(sumSquares / samples.length);
      const nextSpeaking = microphoneEnabledRef.current && rms > 0.05;

      if (nextSpeaking !== localSpeakingRef.current) {
        localSpeakingRef.current = nextSpeaking;
        emitParticipantMediaPatch({
          isSpeaking: nextSpeaking,
          status: microphoneEnabledRef.current ? "listening" : "online"
        });
      }
    }, 180);

    return () => {
      stopSpeakingMonitor();
    };
  }, [localMediaVersion, microphoneEnabled, participantId]);

  useEffect(() => {
    stopRemoteSpeakingMonitors();

    if (!remoteMediaTiles.length) {
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const speakingState: Record<string, boolean> = {};

    for (const tile of remoteMediaTiles) {
      const audioTrack = tile.stream.getAudioTracks()[0];
      if (!audioTrack) {
        speakingState[tile.participantId] = false;
        continue;
      }

      const audioContext = new AudioContextClass();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      const sourceNode = audioContext.createMediaStreamSource(tile.stream);
      sourceNode.connect(analyser);
      void audioContext.resume().catch(() => {});

      const samples = new Uint8Array(analyser.fftSize);
      remoteSpeakingContextsRef.current.set(tile.participantId, audioContext);
      speakingState[tile.participantId] = false;

      const intervalId = window.setInterval(() => {
        analyser.getByteTimeDomainData(samples);

        let sumSquares = 0;
        for (const sample of samples) {
          const normalized = (sample - 128) / 128;
          sumSquares += normalized * normalized;
        }

        const nextSpeaking = Math.sqrt(sumSquares / samples.length) > 0.035;
        if (speakingState[tile.participantId] === nextSpeaking) {
          return;
        }

        speakingState[tile.participantId] = nextSpeaking;
        setRemoteSpeaking((current) => {
          if (current[tile.participantId] === nextSpeaking) {
            return current;
          }

          return {
            ...current,
            [tile.participantId]: nextSpeaking
          };
        });
      }, 180);

      remoteSpeakingIntervalsRef.current.set(tile.participantId, intervalId);
    }

    setRemoteSpeaking(speakingState);

    return () => {
      stopRemoteSpeakingMonitors();
    };
  }, [remoteMediaTiles]);

  useEffect(() => {
    if (!room) {
      return;
    }

    const interval = window.setInterval(() => {
      apiFetch<RoomState>(`/api/rooms/${slug}`)
        .then((nextRoom) => {
          setRoom(nextRoom);
        })
        .catch(() => {});
    }, socketConnected ? 4000 : 1500);

    return () => {
      window.clearInterval(interval);
    };
  }, [room?.id, slug, socketConnected]);

  const canInteract = Boolean(room && participantId);

  function patchLocalParticipant(patch: Partial<Participant>) {
    if (!participantId) {
      return;
    }

    setRoom((current) =>
      current
        ? {
            ...current,
            participants: current.participants.map((participant) =>
              participant.id === participantId
                ? {
                    ...participant,
                    ...patch
                  }
                : participant
            )
          }
        : current
    );
  }

  function emitParticipantMediaPatch(patch: Partial<Pick<Participant, "isMuted" | "cameraEnabled" | "isSpeaking" | "status">>) {
    patchLocalParticipant(patch);

    if (socketRef.current) {
      socketRef.current.emit("participant:media", {
        roomSlug: slug,
        patch
      });
    }
  }

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
        body: JSON.stringify({
          name: participantName,
          participantId: loadRoomPresence(slug).participantId || undefined
        }),
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
      throw new Error("Join the room before sending messages.");
    }

    try {
      const authorName = guestName.trim() || session?.user.username || "Guest";
      const message = await apiFetch<ChatMessage>(`/api/rooms/${slug}/messages`, {
        method: "POST",
        token: session?.accessToken,
        body: JSON.stringify({
          text,
          authorName
        })
      });

      setRoom((current) => {
        if (!current || current.messages.some((item) => item.id === message.id)) {
          return current;
        }

        return {
          ...current,
          messages: [...current.messages, message]
        };
      });

      if (socketRef.current && socketConnected) {
        socketRef.current.emit("chat:relay", {
          roomSlug: slug,
          message
        });
      }

      setError("");
    } catch (cause) {
      const nextError = cause instanceof Error ? cause.message : "Failed to send message.";
      setError(nextError);
      throw cause;
    }
  }

  function togglePlayback() {
    if (!socketRef.current || !room) return;
    socketRef.current.emit(room.playback.state === "playing" ? "video:pause" : "video:play", { roomSlug: slug });
  }

  function seek(deltaSeconds: number) {
    if (!socketRef.current || !room) return;
    const effectiveCurrentTime =
      room.playback.state === "playing"
        ? room.playback.currentTime + Math.max(0, (Date.now() - room.playback.serverTimestamp) / 1000) * (room.playback.playbackRate || 1)
        : room.playback.currentTime;
    const unclampedTime = Math.max(0, effectiveCurrentTime + deltaSeconds);
    const nextTime = room.playback.duration > 0 ? Math.min(room.playback.duration, unclampedTime) : unclampedTime;
    socketRef.current.emit("video:seek", { roomSlug: slug, currentTime: nextTime });
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

  async function leaveRoom() {
    setError("");
    stopSpeakingMonitor();
    stopRemoteSpeakingMonitors();
    clearRoomPresence(slug);
    const activeParticipantId = participantId;

    if (socketRef.current) {
      await new Promise<void>((resolve) => {
        const activeSocket = socketRef.current;
        if (!activeSocket) {
          resolve();
          return;
        }

        activeSocket.emit("room:leave", { roomSlug: slug }, () => resolve());
        window.setTimeout(resolve, 300);
      });

      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (activeParticipantId) {
      await apiFetch<{ ok: boolean }>(`/api/rooms/${slug}/leave`, {
        method: "POST",
        token: session?.accessToken,
        body: JSON.stringify({
          participantId: activeParticipantId
        })
      }).catch(() => {});
    }

    for (const connection of peerConnectionsRef.current.values()) {
      connection.close();
    }
    peerConnectionsRef.current.clear();
    remoteStreamsRef.current.clear();
    pendingIceCandidatesRef.current.clear();
    setRemoteMediaTiles([]);

    localMediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    localMediaStreamRef.current = null;
    setMicrophoneEnabled(false);
    setParticipantId("");
    setSocketConnected(false);

    router.push(session ? "/dashboard" : "/");
  }

  async function ensureLocalMedia(options: { audio?: boolean; video?: boolean }) {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw new Error("Media devices are not available in this browser.");
    }

    const localStream = localMediaStreamRef.current ?? new MediaStream();
    localMediaStreamRef.current = localStream;

    const needsAudio = Boolean(options.audio) && localStream.getAudioTracks().length === 0;
    const needsVideo = Boolean(options.video) && localStream.getVideoTracks().length === 0;

    if (needsAudio || needsVideo) {
      const freshStream = await navigator.mediaDevices.getUserMedia({
        audio: needsAudio,
        video: needsVideo
      });

      for (const track of freshStream.getTracks()) {
        localStream.addTrack(track);
      }
    }

    for (const connection of peerConnectionsRef.current.values()) {
      attachLocalTracks(connection);
    }

    setLocalMediaVersion((current) => current + 1);
    return localStream;
  }

  async function toggleMicrophone() {
    try {
      mediaTouchedRef.current = true;
      const localStream = await ensureLocalMedia({ audio: true });
      const audioTrack = localStream.getAudioTracks()[0];
      if (!audioTrack) {
        setError("Microphone track is unavailable.");
        return;
      }

      const nextEnabled = !(audioTrack.enabled && microphoneEnabled);
      audioTrack.enabled = nextEnabled;
      setMicrophoneEnabled(nextEnabled);
      emitParticipantMediaPatch({ isMuted: !nextEnabled, status: nextEnabled ? "listening" : "online" });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Microphone permission was blocked.");
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

  const localParticipant = room.participants.find((participant) => participant.id === participantId) ?? null;
  const displayParticipants = compactParticipants(room.participants, localParticipant, remoteSpeaking);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1.45fr)_420px] lg:px-8">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
          <ShieldCheck className="h-4 w-4" />
          Source attached room
        </div>

        <PlayerFrame playback={room.playback} onTogglePlayback={togglePlayback} onSeek={seek} />

        <MediaStage remoteMediaTiles={remoteMediaTiles} remoteVolumes={remoteVolumes} />

        <section className="grid gap-5 rounded-[28px] border border-white/8 bg-[#0a131f]/90 p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <div className="mb-2 text-4xl font-semibold tracking-tight text-white">{room.title}</div>
            <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-mist">
              <span>{getSourceLabel(room.playback.sourceType)}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{room.category}</span>
              <span className="h-1 w-1 rounded-full bg-white/20" />
              <span>{displayParticipants.length} participants</span>
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
              <a href={room.playback.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-3 rounded-[22px] bg-white px-5 py-4 text-base font-semibold text-slate-950">
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
              className={`flex items-center justify-center gap-3 rounded-[22px] border px-5 py-4 text-base font-medium ${microphoneEnabled ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/[0.03] text-white"}`}
            >
              <AudioLines className="h-5 w-5" />
              {microphoneEnabled ? "Microphone on" : "Enable microphone"}
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
          <ActionPill icon={microphoneEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />} label={microphoneEnabled ? "Mic on" : "Microphone"} onClick={() => void toggleMicrophone()} active={microphoneEnabled} />
          <ActionPill icon={<PanelRight className="h-5 w-5" />} label={panelOpen ? "Hide panels" : "Show panels"} onClick={() => setPanelOpen((current) => !current)} active={panelOpen} />
          <ActionPill icon={<LogOut className="h-5 w-5" />} label="Leave room" onClick={() => void leaveRoom()} />
        </section>

        {!canInteract ? (
          <section className="rounded-[28px] border border-white/8 bg-[#0a131f]/90 p-6">
            <div className="mb-3 text-2xl font-semibold text-white">Join this room</div>
            <p className="mb-5 text-sm text-mist">Enter a name if you opened the invite as a guest. Signed-in users can auto-join with their account name.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input value={guestName} onChange={(event) => setGuestName(event.target.value)} placeholder="Your name" className="h-12 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white outline-none placeholder:text-mist" />
              <button type="button" onClick={() => void joinRoom()} disabled={joining} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">
                {joining ? "Joining..." : "Join room"}
              </button>
            </div>
            {error ? <div className="mt-3 text-sm text-amber-200">{error}</div> : null}
          </section>
        ) : null}
      </div>

      <div className="space-y-6">
        <ChatPanel messages={room.messages} onSend={sendChat} disabled={!canInteract} />
        {panelOpen ? (
          <ParticipantsPanel
            participants={displayParticipants}
            volumes={Object.fromEntries(displayParticipants.map((participant) => [participant.id, getGroupVolume(participant, remoteVolumes)]))}
            onVolumeChange={updateRemoteVolume}
          />
        ) : null}
        <section className="rounded-[28px] border border-white/8 bg-[#0a131f]/90 p-5">
          <div className="mb-3 flex items-center gap-3 text-white">
            <Link2 className="h-5 w-5 text-signal" />
            Room status
          </div>
          <div className="space-y-3 text-sm text-mist">
            <p>Source: {getSourceLabel(room.playback.sourceType)}</p>
            <p>Realtime: {socketConnected ? "connected" : "fallback sync mode"}</p>
            <p>Microphone: {microphoneEnabled ? "enabled" : "off"}</p>
            <p>Playback: one shared screen with synced play, pause, and seek</p>
            <p>Temporary room session: stays available for a short grace period after everyone leaves</p>
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
    <button type="button" onClick={onClick} className={`flex items-center justify-center gap-3 rounded-[24px] border px-5 py-5 text-base text-white transition ${active ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100" : "border-white/8 bg-white/[0.03] hover:bg-white/[0.05]"}`}>
      {icon}
      {label}
    </button>
  );
}

function normalizeParticipantName(name: string) {
  return name.trim().toLowerCase();
}

function getParticipantGroupKey(participant: Participant) {
  if (participant.accountId) {
    return `account:${participant.accountId}`;
  }

  const normalizedName = normalizeParticipantName(participant.name);
  if (normalizedName) {
    return `name:${normalizedName}`;
  }

  return `participant:${participant.id}`;
}

function getGroupVolume(participant: DisplayParticipant, remoteVolumes: Record<string, number>) {
  for (const memberId of participant.memberIds) {
    if (typeof remoteVolumes[memberId] === "number") {
      return remoteVolumes[memberId];
    }
  }

  return 1;
}

function compactParticipants(participants: Participant[], localParticipant: Participant | null, remoteSpeaking: Record<string, boolean>) {
  const grouped = new Map<string, DisplayParticipant>();

  for (const participant of participants) {
    const key = getParticipantGroupKey(participant);
    const existing = grouped.get(key);
    const isLocal =
      participant.id === localParticipant?.id ||
      Boolean(localParticipant?.accountId && participant.accountId && localParticipant.accountId === participant.accountId);
    const isSpeaking = Boolean(participant.isSpeaking || remoteSpeaking[participant.id]);
    const isMuted = Boolean(participant.isMuted ?? true);

    if (!existing) {
      grouped.set(key, {
        id: key,
        name: participant.name,
        avatar: participant.avatar,
        role: participant.role,
        status: isSpeaking ? "listening" : participant.status,
        isSpeaking,
        isMuted,
        isLocal,
        memberIds: [participant.id]
      });
      continue;
    }

    grouped.set(key, {
      ...existing,
      role: existing.role === "host" || participant.role === "host" ? "host" : existing.role,
      status: existing.isSpeaking || isSpeaking ? "listening" : existing.status,
      isSpeaking: Boolean(existing.isSpeaking || isSpeaking),
      isMuted: Boolean(existing.isMuted) && isMuted,
      isLocal: existing.isLocal || isLocal,
      memberIds: [...existing.memberIds, participant.id]
    });
  }

  return [...grouped.values()];
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
