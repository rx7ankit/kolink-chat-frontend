/**
 * Twelve hairline columns with tiny mono numbers, inside the hero stage only (desktop).
 * Visibility is pure CSS keyed on html[data-grid="hero"] (see hero-styles.ts), so it never
 * flashes after hydration and never doubles the page-wide overlay ("everywhere"/"baseline").
 */
export function GridOverlay() {
  return (
    <div aria-hidden className="kh-grid pointer-events-none absolute inset-0 grid-cols-12 gap-x-6">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="relative border-x border-line/40">
          <span className="mono absolute -top-5 left-1 text-[10px] text-ink-soft/70">{String(i + 1).padStart(2, "0")}</span>
        </div>
      ))}
    </div>
  );
}
