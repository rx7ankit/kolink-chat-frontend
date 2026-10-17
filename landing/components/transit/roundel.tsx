import type { ComponentPropsWithRef, ReactNode } from "react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { cn } from "@/lib/cn";
import type { PlatformId } from "@/lib/platforms";

/**
 * A station roundel: white disc, line-colored ring, platform mark inside.
 * Set `active` while traffic is on the line. Extra props (ref, data-*, aria-*)
 * pass through to the root, so callers can measure it directly.
 */
export function Roundel({
  platform,
  size = 28,
  active = false,
  children,
  className,
  style,
  ...rest
}: Omit<ComponentPropsWithRef<"span">, "children"> & {
  platform?: PlatformId;
  size?: number;
  active?: boolean;
  children?: ReactNode;
}) {
  return (
    <span
      {...rest}
      data-active={active ? "true" : "false"}
      className={cn("relative inline-grid shrink-0 place-items-center rounded-full bg-surface", className)}
      style={{
        width: size,
        height: size,
        boxShadow: `inset 0 0 0 ${Math.max(2, size * 0.09)}px ${platform ? `var(--line-${platform})` : "var(--k-ink)"}`,
        ...style,
      }}
    >
      {platform ? <PlatformIcon id={platform} size={Math.round(size * 0.5)} /> : children}
    </span>
  );
}
