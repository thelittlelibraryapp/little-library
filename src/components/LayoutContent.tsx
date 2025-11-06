"use client";

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/lib/useAuth";

export function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isPublicPage = pathname?.startsWith('/public');
  const isAuthPage = pathname?.startsWith('/auth');

  // No layout padding for non-logged-in users on home page or auth pages
  const needsLayoutPadding = user && !isPublicPage;

  return (
    <div className="min-h-screen transition-all duration-1000 ease-in-out">
      {/* Decorative background elements - will be dynamically colored */}
      {!isPublicPage && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="mood-bg-decorations absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-30"></div>
          <div className="mood-bg-decorations absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"></div>
          <div className="mood-bg-decorations absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-10"></div>
        </div>
      )}
      
      <Navigation />
      <main className={`${needsLayoutPadding ? 'pt-14 pb-20 lg:pt-0 lg:pb-8 lg:ml-64' : 'pt-0'} relative z-10`}>
        {children}
      </main>
    </div>
  );
}