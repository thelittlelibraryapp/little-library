'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { BookOpen, Calendar, Home, LogOut, Menu, User, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = user?.email === 'm.dembling@gmail.com';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, href: '/' },
    { id: 'library', label: 'My Library', icon: BookOpen, href: '/library' },
    { id: 'friends', label: 'Friends', icon: Users, href: '/friends' },
    { id: 'borrowed', label: 'Lending', icon: Calendar, href: '/lending' },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: User, href: '/admin' }] : []),
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
                <h1 className="text-xl font-bold text-gray-900">My Little Library</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 inline" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l">
                <span className="text-sm text-gray-600">
                  {user?.firstName} {user?.lastName}
                </span>
                <Button onClick={logout} variant="ghost" size="sm">
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">My Little Library</h1>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="py-4 border-t">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 inline mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50"
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