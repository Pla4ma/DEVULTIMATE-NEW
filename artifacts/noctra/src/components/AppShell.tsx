import type { ReactNode } from "react";
import { VoidNavSidebar } from "./VoidNavSidebar";
import { VoidTopBar } from "./VoidTopBar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-void-0 text-text-primary">
      <VoidNavSidebar />
      <div className="lg:ml-[72px] min-h-screen">
        <VoidTopBar />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
