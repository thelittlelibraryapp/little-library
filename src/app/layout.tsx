// ===== src/app/layout.tsx =====
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navigation from "@/components/Navigation";
import { AuthWrapper } from "@/components/AuthWrapper";
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 min-h-screen`}
      >
        <AuthWrapper>
          {/* Decorative background elements */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-orange-300/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-stone-200/20 to-amber-200/20 rounded-full blur-3xl"></div>
          </div>
          
          <Navigation />
          <main className="pt-20 pb-8 relative z-10">
            {children}
          </main>
        </AuthWrapper>
      </body>
    </html>
  );
}