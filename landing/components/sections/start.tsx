import { BoardingPass } from "@/components/sections/start/boarding-pass";
import styles from "@/components/sections/start/ticket.module.css";
import { Section } from "@/components/ui/section";

/** §10 · Get started: a boarding pass whose stub is the sign-up. No prices or plan names. */
export function Start() {
  return (
    <Section id="start" className={`${styles.band} overflow-x-clip`}>
      <BoardingPass />
    </Section>
  );
}
