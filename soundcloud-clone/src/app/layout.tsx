import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import AudioPlayer from "@/components/AudioPlayer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SoundCloud Clone - Listen to music",
  description:
    "Discover, stream, and share a constantly expanding mix of music from emerging and major artists around the world.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-sc-dark text-white`}>
        <Providers>
          <Navbar />
          <main className="pt-[46px] pb-[56px] min-h-screen">{children}</main>
          <AudioPlayer />
        </Providers>
      </body>
    </html>
  );
}
