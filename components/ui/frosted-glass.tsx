"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Radix positions floating UI with
 *   [data-radix-popper-content-wrapper] { transform: translate3d(x, y, 0) }
 * Chrome will not apply backdrop-filter through (or on) a transformed layer in a
 * way that samples page content, so menus look translucent but sharp.
 *
 * This patches the wrapper: copy translate → left/top, then clear transform so
 * frosted glass can blur what is behind the menu.
 */
function useDisablePopperTransform(nodeRef: React.RefObject<HTMLElement | null>) {
  React.useLayoutEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const wrapper = node.closest("[data-radix-popper-content-wrapper]") as HTMLElement | null;
    if (!wrapper) return;

    const sync = () => {
      const transform = wrapper.style.transform;
      if (!transform || transform === "none") return;

      const match =
        transform.match(/translate3d\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px/i) ??
        transform.match(/translate\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px/i);
      if (!match) return;

      wrapper.style.transform = "none";
      wrapper.style.left = `${match[1]}px`;
      wrapper.style.top = `${match[2]}px`;
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(wrapper, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [nodeRef]);
}

export function FrostedGlass({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  useDisablePopperTransform(ref);

  return (
    <div ref={ref} className={cn("glass-popover", className)}>
      {children}
    </div>
  );
}
