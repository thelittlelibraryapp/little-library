// ===== src/app/layout.tsx =====
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "@/components/Navigation";
import { AuthWrapper } from "@/components/AuthWrapper";
import { MoodProvider } from "@/contexts/MoodContext";
import { MoodWrapper } from "@/components/MoodWrapper";
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
              <div className="min-h-screen transition-all duration-1000 ease-in-out">
                {/* Decorative background elements - will be dynamically colored */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                  <div className="mood-bg-decorations absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30"></div>
                  <div className="mood-bg-decorations absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"></div>
                  <div className="mood-bg-decorations absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"></div>
                </div>
                
                <Navigation />
                <main className="pt-20 pb-8 relative z-10">
                  {children}
                </main>
              </div>
            </AuthWrapper>
          </MoodWrapper>
        </MoodProvider>
      </body>
    </html>
  );
}