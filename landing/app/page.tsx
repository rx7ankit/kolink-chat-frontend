import { Footer } from "@/components/chrome/footer";
import { Nav } from "@/components/chrome/nav";
import { Hero } from "@/components/hero/hero";
import { Agent } from "@/components/sections/agent";
import { Automations } from "@/components/sections/automations";
import { Broadcasts } from "@/components/sections/broadcasts";
import { Faq } from "@/components/sections/faq";
import { How } from "@/components/sections/how";
import { Inbox } from "@/components/sections/inbox";
import { Insights } from "@/components/sections/insights";
import { Knowledge } from "@/components/sections/knowledge";
import { Lines } from "@/components/sections/lines";
import { Start } from "@/components/sections/start";
import { Toolbox } from "@/components/sections/toolbox";

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Lines />
        <Agent />
        <Knowledge />
        <Automations />
        <Broadcasts />
        <Inbox />
        <Insights />
        <Toolbox />
        <How />
        <Start />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
