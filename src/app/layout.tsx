// ===== src/app/layout.tsx =====
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "@/components/Navigation";
import { AuthWrapper } from "@/components/AuthWrapper";
import { MoodProvider } from "@/contexts/MoodContext";
import { MoodWrapper } from "@/components/MoodWrapper";
import { LayoutContent } from "@/components/LayoutContent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Little Library",
  description: "A cozy digital space for book lovers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <MoodProvider>
          <MoodWrapper>
            <AuthWrapper>
              <LayoutContent>
                {children}
              </LayoutContent>
            </AuthWrapper>
          </MoodWrapper>
        </MoodProvider>
      </body>
    </html>
  );
}