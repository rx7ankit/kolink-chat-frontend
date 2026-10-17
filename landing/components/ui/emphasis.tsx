import { Fragment } from "react";

import { parseEmphasis } from "@/lib/copy";

/**
 * Renders copy where *starred* words get the Studio emphasis treatment.
 * `terminal` marks the last emphasis run so the "route line" style can end in a station roundel.
 */
export function Emphasis({ text, terminal = false }: { text: string; terminal?: boolean }) {
  const segments = parseEmphasis(text);
  const last = segments.map((s) => s.em).lastIndexOf(true);
  return (
    <>
      {segments.map((seg, i) =>
        seg.em ? (
          <em key={i} className="em" data-terminal={terminal && i === last ? "" : undefined}>
            {seg.text}
          </em>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}
    </>
  );
}
