export const apiUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000";

export const socketUrl =
  process.env.NEXT_PUBLIC_SOCKET_URL?.replace(/\/$/, "") || apiUrl;

