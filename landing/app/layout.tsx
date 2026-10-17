import type { Metadata, Viewport } from "next";

import "./globals.css";

import { GridOverlay } from "@/components/chrome/grid-overlay";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { DesignStudio } from "@/components/studio/design-studio";
import { fontVariables } from "@/lib/fonts";
import { APP_URL, studioEnabled } from "@/lib/site";
import { buildBootScript, buildStudioCss, defaultLook, lookAttributes } from "@/lib/studio/look";

export const metadata: Metadata = {
  metadataBase: new URL("https://getkolink.com"),
  title: "koLink Chat — Post once. Catch every reply.",
  description:
    "Publish to Instagram, Facebook, Threads, X and LinkedIn in one go. Every comment, DM and email from eight channels lands in one inbox, where keyword automations and an AI agent for Instagram and Messenger DMs answer the routine ones.",
  openGraph: {
    title: "koLink Chat — Post once. Catch every reply.",
    description: "Eight channels, one interchange. Automations and an AI agent answer the routine replies; your team gets the rest.",
    url: "https://getkolink.com",
    siteName: "koLink Chat",
    type: "website",
  },
  alternates: { canonical: "/" },
  other: { "app-url": APP_URL },
};

export const viewport: Viewport = {
  themeColor: "#F5F3EE",
  colorScheme: "light",
};

const studioCss = buildStudioCss();
const bootScript = buildBootScript();

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVariables} {...lookAttributes(defaultLook)} suppressHydrationWarning>
      <head>
        <style id="studio-tokens" dangerouslySetInnerHTML={{ __html: studioCss }} />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <SmoothScroll>{children}</SmoothScroll>
        <GridOverlay />
        {studioEnabled && <DesignStudio />}
      </body>
    </html>
  );
}
