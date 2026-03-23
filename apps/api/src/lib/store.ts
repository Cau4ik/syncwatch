import { nanoid } from "nanoid";
import type { ChatMessage, Participant, PlaybackSnapshot, RoomState } from "@syncwatch/shared";

import { env } from "../config/env.js";

const now = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

interface StoredRoom extends RoomState {
  ownerName: string;
  persistent: boolean;
  emptySince: number | null;
}

const TEMP_ROOM_IDLE_TTL_MS = 1000 * 60 * 30;

function appUrl(path: string) {
  return `${env.WEB_URL.trim().replace(/\/$/, "")}${path}`;
}

function isExpired(room: StoredRoom) {
  return !room.persistent && room.emptySince !== null && Date.now() - room.emptySince > TEMP_ROOM_IDLE_TTL_MS;
}

function purgeExpiredRooms() {
  for (const [slug, room] of rooms.entries()) {
    if (isExpired(room)) {
      rooms.delete(slug);
    }
  }
}

function toRoomState(room: StoredRoom): RoomState {
  const { ownerName: _ownerName, persistent: _persistent, emptySince: _emptySince, ...state } = room;

  return {
    ...state,
    playback: { ...state.playback },
    participants: state.participants.map((participant) => ({ ...participant })),
    messages: [...state.messages]
  };
}

function createDemoPlayback(): PlaybackSnapshot {
  return {
    sourceType: "youtube",
    sourceRef: "jNQXAC9IVRw",
    title: "Me at the zoo",
    sourceUrl: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    embedUrl: "https://www.youtube.com/embed/jNQXAC9IVRw?rel=0",
    currentTime: 0,
    duration: 19,
    state: "paused",
    playbackRate: 1,
    serverTimestamp: Date.now()
  };
}

const demoRoom: StoredRoom = {
  id: "room_demo_1",
  slug: "cyber-city-night",
  title: "Demo cinema room",
  category: "YouTube",
  hostId: "user_alex",
  visibility: "private",
  inviteUrl: appUrl("/rooms/cyber-city-night"),
  playback: createDemoPlayback(),
  participants: [
    { id: "user_alex", name: "Alex", role: "host", avatar: "A", status: "online" },
    { id: "user_masha", name: "Masha", role: "user", avatar: "M", status: "online" }
  ],
  messages: [
    {
      id: nanoid(),
      authorId: "system",
      authorName: "System",
      avatar: "S",
      text: "Room is ready for a shared session.",
      createdAt: now(),
      type: "system"
    }
  ],
  ownerName: "Alex",
  persistent: true,
  emptySince: null
};

const rooms = new Map<string, StoredRoom>([[demoRoom.slug, demoRoom]]);

export const store = {
  listRooms(ownerId?: string) {
    purgeExpiredRooms();

    if (!ownerId) {
      return [];
    }

    return [...rooms.values()]
      .filter((item) => item.hostId === ownerId)
      .map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        category: item.category,
        visibility: item.visibility,
        participantsCount: item.participants.length,
        playbackState: item.playback.state,
        sourceType: item.playback.sourceType
      }));
  },

  getRoom(slug: string) {
    purgeExpiredRooms();
    const room = rooms.get(slug);
    return room ? toRoomState(room) : null;
  },

  createRoom({
    title,
    ownerId,
    ownerName,
    playback,
    category,
    visibility = "unlisted",
    persistent = false
  }: {
    title: string;
    ownerId: string;
    ownerName: string;
    playback: PlaybackSnapshot;
    category: string;
    visibility?: RoomState["visibility"];
    persistent?: boolean;
  }) {
    const slug = `${title.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "") || "room"}-${nanoid(6)}`;
    const hostParticipant: Participant = {
      id: ownerId,
      name: ownerName,
      role: "host",
      avatar: ownerName.charAt(0).toUpperCase(),
      status: "online"
    };

    const nextRoom: StoredRoom = {
      id: nanoid(),
      slug,
      title,
      category,
      hostId: ownerId,
      visibility,
      inviteUrl: appUrl(`/rooms/${slug}`),
      playback: {
        ...playback,
        serverTimestamp: Date.now()
      },
      participants: [hostParticipant],
      messages: [
        {
          id: nanoid(),
          authorId: "system",
          authorName: "System",
          avatar: "S",
          text: `${ownerName} started a new ${category} room.`,
          createdAt: now(),
          type: "system"
        }
      ],
      ownerName,
      persistent,
      emptySince: null
    };

    rooms.set(slug, nextRoom);

    return {
      room: toRoomState(nextRoom),
      participantId: hostParticipant.id
    };
  },

  upsertParticipant(slug: string, participant: Participant) {
    purgeExpiredRooms();
    const currentRoom = rooms.get(slug);
    if (!currentRoom) return null;

    if (currentRoom.participants.length === 0) {
      currentRoom.hostId = participant.id;
      currentRoom.ownerName = participant.name;
      participant = {
        ...participant,
        role: "host"
      };
    }

    const existing = currentRoom.participants.find((item) => item.id === participant.id);
    if (existing) {
      Object.assign(existing, participant);
      currentRoom.emptySince = null;
      return toRoomState(currentRoom);
    }

    currentRoom.participants.push(participant);
    currentRoom.emptySince = null;
    return toRoomState(currentRoom);
  },

  removeParticipant(slug: string, participantId: string) {
    purgeExpiredRooms();
    const currentRoom = rooms.get(slug);
    if (!currentRoom) {
      return { room: null, deleted: false };
    }

    currentRoom.participants = currentRoom.participants.filter((item) => item.id !== participantId);

    if (currentRoom.participants.length === 0) {
      currentRoom.emptySince = Date.now();
      return { room: toRoomState(currentRoom), deleted: false };
    }

    currentRoom.emptySince = null;

    if (currentRoom.hostId === participantId) {
      const nextHost = currentRoom.participants[0];
      currentRoom.hostId = nextHost.id;
      currentRoom.ownerName = nextHost.name;
      currentRoom.participants = currentRoom.participants.map((item) => ({
        ...item,
        role: item.id === nextHost.id ? "host" : item.role === "host" ? "user" : item.role
      }));
    }

    return { room: toRoomState(currentRoom), deleted: false };
  },

  addMessage(slug: string, payload: Omit<ChatMessage, "id" | "createdAt">) {
    purgeExpiredRooms();
    const currentRoom = rooms.get(slug);
    if (!currentRoom) return null;

    const message: ChatMessage = {
      id: nanoid(),
      createdAt: now(),
      ...payload
    };

    currentRoom.messages.push(message);
    return message;
  },

  addSystemMessage(slug: string, text: string) {
    return this.addMessage(slug, {
      authorId: "system",
      authorName: "System",
      avatar: "S",
      text,
      type: "system"
    });
  },

  updatePlayback(slug: string, patch: Partial<PlaybackSnapshot>) {
    purgeExpiredRooms();
    const currentRoom = rooms.get(slug);
    if (!currentRoom) return null;

    currentRoom.playback = {
      ...currentRoom.playback,
      ...patch,
      serverTimestamp: Date.now()
    };

    return {
      ...currentRoom.playback
    };
  },

  updateParticipant(slug: string, participantId: string, patch: Partial<Participant>) {
    purgeExpiredRooms();
    const currentRoom = rooms.get(slug);
    if (!currentRoom) return null;

    const participant = currentRoom.participants.find((item) => item.id === participantId);
    if (!participant) return null;

    Object.assign(participant, patch);
    return toRoomState(currentRoom);
  }
};
