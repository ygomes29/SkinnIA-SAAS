import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export default function AuthLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className={cn(
      "flex min-h-screen w-full items-center justify-center p-6 lg:p-10",
      "bg-[var(--sk-bg-app)]"
    )}>
      {children}
    </div>
  );
}
