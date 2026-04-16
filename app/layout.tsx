import type { ReactNode } from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "SkinnIA",
  description: "Plataforma SaaS de automação para negócios de beleza."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html className={GeistSans.className} lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
