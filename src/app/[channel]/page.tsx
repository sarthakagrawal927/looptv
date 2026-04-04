import TVApp from "@/components/TVApp";
import stations from "../../../channels.config";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return stations.map((s) => ({ channel: s.id }));
}

export function generateMetadata({ params }: { params: Promise<{ channel: string }> }) {
  return params.then(({ channel }) => {
    const st = stations.find((s) => s.id === channel);
    return {
      title: st ? `${st.name} | LoopTV` : "LoopTV",
      description: st?.description || "Random clips from your favorite channels",
    };
  });
}

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channel: string }>;
}) {
  const { channel } = await params;
  if (!stations.find((s) => s.id === channel)) notFound();
  return <TVApp initialChannel={channel} />;
}
