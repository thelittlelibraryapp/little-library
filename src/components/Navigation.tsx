'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useMood } from '@/contexts/MoodContext';
import { supabase } from '@/lib/supabase';
import { BookOpen, Calendar, Home, LogOut, User, Users, Sparkles, Settings, Palette, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoodSelector } from '@/components/MoodSelector';
import Link from 'next/link';

export default function Navigation() {
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const { user, logout } = useAuth();
  const { currentMood, setMood, getMoodClasses } = useMood();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.email === 'm.dembling@gmail.com';
  const moodClasses = getMoodClasses();

  // Load notification count
  useEffect(() => {
    if (user?.id) {
      loadNotificationCount();
      // Refresh every 30 seconds
      const interval = setInterval(loadNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const loadNotificationCount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Get pending borrow requests count
      const requestsResponse = await fetch(`/api/borrow/requests?userId=${user?.id}`);
      let requestsCount = 0;
      if (requestsResponse.ok) {
        const result = await requestsResponse.json();
        requestsCount = result.requests?.filter((req: any) =>
          req.ownerId === user?.id && req.status === 'pending'
        ).length || 0;
      }

      // Get claims count
      const claimsResponse = await fetch('/api/books/claimed-notifications', {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      let claimsCount = 0;
      if (claimsResponse.ok) {
        const result = await claimsResponse.json();
        claimsCount = result.notifications?.length || 0;
      }

      setNotificationCount(requestsCount + claimsCount);
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  };

  // Check if we're on a public page
  const isPublicPage = pathname.startsWith('/public');

  // Don't show navigation on public pages
  if (isPublicPage) {
    return null;
  }

  // If no user and not on public page, don't render (user will see auth form)
  if (!user) {
    return null;
  }

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, href: '/' },
    { id: 'library', label: 'My Books', icon: BookOpen, href: '/library' },
    { id: 'reading', label: 'My Reading', icon: BookMarked, href: '/reading' },
    { id: 'friends', label: 'Friends', icon: Users, href: '/friends' },
    { id: 'lending', label: 'Lending', icon: Calendar, href: '/lending' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Settings, href: '/admin' }] : []),
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 shadow-sm flex-col z-40">
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-200">
          <Link href="/" className="flex items-center group">
            <div className="relative">
              <div className={`w-12 h-12 ${moodClasses.buttonStyle} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <Sparkles className="w-3 h-3 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-bold text-slate-800">Little Library</h1>
              <p className="text-xs text-slate-500">Your reading space</p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? `${moodClasses.buttonStyle} text-white shadow-lg`
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center">
                  <Icon className={`w-5 h-5 mr-3 ${isActive ? 'scale-110' : 'group-hover:scale-105'} transition-transform`} />
                  {item.label}
                </div>
                {item.id === 'lending' && notificationCount > 0 && (
                  <span className={`${isActive ? 'bg-white text-purple-600' : 'bg-red-500 text-white'} text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem] text-center animate-pulse`}>
                    {notificationCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          {/* Mood Selector Button */}
          <button
            onClick={() => setShowMoodSelector(!showMoodSelector)}
            className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200"
          >
            <Palette className="w-5 h-5 mr-3" />
            Change Theme
          </button>

          {showMoodSelector && (
            <div className="px-2 py-2">
              <MoodSelector
                currentMood={currentMood}
                onMoodChange={(mood) => {
                  setMood(mood);
                  setShowMoodSelector(false);
                }}
              />
            </div>
          )}

          {/* User Info */}
          <div className="px-4 py-3 bg-slate-50 rounded-xl">
            <p className="text-sm font-medium text-slate-800">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500">@{user?.username}</p>
          </div>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl">
        <div className="grid grid-cols-5 h-16">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-all duration-200 relative ${
                  isActive
                    ? `text-${moodClasses.accentColor}-600`
                    : 'text-slate-400'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
                <span className="text-xs font-medium">{item.label}</span>
                {item.id === 'lending' && notificationCount > 0 && (
                  <span className="absolute top-1 right-3 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* User Menu */}
          <button
            onClick={() => setShowMoodSelector(!showMoodSelector)}
            className="flex flex-col items-center justify-center space-y-1 text-slate-400 hover:text-slate-600"
          >
            <User className="w-6 h-6" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>

        {/* Mobile User Menu Popup */}
        {showMoodSelector && (
          <div className="absolute bottom-16 left-0 right-0 bg-white border-t border-slate-200 shadow-2xl p-4 space-y-3">
            <div className="px-4 py-3 bg-slate-50 rounded-xl">
              <p className="text-sm font-medium text-slate-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500">@{user?.username}</p>
            </div>

            <div className="border-t border-slate-200 pt-3">
              <p className="text-xs font-semibold text-slate-500 px-2 mb-2">CHANGE THEME</p>
              <MoodSelector
                currentMood={currentMood}
                onMoodChange={(mood) => {
                  setMood(mood);
                  setShowMoodSelector(false);
                }}
              />
            </div>

            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-all duration-200"
              >
                <Settings className="w-5 h-5 mr-3" />
                Admin Panel
              </Link>
            )}

            <button
              onClick={logout}
              className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Top Bar (minimal) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className={`w-8 h-8 ${moodClasses.buttonStyle} rounded-lg flex items-center justify-center shadow-md`}>
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="ml-2 text-lg font-bold text-slate-800">Little Library</h1>
          </Link>
        </div>
      </div>
    </>
  );
}
