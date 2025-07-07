'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Users, BookOpen, X, Trophy, Gift, Send, Bell, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InviteFriendsModal } from '@/components/InviteFriendsModal';
import { FriendLibraryModal } from '@/components/FriendLibraryModal';
import { AchievementBanner } from '@/components/AchievementBanner';

interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  bookCount: number;
  availableBooks: number;
  friendshipDate: string;
}

interface Invitation {
  id: string;
  inviterName?: string;
  inviterEmail?: string;
  inviteeName?: string;
  inviteeEmail?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  type: 'sent' | 'received';
}

interface Achievement {
  id: string;
  type: string;
  name: string;
  icon: string;
  description: string;
  points: number;
  unlockedAt: string;
}

// FriendsList Component
function FriendsList() {
  const [viewingLibrary, setViewingLibrary] = useState<Friend | null>(null);
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadFriends();
    }
  }, [user?.id]);

  const loadFriends = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/friends?userId=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        // Transform the API response to match our Friend interface
        const transformedFriends = data.friends.map((item: any) => ({
          id: item.user.id,
          firstName: item.user.first_name,
          lastName: item.user.last_name,
          email: item.user.email,
          username: item.user.username,
          bookCount: 0, // We'll need to add this to the API later
          availableBooks: 0, // We'll need to add this to the API later
          friendshipDate: item.granted_at
        }));
        
        setFriends(transformedFriends);
      }
    } catch (error) {
      console.error('Failed to load friends:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
  
    try {
      // Get the auth token (same pattern as your other API calls)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No auth token found');
        return;
      }
  
      const response = await fetch(`/api/friends/${friendId}?userId=${user?.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}` // ADD THIS LINE
        }
      });
  
      if (response.ok) {
        setFriends(friends.filter(f => f.id !== friendId));
      } else {
        console.error('Failed to remove friend:', response.status);
      }
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading friends...</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
        <p className="text-gray-600 mb-4">Friends will appear here after they accept your invitations!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {friends.map((friend) => (
        <Card key={friend.id} className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium">
                  {friend.firstName[0]}{friend.lastName[0]}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">
                  {friend.firstName} {friend.lastName}
                </h3>
                <p className="text-sm text-gray-500">@{friend.username}</p>
                <p className="text-xs text-gray-400">
                  Friends since {new Date(friend.friendshipDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => setViewingLibrary(friend)}
              >
                <BookOpen className="w-4 h-4 mr-1" />
                View Library
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => removeFriend(friend.id)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}

      <FriendLibraryModal 
        friend={viewingLibrary}
        isOpen={!!viewingLibrary}
        onClose={() => setViewingLibrary(null)}
      />
    </div>
  );
}

// InvitationsList Component
function InvitationsList() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadInvitations();
    }
  }, [user?.id]);

  const loadInvitations = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/friends/invite?userId=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        // Transform the API response to match our Invitation interface
        const allInvitations: Invitation[] = [
          ...data.sent.map((inv: any) => ({
            id: inv.id,
            inviteeName: inv.invitee ? `${inv.invitee.first_name} ${inv.invitee.last_name}` : null,
            inviteeEmail: inv.invitee_email,
            message: inv.message,
            status: inv.status,
            createdAt: inv.created_at,
            type: 'sent' as const
          })),
          ...data.received.map((inv: any) => ({
            id: inv.id,
            inviterName: `${inv.inviter.first_name} ${inv.inviter.last_name}`,
            inviterEmail: inv.inviter.email,
            message: inv.message,
            status: inv.status,
            createdAt: inv.created_at,
            type: 'received' as const
          }))
        ];
        
        setInvitations(allInvitations);
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const respondToInvitation = async (invitationId: string, action: 'accepted' | 'declined') => {
    setProcessingId(invitationId);
    
    try {
      // Get the auth token (same pattern as your other API calls)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No auth token found');
        return;
      }
  
      const response = await fetch(`/api/friends/invite/${invitationId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}` // ADD THIS LINE
        },
        body: JSON.stringify({ action: action === 'accepted' ? 'accept' : 'decline' }), // Remove userId, use action mapping
      });
      const data = await response.json();

      if (response.ok) {
        // Update the invitation status locally
        setInvitations(invitations.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: action }
            : inv
        ));

        // Show success message
        console.log('Success:', data.message);
        
        // Reload invitations to get fresh data
        setTimeout(() => loadInvitations(), 1000);
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Failed to respond to invitation:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading invitations...</p>
      </div>
    );
  }

  const pendingReceived = invitations.filter(inv => inv.type === 'received' && inv.status === 'pending');
  const sentInvitations = invitations.filter(inv => inv.type === 'sent' && inv.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Invitations Received */}
      {pendingReceived.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 text-blue-600 mr-2" />
            Pending Invitations ({pendingReceived.length})
          </h3>
          <div className="space-y-3">
            {pendingReceived.map((invitation) => (
              <Card key={invitation.id} className="p-4 border-l-4 border-l-blue-500 bg-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {invitation.inviterName}
                      </span>
                      <span className="text-gray-500">wants to be friends</span>
                    </div>
                    {invitation.message && (
                      <p className="text-sm text-gray-600 mb-2 italic">"{invitation.message}"</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => respondToInvitation(invitation.id, 'accepted')}
                      disabled={processingId === invitation.id}
                    >
                      {processingId === invitation.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => respondToInvitation(invitation.id, 'declined')}
                      disabled={processingId === invitation.id}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sent Invitations */}
      {sentInvitations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Sent Invitations ({sentInvitations.length})
          </h3>
          <div className="space-y-3">
            {sentInvitations.map((invitation) => (
              <Card key={invitation.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">
                        {invitation.inviteeName || invitation.inviteeEmail}
                      </span>
                      <Badge variant={
                        invitation.status === 'accepted' ? 'success' :
                        invitation.status === 'declined' ? 'danger' : 'warning'
                      }>
                        {invitation.status}
                      </Badge>
                    </div>
                    {invitation.message && (
                      <p className="text-sm text-gray-600 mb-1 italic">"{invitation.message}"</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Sent {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {invitations.length === 0 && (
        <div className="text-center py-8">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations</h3>
          <p className="text-gray-600">Sent and received invitations will appear here.</p>
        </div>
      )}
    </div>
  );
}

export default function FriendsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { user } = useAuth();

  // Debug logging
  useEffect(() => {
    console.log('FriendsTab - Current user:', user);

    // Test Supabase session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Supabase session:', session);
    };
    checkSession();
  }, [user]);

  useEffect(() => {
    loadRecentAchievements();
  }, []);

  const loadRecentAchievements = async () => {
    try {
      const sampleAchievements: Achievement[] = [
        {
          id: '1',
          type: 'first_friend',
          name: 'Connector',
          icon: '🤝',
          description: 'Made your first friend connection',
          points: 10,
          unlockedAt: new Date().toISOString()
        }
      ];
      setAchievements(sampleAchievements);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <AchievementBanner achievements={achievements} />

        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
          <Button onClick={() => setShowInviteModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Friends
          </Button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Friends List */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">My Friends</h2>
            <FriendsList />
          </div>

          {/* Invitations */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invitations</h2>
            <InvitationsList />
          </div>
        </div>

        <InviteFriendsModal 
          isOpen={showInviteModal} 
          onClose={() => setShowInviteModal(false)} 
        />
      </div>
    </div>
  );
}