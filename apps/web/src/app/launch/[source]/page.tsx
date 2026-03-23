import { notFound } from "next/navigation";

import { SourceLaunchForm } from "@/components/source/source-launch-form";
import { getLaunchSource } from "@/lib/sources";

export default async function LaunchSourcePage({ params }: { params: Promise<{ source: string }> }) {
  const { source } = await params;
  const definition = getLaunchSource(source);

  if (!definition) {
    notFound();
  }

  return <SourceLaunchForm source={definition} />;
}
