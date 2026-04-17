import type { ReactNode } from "react";

export default function AuthLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F9FAFB] p-6 lg:p-10">
      {children}
    </div>
  );
}
