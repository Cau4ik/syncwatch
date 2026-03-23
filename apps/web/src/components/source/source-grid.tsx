import Link from "next/link";
import { Clapperboard, FileVideo, Link2, MonitorPlay, PlaySquare, Radio } from "lucide-react";

import { launchSources } from "@/lib/sources";

function SourceIcon({ source }: { source: (typeof launchSources)[number]["id"] }) {
  switch (source) {
    case "youtube":
      return <PlaySquare className="h-6 w-6" />;
    case "vkvideo":
      return <MonitorPlay className="h-6 w-6" />;
    case "rutube":
      return <Clapperboard className="h-6 w-6" />;
    case "twitch":
      return <Radio className="h-6 w-6" />;
    case "file":
      return <FileVideo className="h-6 w-6" />;
    case "link":
      return <Link2 className="h-6 w-6" />;
  }
}

export function SourceGrid({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "grid gap-4 md:grid-cols-2 xl:grid-cols-3"}>
      {launchSources.map((source) => (
        <Link
          key={source.id}
          href={`/launch/${source.id}`}
          className="group rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,#0f1b2a,#08111b)] p-6 transition hover:-translate-y-0.5 hover:border-white/15"
          style={{
            backgroundImage: `${source.accent}, linear-gradient(180deg,#0f1b2a,#08111b)`
          }}
        >
          <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-white">
            <SourceIcon source={source.id} />
          </div>
          <div className="mb-2 text-2xl font-semibold text-white">{source.label}</div>
          <p className="mb-5 text-sm leading-6 text-mist">{source.description}</p>
          <div className="text-sm font-medium text-flare">Choose source</div>
        </Link>
      ))}
    </div>
  );
}
