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
  description: "A personal library management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthWrapper>
          <Navigation />
          <main className="pt-16">{children}</main>
        </AuthWrapper>
      </body>
    </html>
  );
}