'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, Users, BookOpen, X, Trophy, Gift, Send, Bell, CheckCircle, XCircle, Mail } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { useMood } from '@/contexts/MoodContext';
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
  const { currentMood, getMoodClasses } = useMood();
  const [viewingLibrary, setViewingLibrary] = useState<Friend | null>(null);
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const moodClasses = getMoodClasses();

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No auth token found');
        return;
      }
  
      const response = await fetch(`/api/friends/${friendId}?userId=${user?.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
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
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${moodClasses.accentColor}-600 mx-auto`}></div>
        <p className={`${moodClasses.textStyle} opacity-70 mt-2`}>Loading friends...</p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className={`w-16 h-16 text-${moodClasses.accentColor}-300 mx-auto mb-4 opacity-60`} />
        <h3 className={`text-lg font-medium ${moodClasses.textStyle} mb-2`}>No friends yet</h3>
        <p className={`${moodClasses.textStyle} opacity-70 mb-4`}>Friends will appear here after they accept your invitations!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {friends.map((friend) => (
        <div key={friend.id} className={`p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 ${moodClasses.cardStyle}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 bg-${moodClasses.accentColor}-100 rounded-full flex items-center justify-center`}>
                <span className={`text-${moodClasses.accentColor}-600 font-medium`}>
                  {friend.firstName[0]}{friend.lastName[0]}
                </span>
              </div>
              <div>
                <h3 className={`font-medium ${moodClasses.textStyle}`}>
                  {friend.firstName} {friend.lastName}
                </h3>
                <p className={`text-sm ${moodClasses.textStyle} opacity-60`}>@{friend.username}</p>
                <p className={`text-xs ${moodClasses.textStyle} opacity-40`}>
                  Friends since {new Date(friend.friendshipDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewingLibrary(friend)}
                className={`px-4 py-2 ${moodClasses.buttonStyle} text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-1`}
              >
                <BookOpen className="w-4 h-4" />
                <span>View Library</span>
              </button>
              <button
                onClick={() => removeFriend(friend.id)}
                className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
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
  const { currentMood, getMoodClasses } = useMood();
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const moodClasses = getMoodClasses();

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('No auth token found');
        return;
      }
  
      const response = await fetch(`/api/friends/invite/${invitationId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: action === 'accepted' ? 'accept' : 'decline' }),
      });
      const data = await response.json();

      if (response.ok) {
        setInvitations(invitations.map(inv => 
          inv.id === invitationId 
            ? { ...inv, status: action }
            : inv
        ));

        console.log('Success:', data.message);
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
        <div className={`animate-spin rounded-full h-8 w-8 border-b-2 border-${moodClasses.accentColor}-600 mx-auto`}></div>
        <p className={`${moodClasses.textStyle} opacity-70 mt-2`}>Loading invitations...</p>
      </div>
    );
  }

  const pendingReceived = invitations.filter(inv => inv.type === 'received' && inv.status === 'pending');
  const sentInvitations = invitations.filter(inv => inv.type === 'sent');

  return (
    <div className="space-y-6">
      {/* Pending Invitations Received */}
      {pendingReceived.length > 0 && (
        <div>
          <h3 className={`text-lg font-medium ${moodClasses.textStyle} mb-4 flex items-center`}>
            <Bell className={`w-5 h-5 text-${moodClasses.accentColor}-600 mr-2`} />
            Pending Invitations ({pendingReceived.length})
          </h3>
          <div className="space-y-3">
            {pendingReceived.map((invitation) => (
              <div key={invitation.id} className={`p-4 rounded-2xl shadow-lg border-l-4 border-l-${moodClasses.accentColor}-500 ${moodClasses.cardStyle}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <UserPlus className={`w-4 h-4 text-${moodClasses.accentColor}-600`} />
                      <span className={`font-medium ${moodClasses.textStyle}`}>
                        {invitation.inviterName}
                      </span>
                      <span className={`${moodClasses.textStyle} opacity-70`}>wants to be friends</span>
                    </div>
                    {invitation.message && (
                      <p className={`text-sm ${moodClasses.textStyle} opacity-70 mb-2 italic`}>"{invitation.message}"</p>
                    )}
                    <p className={`text-xs ${moodClasses.textStyle} opacity-40`}>
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => respondToInvitation(invitation.id, 'accepted')}
                      disabled={processingId === invitation.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-1"
                    >
                      {processingId === invitation.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Accept</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => respondToInvitation(invitation.id, 'declined')}
                      disabled={processingId === invitation.id}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex items-center space-x-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent Invitations */}
      {sentInvitations.length > 0 && (
        <div>
          <h3 className={`text-lg font-medium ${moodClasses.textStyle} mb-4 flex items-center`}>
            <Send className={`w-5 h-5 text-${moodClasses.accentColor}-600 mr-2`} />
            Sent Invitations ({sentInvitations.length})
          </h3>
          <div className="space-y-3">
            {sentInvitations.map((invitation) => (
              <div key={invitation.id} className={`p-4 rounded-2xl shadow-lg ${moodClasses.cardStyle}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Mail className={`w-4 h-4 text-${moodClasses.accentColor}-600`} />
                      <span className={`font-medium ${moodClasses.textStyle}`}>
                        {invitation.inviteeName || invitation.inviteeEmail}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          invitation.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' :
                          invitation.status === 'declined' ? 'bg-red-100 text-red-700' : 
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {invitation.status}
                        </span>
                      </div>
                    </div>
                    {invitation.message && (
                      <p className={`text-sm ${moodClasses.textStyle} opacity-70 mb-2 italic`}>"{invitation.message}"</p>
                    )}
                    <p className={`text-xs ${moodClasses.textStyle} opacity-40`}>
                      Sent {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {invitations.length === 0 && (
        <div className="text-center py-8">
          <Mail className={`w-16 h-16 text-${moodClasses.accentColor}-300 mx-auto mb-4 opacity-60`} />
          <h3 className={`text-lg font-medium ${moodClasses.textStyle} mb-2`}>No invitations</h3>
          <p className={`${moodClasses.textStyle} opacity-70`}>Sent and received invitations will appear here.</p>
        </div>
      )}
    </div>
  );
}

export default function FriendsPage() {
  const { currentMood, getMoodClasses } = useMood();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { user } = useAuth();

  const moodClasses = getMoodClasses();

  useEffect(() => {
    console.log('FriendsTab - Current user:', user);

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
    <div className={`min-h-screen ${moodClasses.background} transition-all duration-1000 ease-in-out`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <AchievementBanner achievements={achievements} />

          <div className="flex justify-between items-center">
            <div>
              <h1 className={`text-2xl font-bold ${moodClasses.textStyle}`}>Friends</h1>
              <p className={`${moodClasses.textStyle} opacity-70`}>Connect with fellow book lovers</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className={`${moodClasses.buttonStyle} text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Friends</span>
            </button>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Friends List */}
            <div>
              <h2 className={`text-lg font-semibold ${moodClasses.textStyle} mb-4`}>My Friends</h2>
              <FriendsList />
            </div>

            {/* Invitations */}
            <div>
              <h2 className={`text-lg font-semibold ${moodClasses.textStyle} mb-4`}>Invitations</h2>
              <InvitationsList />
            </div>
          </div>

          <InviteFriendsModal 
            isOpen={showInviteModal} 
            onClose={() => setShowInviteModal(false)} 
          />
        </div>
      </div>
    </div>
  );
}