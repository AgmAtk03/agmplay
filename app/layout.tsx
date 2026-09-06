import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { Header } from "@/components/Header";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "AgmPlay",
  description:
    "AgmBizz playback stack — library connector, adaptive player, and ad slots.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08080c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} site-bg`}>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
