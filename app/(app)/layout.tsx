import type { ReactNode } from "react";

import { AuthGate } from "@/components/app/auth-gate";
import { AppSidebar } from "@/components/app/sidebar";
import { AppTopbar } from "@/components/app/topbar";
import { SidebarCollapseProvider } from "@/lib/sidebar/collapse";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <SidebarCollapseProvider>
        <div className="flex h-svh overflow-hidden bg-transparent">
          <AppSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <AppTopbar />
            <main className="min-h-0 flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarCollapseProvider>
    </AuthGate>
  );
}
