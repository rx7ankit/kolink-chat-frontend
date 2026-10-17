import { ArrowUp, EyeOff, Heart, MessageCircle, Trash2 } from "lucide-react";

import { PlatformIcon } from "@/components/brand/platform-icon";
import { Glyph } from "@/components/transit/glyph";

import { MediaThumb } from "../automations/brand";
import { engagement, networkLabel } from "./data";

/** What you can do on a published post, per network. Instagram's listing carries the Automations button. */
export function EngagementPanel() {
  return (
    <div className="min-w-0">
      <p className="eyebrow">After it&apos;s live</p>
      <h3 className="font-display mt-3 text-[26px] leading-[1.04] md:text-[30px]">Handle the replies</h3>
      <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-ink-soft">
        Each listing gets its own post page, imported posts included.
      </p>

      <ul className="mt-6 border-t border-ink">
        {engagement.map((e) => (
          <li key={e.network} className="grid grid-cols-[4px_minmax(0,1fr)] gap-x-4 border-b border-line py-4 md:grid-cols-[4px_150px_minmax(0,1fr)_auto] md:items-start">
            <span aria-hidden className="row-span-3 self-stretch md:row-span-1" style={{ background: `var(--line-${e.network})` }} />
            <p className="flex items-center gap-2 text-[14px] font-medium">
              <PlatformIcon id={e.network} size={15} />
              {networkLabel[e.network]}
            </p>
            <div className="col-start-2 mt-1.5 min-w-0 md:col-start-3 md:mt-0">
              <p className="text-[14.5px] leading-snug text-ink">{e.actions}</p>
              {e.network === "instagram" && <CommentMock />}
            </div>
            {e.automations && (
              <div className="col-start-2 mt-3 md:col-start-4 md:mt-0">
                <a href="#automations" className="k-btn k-btn-ghost h-11 px-4 text-[14px]">
                  <Glyph handler="automation" size={10} />
                  Automations
                  <ArrowUp className="size-4" aria-hidden />
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A comment on the Instagram listing page, beside the post it was left on. Illustration only. */
function CommentMock() {
  const icons = [
    { Icon: Heart, label: "Like" },
    { Icon: MessageCircle, label: "Reply" },
    { Icon: EyeOff, label: "Hide" },
    { Icon: Trash2, label: "Delete" },
  ];
  return (
    <div className="mt-3 flex max-w-[460px] items-center gap-3 rounded-lg border border-line bg-surface p-2 pr-3" aria-hidden>
      <span className="relative h-[50px] w-10 shrink-0 overflow-hidden rounded-md bg-bg-alt">
        <MediaThumb src="reel" sizes="40px" />
      </span>
      <p className="min-w-0 flex-1 text-[13px] leading-snug">
        <span className="font-semibold">olive.days</span> does it come in olive?
        <span className="mono mt-0.5 block truncate text-[11px] text-ink-soft">on Drop 04 · Reel</span>
      </p>
      <span className="flex shrink-0 items-center gap-2.5 text-ink-soft">
        {icons.map(({ Icon, label }) => (
          <Icon key={label} className="size-3.5" strokeWidth={1.75} />
        ))}
      </span>
    </div>
  );
}
