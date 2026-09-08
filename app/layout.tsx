import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist_Mono, Noto_Sans_TC, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { brand } from "@/lib/brand";

import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const notoTc = Noto_Sans_TC({
  variable: "--font-noto-tc",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: brand.name,
    template: `%s · ${brand.name}`,
  },
  description: brand.description,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${notoTc.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
