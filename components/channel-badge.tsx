import type { ChannelId } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const channelMeta: Record<
  ChannelId,
  { label: string; file: string; color: string }
> = {
  instagram: { label: "Instagram", file: "instagram.svg", color: "#E4405F" },
  messenger: { label: "Messenger", file: "messenger.svg", color: "#00B2FF" },
  whatsapp: { label: "WhatsApp", file: "whatsapp.svg", color: "#25D366" },
  facebook: { label: "Facebook", file: "facebook.svg", color: "#1877F2" },
  threads: { label: "Threads", file: "threads.svg", color: "#111111" },
  x: { label: "X", file: "x.svg", color: "#111111" },
  linkedin: { label: "LinkedIn", file: "linkedin.svg", color: "#0A66C2" },
  email: { label: "Email", file: "gmail.svg", color: "#EA4335" },
};

export function ChannelIcon({
  channel,
  size = 16,
  className,
}: {
  channel: ChannelId;
  size?: number;
  className?: string;
}) {
  const meta = channelMeta[channel];
  if (!meta) return null;
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0", className)}
      style={{
        width: size,
        height: size,
        backgroundColor: meta.color,
        WebkitMask: `url(/brands/${meta.file}) center / contain no-repeat`,
        mask: `url(/brands/${meta.file}) center / contain no-repeat`,
      }}
    />
  );
}

export function ChannelBadge({
  channel,
  className,
}: {
  channel: ChannelId;
  className?: string;
}) {
  const meta = channelMeta[channel];
  if (!meta) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-white/50 bg-white/55 px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm",
        className,
      )}
    >
      <ChannelIcon channel={channel} size={12} />
      {meta.label}
    </span>
  );
}

export function ChannelDot({ channel }: { channel: ChannelId }) {
  const meta = channelMeta[channel];
  if (!meta) return null;
  return (
    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta.color }} />
  );
}
