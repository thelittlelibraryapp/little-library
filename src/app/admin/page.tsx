'use client';

import React, { useState, useEffect } from 'react';
import { Users, Activity, AlertTriangle, Key, Search } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { useMood } from '@/contexts/MoodContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
  const { user } = useAuth();
  const { currentMood, getMoodClasses } = useMood();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const moodClasses = getMoodClasses();
  
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        console.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetUserPassword = async (userId: string, userEmail: string) => {
    if (!confirm(`Reset password for ${userEmail}?`)) return;

    setResettingPassword(userId);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId, userEmail })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ Password reset!\n\nTemp Password: ${data.tempPassword}\n\n⚠️ Save this - user must change on next login!`);
        loadUsers();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      alert('❌ Failed to reset password');
    } finally {
      setResettingPassword(null);
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${moodClasses.background} transition-all duration-1000 ease-in-out`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${moodClasses.accentColor}-600 mx-auto`}></div>
              <p className={`${moodClasses.textStyle} opacity-70 mt-2`}>Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${moodClasses.background} transition-all duration-1000 ease-in-out`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${moodClasses.textStyle} mb-2`}>Admin Dashboard</h1>
            <p className={`${moodClasses.textStyle} opacity-70`}>Welcome, {user?.firstName}! Manage users and reset passwords.</p>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className={`p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${moodClasses.cardStyle}`}>
              <div className="flex items-center">
                <div className={`w-12 h-12 ${moodClasses.buttonStyle} rounded-xl flex items-center justify-center mr-4`}>
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${moodClasses.textStyle}`}>{users.length}</p>
                  <p className={`text-sm ${moodClasses.textStyle} opacity-60`}>Total Users</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${moodClasses.cardStyle}`}>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mr-4">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${moodClasses.textStyle}`}>
                    {users.filter(u => u.email_confirmed_at).length}
                  </p>
                  <p className={`text-sm ${moodClasses.textStyle} opacity-60`}>Verified Users</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${moodClasses.cardStyle}`}>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center mr-4">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${moodClasses.textStyle}`}>
                    {users.filter(u => !u.email_confirmed_at).length}
                  </p>
                  <p className={`text-sm ${moodClasses.textStyle} opacity-60`}>Unverified</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${moodClasses.cardStyle}`}>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center mr-4">
                  <Key className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${moodClasses.textStyle}`}>
                    {users.filter(u => u.must_change_password).length}
                  </p>
                  <p className={`text-sm ${moodClasses.textStyle} opacity-60`}>Temp Passwords</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className={`p-6 rounded-2xl shadow-xl ${moodClasses.cardStyle}`}>
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-${moodClasses.accentColor}-400`} />
              <input
                type="text"
                placeholder="Search users by email, username, or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border-2 border-${moodClasses.accentColor}-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-${moodClasses.accentColor}-500 ${moodClasses.textStyle} placeholder-gray-400 bg-white/80 backdrop-blur-sm transition-all duration-200`}
              />
            </div>
          </div>
          
          <div className={`p-6 rounded-2xl shadow-xl ${moodClasses.cardStyle}`}>
            <h2 className={`text-xl font-semibold ${moodClasses.textStyle} mb-6`}>User Management ({users.length} users)</h2>
            
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className={`flex items-center justify-between p-4 rounded-xl border-2 border-${moodClasses.accentColor}-100 hover:border-${moodClasses.accentColor}-200 transition-all duration-200 hover:shadow-md bg-white/60 backdrop-blur-sm`}>
                  <div>
                    <div className={`font-medium ${moodClasses.textStyle}`}>
                      {user.firstName && user.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user.email
                      }
                    </div>
                    <div className={`text-sm ${moodClasses.textStyle} opacity-60`}>
                      @{user.username} • {user.email}
                    </div>
                    <div className={`text-xs ${moodClasses.textStyle} opacity-40`}>
                      Joined: {new Date(user.created_at).toLocaleString()}
                      {user.last_sign_in_at && (
                        <span> • Last login: {new Date(user.last_sign_in_at).toLocaleString()}</span>
                      )}
                      {user.email_confirmed_at && (
                        <span> • Email verified: {new Date(user.email_confirmed_at).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {user.email_confirmed_at ? (
                      <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                        Unverified
                      </span>
                    )}
                    {user.must_change_password && (
                      <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                        Temp Password
                      </span>
                    )}
                    
                    <button
                      onClick={() => resetUserPassword(user.id, user.email)}
                      disabled={resettingPassword === user.id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100 text-sm"
                    >
                      {resettingPassword === user.id ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}