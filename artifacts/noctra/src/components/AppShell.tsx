import type { ReactNode } from "react";
import { ObsidianNavSidebar } from "./ObsidianNavSidebar";
import { ObsidianTopBar } from "./ObsidianTopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen text-text-primary" style={{ background: "#151030" }}>
      <ObsidianNavSidebar />
      <div className="lg:ml-[4.5rem] min-h-screen">
        <ObsidianTopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
