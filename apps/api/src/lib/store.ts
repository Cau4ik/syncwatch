import { nanoid } from "nanoid";
import type { ChatMessage, Participant, PlaybackSnapshot, RoomState } from "@syncwatch/shared";

const now = () => new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

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

const room: RoomState = {
  id: "room_demo_1",
  slug: "cyber-city-night",
  title: "Вечер кино с друзьями",
  category: "Фантастика",
  hostId: "user_alex",
  visibility: "private",
  inviteUrl: "syncwatch.app/room/cyber-city-night",
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
  ]
};

const rooms = new Map<string, RoomState>([[room.slug, room]]);

export const store = {
  listRooms() {
    return [...rooms.values()].map((item) => ({
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
    return rooms.get(slug) ?? null;
  },

  createRoom(title: string) {
    const slug = `${title.toLowerCase().replace(/\s+/g, "-")}-${nanoid(6)}`;
    const nextRoom: RoomState = {
      id: nanoid(),
      slug,
      title,
      category: "Новая комната",
      hostId: "local-host",
      visibility: "unlisted",
      inviteUrl: `syncwatch.app/room/${slug}`,
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
      participants: [{ id: "local-host", name: "Host", role: "host", avatar: "H", status: "online" }],
      messages: []
    };

    rooms.set(slug, nextRoom);
    return nextRoom;
  },

  upsertParticipant(slug: string, participant: Participant) {
    const currentRoom = rooms.get(slug);
    if (!currentRoom) return null;

    const existing = currentRoom.participants.find((item) => item.id === participant.id);
    if (existing) {
      Object.assign(existing, participant);
      return currentRoom;
    }

    currentRoom.participants.push(participant);
    return currentRoom;
  },

  removeParticipant(slug: string, participantId: string) {
    const currentRoom = rooms.get(slug);
    if (!currentRoom) return null;

    currentRoom.participants = currentRoom.participants.filter((item) => item.id !== participantId);
    return currentRoom;
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

    return currentRoom.playback;
  }
};
