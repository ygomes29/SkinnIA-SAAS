import type { ReactNode } from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Plus_Jakarta_Sans } from "next/font/google";

import "@/app/globals.css";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";

// Tipografia de display para headings (h1, h2, h3)
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

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
    <html className={`${GeistSans.className} ${plusJakarta.variable} dark`} lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
