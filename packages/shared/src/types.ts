export type LaunchSource = "youtube" | "vkvideo" | "rutube" | "twitch" | "file" | "link";
export type SourceType = "youtube" | "vkvideo" | "rutube" | "twitch" | "upload" | "hls" | "url" | "internal";
export type PlaybackState = "idle" | "playing" | "paused";
export type RoomRole = "host" | "moderator" | "user" | "guest";

export interface Participant {
  id: string;
  accountId?: string;
  name: string;
  role: RoomRole;
  avatar: string;
  status: "online" | "typing" | "listening" | "away";
  isSpeaking?: boolean;
  isMuted?: boolean;
  cameraEnabled?: boolean;
}

export interface ChatMessage {
  id: string;
  authorId: string;
  authorName: string;
  avatar: string;
  text: string;
  createdAt: string;
  type: "user" | "system";
}

export interface PlaybackSnapshot {
  sourceType: SourceType;
  sourceRef: string;
  title: string;
  sourceUrl?: string;
  embedUrl?: string;
  coverImage?: string;
  currentTime: number;
  duration: number;
  state: PlaybackState;
  playbackRate: number;
  serverTimestamp: number;
}

export interface RoomState {
  id: string;
  slug: string;
  title: string;
  category: string;
  hostId: string;
  visibility: "public" | "unlisted" | "private";
  participants: Participant[];
  playback: PlaybackSnapshot;
  inviteUrl: string;
  messages: ChatMessage[];
}

export interface RoomEventPayload {
  roomSlug: string;
  actorId?: string;
}

export interface VideoSeekPayload extends RoomEventPayload {
  currentTime: number;
}

export interface VideoStatePayload extends RoomEventPayload {
  playback: PlaybackSnapshot;
}
