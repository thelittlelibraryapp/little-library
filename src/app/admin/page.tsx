'use client';

import React, { useState, useEffect } from 'react';
import { Users, Activity, AlertTriangle, Key } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resettingPassword, setResettingPassword] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-center mt-2">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Welcome, {user?.firstName}! Manage users and reset passwords.</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-600">Total Users</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.email_confirmed_at).length}
              </p>
              <p className="text-sm text-gray-600">Verified Users</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => !u.email_confirmed_at).length}
              </p>
              <p className="text-sm text-gray-600">Unverified</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <Key className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.must_change_password).length}
              </p>
              <p className="text-sm text-gray-600">Temp Passwords</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4 mb-6">
        <input
          type="text"
          placeholder="Search users by email, username, or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </Card>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">User Management ({users.length} users)</h2>
        
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <div className="font-medium">
                  {user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email
                  }
                </div>
                <div className="text-sm text-gray-500">
                  @{user.username} • {user.email}
                </div>
                <div className="text-xs text-gray-400">
                  Joined: {new Date(user.created_at).toLocaleString()}
                  {user.last_sign_in_at && (
                    <span> • Last login: {new Date(user.last_sign_in_at).toLocaleString()}</span>
                  )}
                  {user.email_confirmed_at && (
                    <span> • Email verified: {new Date(user.email_confirmed_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {user.email_confirmed_at ? (
                  <Badge variant="success">Verified</Badge>
                ) : (
                  <Badge variant="warning">Unverified</Badge>
                )}
                {user.must_change_password && (
                  <Badge variant="danger">Temp Password</Badge>
                )}
                
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => resetUserPassword(user.id, user.email)}
                  disabled={resettingPassword === user.id}
                >
                  {resettingPassword === user.id ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}