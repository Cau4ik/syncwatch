import { nanoid } from "nanoid";
import type { ChatMessage, Participant, PlaybackSnapshot, RoomState } from "@syncwatch/shared";

import { env } from "../config/env.js";

const now = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

interface StoredRoom extends RoomState {
  ownerName: string;
  persistent: boolean;
}

function appUrl(path: string) {
  return `${env.WEB_URL.trim().replace(/\/$/, "")}${path}`;
}

function toRoomState(room: StoredRoom): RoomState {
  const { ownerName: _ownerName, persistent: _persistent, ...state } = room;

  return {
    ...state,
    playback: { ...state.playback },
    participants: [...state.participants],
    messages: [...state.messages]
  };
}

function createPlayback(): PlaybackSnapshot {
  return {
    sourceType: "youtube",
    sourceRef: "dQw4w9WgXcQ",
    title: "Neon Skyline Cut",
    currentTime: 2732,
    duration: 8095,
    state: "playing",
    playbackRate: 1,
    serverTimestamp: Date.now()
  };
}

const room: StoredRoom = {
  id: "room_demo_1",
  slug: "cyber-city-night",
  title: "Вечер кино с друзьями",
  category: "Фантастика",
  hostId: "user_alex",
  visibility: "private",
  inviteUrl: appUrl("/rooms/cyber-city-night"),
  playback: createPlayback(),
  participants: [
    { id: "user_alex", name: "Алекс", role: "host", avatar: "А", status: "online" },
    { id: "user_masha", name: "Маша", role: "user", avatar: "М", status: "online" }
  ],
  messages: [
    {
      id: nanoid(),
      authorId: "system",
      authorName: "Система",
      avatar: "S",
      text: "Комната готова к входу.",
      createdAt: now(),
      type: "system"
    }
  ],
  ownerName: "Alex",
  persistent: true
};

const rooms = new Map<string, StoredRoom>([[room.slug, room]]);

export const store = {
  listRooms(ownerId?: string) {
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
        playbackState: item.playback.state
      }));
  },

  getRoom(slug: string) {
    const room = rooms.get(slug);
    return room ? toRoomState(room) : null;
  },

  createRoom({ title, ownerId, ownerName }: { title: string; ownerId: string; ownerName: string }) {
    const slug = `${title.toLowerCase().replace(/\s+/g, "-")}-${nanoid(6)}`;
    const nextRoom: StoredRoom = {
      id: nanoid(),
      slug,
      title,
      category: "Новая комната",
      hostId: ownerId,
      visibility: "unlisted",
      inviteUrl: appUrl(`/rooms/${slug}`),
      playback: {
        sourceType: "youtube",
        sourceRef: "jNQXAC9IVRw",
        title: "Room not started",
        currentTime: 0,
        duration: 300,
        state: "idle",
        playbackRate: 1,
        serverTimestamp: Date.now()
      },
      participants: [],
      messages: [],
      ownerName,
      persistent: false
    };

    rooms.set(slug, nextRoom);
    return toRoomState(nextRoom);
  },

  upsertParticipant(slug: string, participant: Participant) {
    const currentRoom = rooms.get(slug);
    if (!currentRoom) return null;

    const existing = currentRoom.participants.find((item) => item.id === participant.id);
    if (existing) {
      Object.assign(existing, participant);
      return toRoomState(currentRoom);
    }

    currentRoom.participants.push(participant);
    return toRoomState(currentRoom);
  },

  removeParticipant(slug: string, participantId: string) {
    const currentRoom = rooms.get(slug);
    if (!currentRoom) {
      return { room: null, deleted: false };
    }

    currentRoom.participants = currentRoom.participants.filter((item) => item.id !== participantId);

    if (!currentRoom.persistent && currentRoom.participants.length === 0) {
      rooms.delete(slug);
      return { room: null, deleted: true };
    }

    return { room: toRoomState(currentRoom), deleted: false };
  },

  addMessage(slug: string, payload: Omit<ChatMessage, "id" | "createdAt">) {
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
  }
};
