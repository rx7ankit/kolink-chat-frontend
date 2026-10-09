import type { ReactNode } from "react";

export default function BotSetupLayout({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-4xl px-4 py-6">{children}</div>;
}
