const roomNameStorageKey = (slug: string) => `syncwatch-room-${slug}`;
const roomParticipantStorageKey = (slug: string) => `syncwatch-room-participant-${slug}`;

export function loadRoomPresence(slug: string) {
  if (typeof window === "undefined") {
    return { name: "", participantId: "" };
  }

  return {
    name: window.localStorage.getItem(roomNameStorageKey(slug)) ?? "",
    participantId: window.localStorage.getItem(roomParticipantStorageKey(slug)) ?? ""
  };
}

export function saveRoomPresence(slug: string, payload: { name: string; participantId: string }) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(roomNameStorageKey(slug), payload.name);
  window.localStorage.setItem(roomParticipantStorageKey(slug), payload.participantId);
}

export function clearRoomPresence(slug: string) {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(roomNameStorageKey(slug));
  window.localStorage.removeItem(roomParticipantStorageKey(slug));
}
