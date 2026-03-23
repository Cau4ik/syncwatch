function normalizeUrl(value: string | undefined, fallback: string) {
  return value?.trim().replace(/\/$/, "") || fallback;
}

export const apiUrl = normalizeUrl(process.env.NEXT_PUBLIC_API_URL, "http://localhost:4000");

export const socketUrl = normalizeUrl(process.env.NEXT_PUBLIC_SOCKET_URL, apiUrl);
