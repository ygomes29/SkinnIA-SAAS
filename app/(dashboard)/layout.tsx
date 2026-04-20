import type { ReactNode } from "react";

import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils/cn";

export default function DashboardLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className={cn(
      "min-h-screen bg-transparent text-[var(--sk-text-primary)] lg:flex"
    )}>
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
