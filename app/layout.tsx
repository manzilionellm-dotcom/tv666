import type { Metadata, Viewport } from "next";
import { Inter, Oswald, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SpatialNav from "@/components/tv/SpatialNav";
import BackHandler from "@/components/BackHandler";

// 3 rôles typographiques : Inter (UI), Oswald (titres d'accent), JetBrains Mono
// (code d'activation uniquement).
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600"],
});
const jetMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["600"],
});

export const metadata: Metadata = {
  title: "The Few — Not For Everyone",
  description: "The Few — Not For Everyone. Lecteur IPTV pour téléviseurs.",
  applicationName: "The Few",
};

export const viewport: Viewport = {
  themeColor: "#070707",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${oswald.variable} ${jetMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg text-text">
        <SpatialNav>{children}</SpatialNav>
        <BackHandler />
      </body>
    </html>
  );
}
