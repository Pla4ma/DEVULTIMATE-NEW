import type { ReactNode } from "react";
import { ObsidianNavSidebar } from "./ObsidianNavSidebar";
import { ObsidianTopBar } from "./ObsidianTopBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-obsidian-1 text-text-primary">
      <ObsidianNavSidebar />
      <div className="lg:ml-16 min-h-screen">
        <ObsidianTopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
