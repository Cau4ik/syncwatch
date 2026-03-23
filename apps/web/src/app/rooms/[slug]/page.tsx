import { RoomShell } from "@/components/room/room-shell";

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RoomShell slug={slug} />;
}

