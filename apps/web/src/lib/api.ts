import type { SourceType } from "@syncwatch/shared";

import { apiUrl } from "./config";

export async function apiFetch<T>(
  path: string,
  init?: (RequestInit & { token?: string }) | undefined
): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.token ? { Authorization: `Bearer ${init.token}` } : {}),
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const fallback = `Request failed: ${response.status}`;

    try {
      const data = (await response.json()) as { message?: string };
      throw new Error(data.message || fallback);
    } catch {
      throw new Error(fallback);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    bio?: string;
  };
  accessToken: string;
}

export interface RoomSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  visibility: "public" | "unlisted" | "private";
  participantsCount: number;
  playbackState: "idle" | "playing" | "paused";
  sourceType: SourceType;
}
