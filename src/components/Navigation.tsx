// ===== Enhanced Navigation Component =====
// Update your src/components/Navigation.tsx with this:

'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { BookOpen, Calendar, Home, LogOut, Menu, User, Users, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.email === 'm.dembling@gmail.com';

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home, href: '/' },
    { id: 'library', label: 'My Books', icon: BookOpen, href: '/library' },
    { id: 'friends', label: 'Friends', icon: Users, href: '/friends' },
    { id: 'lending', label: 'Lending', icon: Calendar, href: '/lending' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: User, href: '/admin' }] : []),
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-amber-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center group">
                <div className="relative">
                  <BookOpen className="w-8 h-8 text-amber-600 group-hover:text-amber-700 transition-colors duration-200" />
                  <Sparkles className="w-3 h-3 text-orange-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-amber-800 to-orange-700 bg-clip-text text-transparent">
                    My Little Library
                  </h1>
                  <p className="text-xs text-slate-500 -mt-0.5">Your cozy reading space</p>
                </div>
              </Link>
            </div>
            
            <div className="flex items-center space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`group px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 shadow-md'
                        : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-2 inline transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`} />
                    {item.label}
                  </Link>
                );
              })}
              
              <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-amber-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">@{user?.username}</p>
                </div>
                <Button onClick={logout} variant="ghost" size="sm">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-amber-200/50 shadow-lg">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <BookOpen className="w-7 h-7 text-amber-600 mr-2" />
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-amber-800 to-orange-700 bg-clip-text text-transparent">
                  My Little Library
                </h1>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 hover:text-amber-700 p-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {mobileMenuOpen && (
            <div className="py-4 border-t border-amber-200/50 bg-white/95 backdrop-blur-sm">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 mb-1 ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 shadow-sm border-l-4 border-amber-500'
                        : 'text-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="border-t border-amber-200/50 pt-3 mt-3">
                <div className="px-4 py-2 text-sm text-slate-600">
                  {user?.firstName} {user?.lastName}
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5 inline mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}