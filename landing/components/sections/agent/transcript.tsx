import { agentSteps, catalog, type Beat } from "./data";

function describe(beat: Beat): string | null {
  switch (beat.kind) {
    case "msg": {
      if (beat.carousel) return `Agent sends ${catalog.length} catalog swipe cards with photos and prices.`;
      const who = beat.from === "customer" ? "Customer" : beat.from === "agent" ? "Agent" : "Menu bot";
      let text = `${who}: ${beat.lines.join(" ")}`;
      if (beat.buttons) text += ` Buttons: ${beat.buttons.join(", ")}.`;
      return text;
    }
    case "toast":
      return "Switching Messenger to Agentic asks for confirmation.";
    case "handoff":
      return "The thread goes to your team as Needs attention.";
    default:
      return null;
  }
}

/** The pinned demo as plain text, for screen readers. */
export function Transcript({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p>Demo conversation for Northwind Studio, a demo brand. One mode per channel, never both.</p>
      <ol>
        {agentSteps.map((s) => (
          <li key={s.n}>
            {s.label}: {s.story}
            <ul>
              {s.beats.map((b, i) => {
                const text = describe(b);
                return text ? <li key={i}>{text}</li> : null;
              })}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
