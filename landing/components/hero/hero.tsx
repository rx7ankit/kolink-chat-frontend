import { heroCss } from "./hero-styles";
import { HeroTitle } from "./hero-title";
import { HeroStage } from "./stage";

/**
 * The hero: "The Interchange". One post leaves the composer as a capsule, rides the trunk
 * into the koLink hub and fans out on the five publish lines; all eight lines write back and
 * the hub's points switch sends each reply to an automation, the AI agent or your team.
 * Everything that carries meaning is server-rendered in its READY state; JS only adds life.
 */
export function Hero() {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: heroCss }} />
      <HeroStage title={<HeroTitle />} />
    </>
  );
}
