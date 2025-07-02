//Little Library Project Next Steps V7
'use client';

import React, { useState, useEffect, useContext, createContext } from 'react';
import { 
  Search, 
  Plus, 
  BookOpen, 
  Users, 
  Calendar, 
  Home, 
  LogOut, 
  Menu, 
  X, 
  CheckCircle, 
  Clock,
  Edit,
  Trash2,
  UserPlus,
  XCircle,
  Mail,
  Trophy,
  Gift,
  Send,
  Bell,
  Bug
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

// Types
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  publicationYear?: number;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  status: 'available' | 'checked_out' | 'overdue' | 'borrowed' | 'return_pending';
  addedAt: string;
  borrower?: string;
  dueDate?: string;
  borrowedBy?: string;     // ADD THIS
  borrowerName?: string;   // ADD THIs
  
}

// Auth Context
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, username: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

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

interface BorrowRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  borrowerId: string;
  borrowerName: string;
  ownerId: string;
  ownerName: string;
  status: 'pending' | 'approved' | 'declined' | 'returned';
  requestedAt: string;
  dueDate?: string;
  message?: string;
}

interface FriendLibrary {
  friendId: string;
  friendName: string;
  books: Book[];
}


const AuthContext = createContext<AuthContextType | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Fetch additional user details
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData && !error) {
          setUser({
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            username: userData.username
          });
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (userData && !userError) {
          setUser({
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            username: userData.username
          });
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, username: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              email: data.user.email,
              first_name: firstName,
              last_name: lastName,
              username: username,
              password_hash: 'managed_by_supabase_auth' // Add this line
            }
          ]);

        if (insertError) throw insertError;

        // Create default library
        const { error: libraryError } = await supabase
          .from('libraries')
          .insert([
            {
              owner_id: data.user.id,
              name: `${firstName}'s Library`,
              description: 'My personal book collection'
            }
          ]);

        if (libraryError) throw libraryError;

        setUser({
          id: data.user.id,
          email: data.user.email!,
          firstName,
          lastName,
          username
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// UI Components
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button'
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow border ${className}`}>
    {children}
  </div>
);

const Badge = ({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

// Auth Components
function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { login, register, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!firstName.trim() || !lastName.trim() || !username.trim()) {
          setError('Please fill in all required fields');
          return;
        }
        
        await register(email, password, firstName.trim(), lastName.trim(), username.trim());
        setMessage('Registration successful! Please check your email to verify your account.');
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">My Little Library</h2>
          <p className="text-gray-600">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required={!isLogin}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 hover:text-blue-500 text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </Card>
    </div>
  );
}

// Navigation Component
function Navigation({ 
  activeTab, 
  setActiveTab, 
  mobileMenuOpen, 
  setMobileMenuOpen 
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'library', label: 'My Library', icon: BookOpen },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'borrowed', label: 'Lending', icon: Calendar }
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">My Little Library</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2 inline" />
                    {item.label}
                  </button>
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
      <nav className="md:hidden bg-white shadow-sm border-b">
        <div className="px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">My Little Library</h1>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-500 hover:text-gray-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {mobileMenuOpen && (
            <div className="py-4 border-t">
              {navItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                      activeTab === item.id
                        ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 inline mr-3" />
                    {item.label}
                  </button>
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

function AchievementBanner({ achievements }: { achievements: Achievement[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (achievements.length === 0) {
      setIsVisible(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % achievements.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [achievements.length]);

  if (!isVisible || achievements.length === 0) return null;

  const currentAchievement = achievements[currentIndex];

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mb-6 relative overflow-hidden">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">{currentAchievement.icon}</div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4" />
            <span className="font-medium">Achievement Unlocked!</span>
          </div>
          <h3 className="font-bold">{currentAchievement.name}</h3>
          <p className="text-sm opacity-90">{currentAchievement.description}</p>
          <div className="flex items-center space-x-2 mt-1">
            <Gift className="w-3 h-3" />
            <span className="text-xs">+{currentAchievement.points} points</span>
          </div>
        </div>
        <button 
          onClick={() => setIsVisible(false)}
          className="text-white/80 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function InviteFriendsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth(); // ADD THIS LINE - MISSING!
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    // DEBUG
    console.log('Sending request with:', { 
      email, 
      message, 
      userId: user?.id,
      user: user 
    });

    try {
      const response = await fetch('/api/friends/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message, userId: user?.id }), // FIX: user?.id not Users?.id
      });

      // DEBUG
      console.log('Response status:', response.status);
      const data = await response.json(); // KEEP ONLY ONE OF THESE
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      setSuccessMessage(data.message);
      setEmail('');
      setMessage('');
      
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
      }, 2000);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Invite a Friend</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Friend's Email Address
            </label>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'd love to share books with you..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FriendsTab() {
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
  );
}

// FriendsList Component - Add this with your other components
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



// Dashboard Component
function Dashboard() {
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  
  const [stats, setStats] = useState({
    totalBooks: 0,
    available: 0,
    borrowed: 0,
    lending: 0
  });

  // Load dashboard stats
  const loadDashboardStats = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Fetch books data
      const response = await fetch('/api/books', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const books: Book[] = result.books || [];
        
        // Calculate real stats
        const totalBooks = books.length;
        const available = books.filter((book: Book) => book.status === 'available').length;
        const borrowed = books.filter((book: Book) => book.status === 'borrowed' || book.status === 'checked_out').length;
        const lending = books.filter((book: Book) => book.borrowedBy).length;
        
        setStats({ totalBooks, available, borrowed, lending });
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    }
  };

  // Load recent activity
  const loadRecentActivity = async () => {
    try {
      setIsLoadingActivity(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Fetch borrow requests to show activity
      const response = await fetch(`/api/borrow/requests?userId=${user?.id}`);
      
      if (response.ok) {
        const result = await response.json();
        const requests = result.requests || [];
        
        // Transform requests into activity items
        const activities = requests
          .slice(0, 5) // Show only 5 most recent
          .map((request: any) => {
            if (request.borrowerId === user?.id) {
              // Outgoing request
              return {
                id: request.id,
                type: 'request_sent',
                message: `You requested "${request.bookTitle}" from ${request.ownerName}`,
                time: getTimeAgo(request.requestedAt),
                status: request.status
              };
            } else {
              // Incoming request
              return {
                id: request.id,
                type: 'request_received',
                message: `${request.borrowerName} requested "${request.bookTitle}"`,
                time: getTimeAgo(request.requestedAt),
                status: request.status
              };
            }
          });
        
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // Helper function for time formatting
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  // Load data on mount
  useEffect(() => {
    loadDashboardStats();
    loadRecentActivity();
  }, [user?.id]);

  const handleBookAdded = (newBook: Book) => {
    console.log('Book added to dashboard:', newBook);
    // Refresh stats when a new book is added
    loadDashboardStats();
  };

  return (
    <div className="space-y-6">
        <AlphaWarningCard />  {/* ADD THIS LINE */}
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome, {user?.firstName}! 📚
        </h1>
        <p className="text-blue-100">
          Your personal library is ready. You have {stats.available} books available to lend.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
            <p className="text-sm text-gray-600">Total Books</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.available}</p>
            <p className="text-sm text-gray-600">Available</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.borrowed}</p>
            <p className="text-sm text-gray-600">Borrowed</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.lending}</p>
            <p className="text-sm text-gray-600">Lending</p>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button 
              className="w-full justify-start"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Book
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Invite Friends
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              <Search className="w-4 h-4 mr-2" />
              Browse Friends' Libraries
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {isLoadingActivity ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map(activity => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <div className="flex items-center space-x-2">
                      <p className="text-xs text-gray-500">{activity.time}</p>
                      {activity.status && (
                        <Badge variant={activity.status === 'approved' ? 'success' : activity.status === 'declined' ? 'danger' : 'warning'}>
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </Card>
      </div>

      {/* Add Book Modal */}
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBookAdded={handleBookAdded}
      />
    </div>
  );
}
// Alpha Warning Banner Component - Add this to your page.tsx

function AlphaWarningBanner() {
  const [isVisible, setIsVisible] = useState(() => {
    // Check if user has dismissed the banner before
    if (typeof window !== 'undefined') {
      return localStorage.getItem('alpha-warning-dismissed') !== 'true';
    }
    return true;
  });

  const dismissBanner = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('alpha-warning-dismissed', 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-red-700 rounded-full p-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <span className="font-semibold">⚠️ ALPHA BUILD WARNING</span>
            <span className="ml-2">
              This is an early development version of My Little Library. Features may be incomplete, data could be lost during updates, and functionality is subject to change without notice. Use for testing purposes only.
            </span>
          </div>
        </div>
        <button
          onClick={dismissBanner}
          className="text-red-200 hover:text-white ml-4 flex-shrink-0"
          title="Dismiss warning"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// Alpha Warning Card - Add this to your Dashboard component

function AlphaWarningCard() {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('alpha-dashboard-warning-dismissed') !== 'true';
    }
    return true;
  });

  const dismissCard = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('alpha-dashboard-warning-dismissed', 'true');
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="p-6 bg-red-50 border-red-200 border-2 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              ⚠️ Alpha Build Notice
            </h3>
            <div className="text-red-700 space-y-2">
              <p className="font-medium">This is an early development version with the following limitations:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Data Loss Risk:</strong> Your books and friend connections may be deleted during updates</li>
                <li><strong>Feature Instability:</strong> Some functions may not work as expected</li>
                <li><strong>Frequent Changes:</strong> Interface and functionality will change without notice</li>
                <li><strong>No Data Backup:</strong> We do not guarantee data preservation</li>
              </ul>
              <p className="text-sm font-medium mt-3">
                📋 <strong>Recommendation:</strong> Use this for testing and feedback only. Do not rely on this for important book cataloging yet.
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={dismissCard}
          className="text-red-400 hover:text-red-600 ml-4 flex-shrink-0"
          title="Dismiss warning"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </Card>
  );
}
// BookCard Component
function BookCard({ book, onEdit, onDelete }: { 
  book: Book; 
  onEdit?: (book: Book) => void;
  onDelete?: (bookId: string) => void;
}) {
  const { user } = useAuth();
  
  console.log('Book data:', book);
  console.log('Status:', book.status);
  console.log('BorrowedBy:', book.borrowedBy);
  console.log('BorrowerName:', book.borrowerName);

  const getStatusBadge = (status: string, borrowedBy?: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success">Available</Badge>;
      case 'checked_out':
        return <Badge variant="warning">
          {borrowedBy ? `borrowed by @${borrowedBy}` : 'Checked Out'}
        </Badge>;
      case 'borrowed':
        return <Badge variant="warning">
          {borrowedBy ? `borrowed by @${borrowedBy}` : 'Borrowed'}
        </Badge>;
      case 'return_pending':
        return <Badge variant="info">Return Pending</Badge>;
      case 'overdue':
        return <Badge variant="danger">Overdue</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleCancelReturn = async () => {
    const isConfirmed = confirm(
      `Are you sure you want to cancel your return request for "${book.title}"?`
    );
    
    if (!isConfirmed) return;
  
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
  
      const response = await fetch(`/api/books/${book.id}/cancel-return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      });
  
      if (response.ok) {
        // Refresh the page or update the book state
        window.location.reload();
      } else {
        console.error('Failed to cancel return request');
      }
    } catch (error) {
      console.error('Error cancelling return request:', error);
    }
  };
  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const handleMarkAsReturned = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${book.id}/return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        // Refresh the page or update the book state
        window.location.reload();
      } else {
        console.error('Failed to mark book as returned');
      }
    } catch (error) {
      console.error('Error marking book as returned:', error);
    }
  };

  const handleConfirmReturn = async () => {
    const isConfirmed = confirm(
      `Are you sure ${book.borrowerName} returned "${book.title}"?`
    );
    
    if (!isConfirmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${book.id}/confirm-return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        // Refresh the page or update the book state
        window.location.reload();
      } else {
        console.error('Failed to confirm book return');
      }
    } catch (error) {
      console.error('Error confirming book return:', error);
    }
  };

  // Determine if current user is the borrower
  const isBorrower = book.borrowedBy === user?.username;
  
  // Determine if current user is the owner (assuming book is from their library)
  const isOwner = !isBorrower; // This might need adjustment based on your data structure

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{book.title}</h3>
          <p className="text-gray-600">{book.author}</p>
          {book.genre && (
            <p className="text-sm text-gray-500 capitalize">{book.genre.replace('-', ' ')}</p>
          )}
          {book.publicationYear && (
            <p className="text-sm text-gray-500">{book.publicationYear}</p>
          )}
        </div>
        {getStatusBadge(book.status, book.borrowedBy)}
      </div>

      <div className="flex justify-between items-center text-sm mb-3">
        <span className={`font-medium capitalize ${getConditionColor(book.condition)}`}>
          {book.condition} condition
        </span>
        <span className="text-gray-500">
          Added {new Date(book.addedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Display full borrower info if available */}
      {(book.status === 'borrowed' || book.status === 'return_pending') && book.borrowerName && (
        <div className={`p-2 rounded border mb-3 ${
          book.status === 'return_pending' ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <p className={`text-sm ${
            book.status === 'return_pending' ? 'text-blue-800' : 'text-yellow-800'
          }`}>
            <span className="font-medium">
              {book.status === 'return_pending' ? 'Return pending from:' : 'Borrowed by:'}
            </span> {book.borrowerName}
          </p>
          {book.dueDate && (
            <p className={`text-sm ${
              book.status === 'return_pending' ? 'text-blue-800' : 'text-yellow-800'
            }`}>
              <span className="font-medium">Due:</span> {new Date(book.dueDate).toLocaleDateString()}
            </p>
          )}
          {book.status === 'return_pending' && (
            <p className="text-xs text-blue-600 mt-1">
              {isBorrower ? 'Waiting for owner confirmation...' : 'Please confirm if you received this book back'}
            </p>
          )}
        </div>
      )}

      {book.notes && (
        <p className="text-sm text-gray-600 mb-3 bg-gray-50 p-2 rounded">
          {book.notes}
        </p>
      )}

      {book.isbn && (
        <p className="text-xs text-gray-500 mb-3">ISBN: {book.isbn}</p>
      )}

      {/* Action Buttons */}
<div className="flex space-x-2 pt-3 border-t">
  {/* Return/Cancel Return/Confirm Return Buttons */}
  {book.status === 'borrowed' && isBorrower && (
    <Button size="sm" variant="primary" onClick={handleMarkAsReturned}>
      <CheckCircle className="w-4 h-4 mr-1" />
      Mark as Returned
    </Button>
  )}
  
  {book.status === 'return_pending' && isBorrower && (
    <Button size="sm" variant="secondary" onClick={handleCancelReturn}>
      <XCircle className="w-4 h-4 mr-1" />
      Cancel Return Request
    </Button>
  )}
  
  {book.status === 'return_pending' && isOwner && (
    <Button size="sm" variant="success" onClick={handleConfirmReturn}>
      <CheckCircle className="w-4 h-4 mr-1" />
      Confirm Return
    </Button>
  )}

  {/* Regular Edit/Delete for available books */}
  {book.status === 'available' && onEdit && (
    <Button size="sm" variant="secondary" onClick={() => onEdit(book)}>
      <Edit className="w-4 h-4 mr-1" />
      Edit
    </Button>
  )}
  
  {book.status === 'available' && onDelete && (
    <Button size="sm" variant="danger" onClick={() => onDelete(book.id)}>
      <Trash2 className="w-4 h-4 mr-1" />
      Delete
    </Button>
  )}
</div>
    </Card>
  );
}

// Enhanced Add Book Modal Component with ISBN Auto-Lookup
function AddBookModal({ 
  isOpen, 
  onClose, 
  onBookAdded 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onBookAdded: (book: Book) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    publicationYear: '',
    condition: 'good',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [error, setError] = useState('');

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  const genreOptions = [
    { value: 'fiction', label: 'Fiction' },
    { value: 'non-fiction', label: 'Non-Fiction' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'romance', label: 'Romance' },
    { value: 'science-fiction', label: 'Science Fiction' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'biography', label: 'Biography' },
    { value: 'history', label: 'History' },
    { value: 'self-help', label: 'Self-Help' },
    { value: 'business', label: 'Business' },
    { value: 'technology', label: 'Technology' },
    { value: 'other', label: 'Other' }
  ];

  // Google Books API lookup function
  const fetchBookDataFromISBN = async (isbn: string) => {
    try {
      setIsLookingUp(true);
      setError('');

      // Clean ISBN (remove hyphens/spaces)
      const cleanISBN = isbn.replace(/[-\s]/g, '');
      
      if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
        throw new Error('Please enter a valid 10 or 13 digit ISBN');
      }

      // Call Google Books API
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}&maxResults=1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch book data');
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error('No book found with this ISBN');
      }

      const book = data.items[0].volumeInfo;
      const filledFields: string[] = [];

      // Auto-populate form data (only if fields are empty)
      const updates: any = {};

      if (book.title && !formData.title) {
        updates.title = book.title;
        filledFields.push('title');
      }

      if (book.authors && book.authors.length > 0 && !formData.author) {
        updates.author = book.authors.join(', ');
        filledFields.push('author');
      }

      if (book.publishedDate && !formData.publicationYear) {
        const year = new Date(book.publishedDate).getFullYear();
        if (!isNaN(year)) {
          updates.publicationYear = year.toString();
          filledFields.push('publicationYear');
        }
      }

      if (book.categories && book.categories.length > 0 && !formData.genre) {
        const category = book.categories[0].toLowerCase();
        
        // Map Google Books categories to our genre options
        const genreMap: { [key: string]: string } = {
          'fiction': 'fiction',
          'biography': 'biography',
          'history': 'history',
          'science': 'science-fiction',
          'business': 'business',
          'self-help': 'self-help',
          'technology': 'technology',
          'computers': 'technology',
          'mystery': 'mystery',
          'romance': 'romance',
          'fantasy': 'fantasy'
        };

        const mappedGenre = Object.keys(genreMap).find(key => 
          category.includes(key)
        );

        if (mappedGenre) {
          updates.genre = genreMap[mappedGenre];
          filledFields.push('genre');
        }
      }

      // Update form data
      setFormData(prev => ({ ...prev, ...updates }));
      setAutoFilledFields(filledFields);

      console.log('Book data fetched successfully:', book);

    } catch (error: any) {
      console.error('ISBN lookup error:', error);
      setError(error.message || 'Failed to fetch book data');
    } finally {
      setIsLookingUp(false);
    }
  };

  // Handle ISBN input change with auto-lookup
  const handleISBNChange = (value: string) => {
    setFormData(prev => ({ ...prev, isbn: value }));
    setAutoFilledFields([]); // Clear auto-fill indicators when ISBN changes
    
    // Auto-lookup when user enters valid ISBN length
    const cleanISBN = value.replace(/[-\s]/g, '');
    if (cleanISBN.length === 10 || cleanISBN.length === 13) {
      // Debounce the lookup to avoid too many API calls
      const timeoutId = setTimeout(() => {
        fetchBookDataFromISBN(value);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  };

  // Manual lookup button handler
  const handleManualLookup = () => {
    if (formData.isbn.trim()) {
      fetchBookDataFromISBN(formData.isbn.trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || undefined,
        genre: formData.genre || undefined,
        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : undefined,
        condition: formData.condition,
        notes: formData.notes.trim() || undefined
      };

      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(bookData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add book');
      }

      onBookAdded(result.book);
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        isbn: '',
        genre: '',
        publicationYear: '',
        condition: 'good',
        notes: ''
      });
      setAutoFilledFields([]);
      onClose();

    } catch (error: any) {
      console.error('Add book error:', error);
      setError(error.message || 'Failed to add book');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Add New Book</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Auto-fill success message */}
          {autoFilledFields.length > 0 && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600">
                📚 Auto-filled {autoFilledFields.join(', ')} from ISBN lookup! You can edit any field.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ISBN Field with Lookup */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ISBN
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => handleISBNChange(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="978-0-123456-78-9"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleManualLookup}
                  disabled={!formData.isbn.trim() || isLookingUp}
                  className="whitespace-nowrap"
                >
                  {isLookingUp ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Looking up...
                    </>
                  ) : (
                    <>📚 Lookup</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter ISBN and we'll auto-fill book details from Google Books
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                  {autoFilledFields.includes('title') && (
                    <span className="ml-2 text-xs text-green-600">📚 auto-filled</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author *
                  {autoFilledFields.includes('author') && (
                    <span className="ml-2 text-xs text-green-600">📚 auto-filled</span>
                  )}
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genre
                  {autoFilledFields.includes('genre') && (
                    <span className="ml-2 text-xs text-green-600">📚 auto-filled</span>
                  )}
                </label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Select genre</option>
                  {genreOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publication Year
                  {autoFilledFields.includes('publicationYear') && (
                    <span className="ml-2 text-xs text-green-600">📚 auto-filled</span>
                  )}
                </label>
                <input
                  type="number"
                  value={formData.publicationYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, publicationYear: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="2023"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition *
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              >
                {conditionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={3}
                placeholder="Any additional notes about this book..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Adding...' : 'Add Book'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}




// NEW: Edit Book Modal Component
function EditBookModal({ 
  isOpen, 
  onClose, 
  book,
  onBookUpdated 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  book: Book | null;
  onBookUpdated: (updatedBook: Book) => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    genre: '',
    publicationYear: '',
    condition: 'good',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Initialize form data when book changes
  useEffect(() => {
    if (book) {
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn || '',
        genre: book.genre || '',
        publicationYear: book.publicationYear?.toString() || '',
        condition: book.condition,
        notes: book.notes || ''
      });
    }
  }, [book]);

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  const genreOptions = [
    { value: 'fiction', label: 'Fiction' },
    { value: 'non-fiction', label: 'Non-Fiction' },
    { value: 'mystery', label: 'Mystery' },
    { value: 'romance', label: 'Romance' },
    { value: 'science-fiction', label: 'Science Fiction' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'biography', label: 'Biography' },
    { value: 'history', label: 'History' },
    { value: 'self-help', label: 'Self-Help' },
    { value: 'business', label: 'Business' },
    { value: 'other', label: 'Other' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    
    setError('');
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const bookData = {
        title: formData.title.trim(),
        author: formData.author.trim(),
        isbn: formData.isbn.trim() || undefined,
        genre: formData.genre || undefined,
        publicationYear: formData.publicationYear ? parseInt(formData.publicationYear) : undefined,
        condition: formData.condition,
        notes: formData.notes.trim() || undefined
      };

      const response = await fetch(`/api/books/${book.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(bookData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update book');
      }

      onBookUpdated(result.book);
      onClose();

    } catch (error: any) {
      console.error('Update book error:', error);
      setError(error.message || 'Failed to update book');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !book) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Book</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Author *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ISBN
                </label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="978-0-123456-78-9"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genre
                </label>
                <select
                  value={formData.genre}
                  onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Select genre</option>
                  {genreOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Publication Year
                </label>
                <input
                  type="number"
                  value={formData.publicationYear}
                  onChange={(e) => setFormData(prev => ({ ...prev, publicationYear: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="2023"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Condition *
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              >
                {conditionOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={3}
                placeholder="Any additional notes about this book..."
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Updating...' : 'Update Book'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Enhanced MyLibrary Component
function MyLibrary() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');

  // Fetch books on component mount
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/books', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch books');
      }

      console.log('Books fetched:', result.books);
      setBooks(result.books || []);

    } catch (error: any) {
      console.error('Fetch books error:', error);
      setError(error.message || 'Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAdded = (newBook: Book) => {
    setBooks(prev => [newBook, ...prev]);
  };

  const handleBookUpdated = (updatedBook: Book) => {
    setBooks(prev => prev.map(b => 
      b.id === updatedBook.id ? updatedBook : b
    ));
    setIsEditModalOpen(false);
    setEditingBook(null);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setIsEditModalOpen(true);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!confirm('Are you sure you want to delete this book?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete book');
      }

      setBooks(prev => prev.filter(book => book.id !== bookId));
      console.log('Book deleted successfully');

    } catch (error: any) {
      console.error('Delete book error:', error);
      setError(error.message || 'Failed to delete book');
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || book.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Library</h1>
          <p className="text-gray-600">Manage your book collection ({books.length} books)</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Book
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setError('')}
            className="mt-2"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search books..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          >
            <option value="all">All Books</option>
            <option value="available">Available</option>
            <option value="checked_out">Borrowed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </Card>

      {/* Books Grid */}
      {filteredBooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map(book => (
            <BookCard 
              key={book.id} 
              book={book} 
              onEdit={handleEditBook}
              onDelete={handleDeleteBook}
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No books found' : 'No books yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterStatus !== 'all' 
              ? "Try adjusting your search or filters" 
              : "Start building your library by adding your first book"
            }
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Book
            </Button>
          )}
        </Card>
      )}

      {/* Add Book Modal */}
      <AddBookModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onBookAdded={handleBookAdded}
      />

      {/* Edit Book Modal */}
      <EditBookModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingBook(null);
        }}
        book={editingBook}
        onBookUpdated={handleBookUpdated}
      />
    </div>
  );
}


// Enhanced InvitationsList Component - Replace your existing one with this
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
// Placeholder Components
function Friends() {
  return (
    <Card className="p-8 text-center">
      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Friends & Sharing</h2>
      <p className="text-gray-600 mb-4">Connect with friends and share books</p>
      <Button>
        <Users className="w-4 h-4 mr-2" />
        Invite Friends
      </Button>
    </Card>
  );
}

// Enhanced Lending Component
function Lending() {
  const { user } = useAuth();
  const [borrowedBooks, setBorrowedBooks] = useState<Book[]>([]);
  const [lentBooks, setLentBooks] = useState<Book[]>([]);
  const [isLoadingBorrowed, setIsLoadingBorrowed] = useState(true);
  const [isLoadingLent, setIsLoadingLent] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadBorrowedBooks();
      loadLentBooks();
    }
  }, [user?.id]);

  const loadBorrowedBooks = async () => {
    try {
      setIsLoadingBorrowed(true);
      // This would need a new API endpoint or modification to existing ones
      // For now, we'll use borrow requests that are approved
      const response = await fetch(`/api/borrow/requests?userId=${user?.id}`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter for books user is borrowing (approved requests where user is borrower)
        const userBorrowedBooks = data.requests
          .filter((req: any) => req.borrowerId === user?.id && req.status === 'approved')
          .map((req: any) => ({
            id: req.bookId,
            title: req.bookTitle,
            author: req.bookAuthor,
            status: 'borrowed',
            ownerName: req.ownerName,
            ownerId: req.ownerId,
            dueDate: req.dueDate,
            borrowedAt: req.requestedAt,
            addedAt: req.requestedAt
          }));
        
        setBorrowedBooks(userBorrowedBooks);
      }
    } catch (error) {
      console.error('Failed to load borrowed books:', error);
    } finally {
      setIsLoadingBorrowed(false);
    }
  };

  const loadLentBooks = async () => {
    try {
      setIsLoadingLent(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Get books from user's library that are currently borrowed
      const response = await fetch('/api/books', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        const books: Book[] = result.books || [];
        
        // Filter for books that are currently lent out
        const lentOutBooks = books.filter(book => 
          book.status === 'borrowed' || book.status === 'return_pending'
        );
        
        setLentBooks(lentOutBooks);
      }
    } catch (error) {
      console.error('Failed to load lent books:', error);
    } finally {
      setIsLoadingLent(false);
    }
  };

  const handleMarkAsReturned = async (bookId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${bookId}/return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        // Refresh both lists
        loadBorrowedBooks();
        loadLentBooks();
      } else {
        console.error('Failed to mark book as returned');
      }
    } catch (error) {
      console.error('Error marking book as returned:', error);
    }
  };

  const handleConfirmReturn = async (bookId: string, borrowerName: string, bookTitle: string) => {
    const isConfirmed = confirm(
      `Are you sure ${borrowerName} returned "${bookTitle}"?`
    );
    
    if (!isConfirmed) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/books/${bookId}/confirm-return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        // Refresh lent books list
        loadLentBooks();
      } else {
        console.error('Failed to confirm book return');
      }
    } catch (error) {
      console.error('Error confirming book return:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Lending & Borrowing</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Books I'm Borrowing */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BookOpen className="w-5 h-5 text-blue-600 mr-2" />
            Books I'm Borrowing ({borrowedBooks.length})
          </h2>
          
          {isLoadingBorrowed ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading borrowed books...</p>
            </div>
          ) : borrowedBooks.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No borrowed books</h3>
              <p className="text-gray-600">Books you're borrowing from friends will appear here.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {borrowedBooks.map((book) => (
                <Card key={book.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{book.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                      <p className="text-sm text-gray-500 mb-2">
                        Borrowed from {(book as any).ownerName}
                      </p>
                      
                      {book.dueDate && (
                        <div className="flex items-center text-sm text-gray-500 mb-3">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due: {new Date(book.dueDate).toLocaleDateString()}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400">
                        Borrowed {new Date(book.addedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="ml-4">
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={() => handleMarkAsReturned(book.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark as Returned
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Books I've Lent Out */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 text-purple-600 mr-2" />
            Books I've Lent Out ({lentBooks.length})
          </h2>
          
          {isLoadingLent ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading lent books...</p>
            </div>
          ) : lentBooks.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No books lent out</h3>
              <p className="text-gray-600">Books you've lent to friends will appear here.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {lentBooks.map((book) => (
                <Card key={book.id} className={`p-4 ${
                  book.status === 'return_pending' ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">{book.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
                      <p className="text-sm text-gray-500 mb-2">
                        Lent to {book.borrowerName}
                      </p>
                      
                      {book.dueDate && (
                        <div className="flex items-center text-sm text-gray-500 mb-2">
                          <Calendar className="w-4 h-4 mr-1" />
                          Due: {new Date(book.dueDate).toLocaleDateString()}
                        </div>
                      )}

                      {book.status === 'return_pending' && (
                        <div className="flex items-center text-sm text-blue-600 mb-2">
                          <Clock className="w-4 h-4 mr-1" />
                          Return pending - please confirm if received
                        </div>
                      )}

                      <Badge variant={
                        book.status === 'return_pending' ? 'info' : 
                        book.status === 'borrowed' ? 'warning' : 'default'
                      }>
                        {book.status === 'return_pending' ? 'Return Pending' : 'Borrowed'}
                      </Badge>
                    </div>
                    
                    <div className="ml-4">
                      {book.status === 'return_pending' && (
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => handleConfirmReturn(book.id, book.borrowerName || 'Unknown', book.title)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirm Return
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return <>{children}</>;
}

// Friend's Library Viewer Modal
function FriendLibraryModal({ friend, isOpen, onClose }: { 
  friend: Friend | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'added' | 'title' | 'author'>('added');

  useEffect(() => {
    if (friend && isOpen) {
      loadFriendBooks();
    }
  }, [friend, isOpen]);

  const loadFriendBooks = async () => {
    if (!friend) return;
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/books/user/${friend.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setBooks(data.books || []);
      }
    } catch (error) {
      console.error('Failed to load friend books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sort and filter books
  const sortedAndFilteredBooks = books
    .filter(book =>
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.genre && book.genre.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'added':
        default:
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
      }
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{friend?.firstName}'s Library</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading books...</p>
          </div>
        ) : books.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No available books</h3>
            <p className="text-gray-600">{friend?.firstName} has no books available for borrowing right now.</p>
          </div>
        ) : (
          <>
            {/* Search and Sort Bar */}
            <div className="mb-4 flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search books..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'added' | 'title' | 'author')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="added">Newest First</option>
                <option value="title">Title A-Z</option>
                <option value="author">Author A-Z</option>
              </select>
            </div>

            {/* Books Grid */}
            {sortedAndFilteredBooks.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No books match your search</h3>
                <p className="text-gray-600">Try adjusting your search terms.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedAndFilteredBooks.map((book) => (
                  <Card key={book.id} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{book.title}</h3>
                        <p className="text-gray-600 text-xs">by {book.author}</p>
                      </div>
                      
                      {book.genre && (
                        <div className="text-xs text-gray-500">Genre: {book.genre}</div>
                      )}
                      
                      <div className="text-xs text-gray-500">Condition: {book.condition}</div>
                      
                      {book.notes && (
                        <p className="text-xs text-gray-600">{book.notes}</p>
                      )}
                      
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedBook(book)}
                      >
                        Request to Borrow
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <BorrowRequestModal
              book={selectedBook}
              friend={friend}
              isOpen={!!selectedBook}
              onClose={() => setSelectedBook(null)}
            />
          </>
        )}
      </div>
    </div>
  );
}

// Borrow Request Modal  
function BorrowRequestModal({ book, friend, isOpen, onClose }: {
  book: Book | null;
  friend: Friend | null; 
  isOpen: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book || !friend || !user) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/borrow/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: book.id,
          ownerId: friend.id,
          borrowerId: user.id,
          message: message.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onClose();
        setMessage('');
        // You could add a success notification here
      } else {
        setError(data.error || 'Failed to send request');
      }
    } catch (error) {
      setError('Failed to send request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Request to Borrow</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium">{book?.title}</h3>
          <p className="text-sm text-gray-600">by {book?.author}</p>
          <p className="text-sm text-gray-600">from {friend?.firstName} {friend?.lastName}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! I'd love to borrow this book..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Sending...' : 'Send Request'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Borrow Requests Manager
function BorrowRequestsList() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadRequests();
    }
  }, [user?.id]);

  const loadRequests = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/borrow/requests?userId=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to load requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const respondToRequest = async (requestId: string, action: 'approved' | 'declined') => {
    try {
      const response = await fetch(`/api/borrow/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, userId: user?.id }),
      });

      if (response.ok) {
        loadRequests(); // Reload requests
      }
    } catch (error) {
      console.error('Failed to respond to request:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading requests...</p>
      </div>
    );
  }

  const incomingRequests = requests.filter(req => req.ownerId === user?.id && req.status === 'pending');
  const outgoingRequests = requests.filter(req => req.borrowerId === user?.id);

  return (
    <div className="space-y-6">
      {/* Incoming Requests */}
      {incomingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 text-orange-600 mr-2" />
            Incoming Requests ({incomingRequests.length})
          </h3>
          <div className="space-y-3">
            {incomingRequests.map((request) => (
              <Card key={request.id} className="p-4 border-l-4 border-l-orange-500">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen className="w-4 h-4 text-orange-600" />
                      <span className="font-medium">{request.borrowerName}</span>
                      <span className="text-gray-500">wants to borrow</span>
                      <span className="font-medium text-blue-600">"{request.bookTitle}"</span>
                    </div>
                    {request.message && (
                      <p className="text-sm text-gray-600 mb-2 italic">"{request.message}"</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Requested {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => respondToRequest(request.id, 'approved')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => respondToRequest(request.id, 'declined')}
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

      {/* Outgoing Requests */}
      {outgoingRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            My Requests ({outgoingRequests.length})
          </h3>
          <div className="space-y-3">
            {outgoingRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <BookOpen className="w-4 h-4 text-gray-600" />
                      <span className="font-medium">"{request.bookTitle}"</span>
                      <span className="text-gray-500">from {request.ownerName}</span>
                      <Badge variant={
                        request.status === 'approved' ? 'success' :
                        request.status === 'declined' ? 'danger' : 'warning'
                      }>
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400">
                      Requested {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="text-center py-8">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No borrow requests</h3>
          <p className="text-gray-600">Borrow requests will appear here.</p>
        </div>
      )}
    </div>
  );
}

// Enhanced Borrowed Books Tab
function EnhancedBorrowedBooks() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Borrowed Books & Requests</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Borrow Requests</h2>
          <BorrowRequestsList />
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Currently Borrowed</h2>
          <div className="text-center py-8">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No borrowed books</h3>
            <p className="text-gray-600">Books you're currently borrowing will appear here.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
// Main App Component
export default function LittleLibraryApp() {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeTab') || 'dashboard';
    }
    return 'dashboard';
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false); 

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'library': return <MyLibrary />;
      case 'friends': return <FriendsTab />;
      case 'borrowed': return <Lending />;
      default: return <Dashboard />;
    }
  };


// Add this function inside your main component, after your other modal functions
function BugReportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth(); // Get current user info
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    email: '',
    url: '',
    severity: 'Medium'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Auto-fill email if user is logged in
  useEffect(() => {
    if (user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email }));
    }
  }, [user, formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        embeds: [{
          title: "🐛 New Bug Report",
          color: 0xff0000,
          fields: [
            { name: "Title", value: formData.title, inline: false },
            { name: "Description", value: formData.description, inline: false },
            { name: "Reporter Email", value: formData.email || user?.email || "Not provided", inline: true },
            { name: "User ID", value: user?.id || "Anonymous", inline: true },
            { name: "User Name", value: user ? `${user.firstName} ${user.lastName}` : "Anonymous", inline: true },
            { name: "Page URL", value: formData.url || window.location.href, inline: true },
            { name: "Severity", value: formData.severity, inline: true },
            { name: "Browser", value: navigator.userAgent, inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "Little Library Bug Report" }
        }]
      };

      await fetch('https://discord.com/api/webhooks/1388639626582954024/WUsClIRqMKhA1ekIfP50jzmvYJtrCaFXQr0IomJOK0aVfW-UkxXhorSHqJUvC2FRfNBs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({
          title: '',
          description: '',
          email: '',
          url: '',
          severity: 'Medium'
        });
      }, 2000);
    } catch (error) {
      console.error('Error submitting bug report:', error);
      alert('Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
          <div className="text-green-500 text-5xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Bug Report Sent!</h3>
          <p className="text-gray-600">Thank you for helping improve Little Library.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Bug className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Report a Bug</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bug Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Brief description of the issue"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={4}
                placeholder="What happened? What did you expect to happen? Steps to reproduce..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="For follow-up questions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Page URL (optional)
              </label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="Where did this bug occur?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Severity
              </label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="Low">Low - Minor issue</option>
                <option value="Medium">Medium - Affects functionality</option>
                <option value="High">High - Blocks important features</option>
                <option value="Critical">Critical - App unusable</option>
              </select>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Bug Report</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-4 text-xs text-gray-500">
            Reports are sent to our development team via Discord for quick response.
          </div>
        </div>
      </div>
    </div>
  );
}
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <AuthWrapper>
        <AlphaWarningBanner />  {/* ADD THIS LINE */}
          <Navigation
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
          />
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {renderContent()}
          </main>
         {/* ADD THESE TWO PIECES HERE - right before the closing AuthWrapper */}
         <button
            onClick={() => setShowBugReport(true)}
            className="fixed bottom-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 z-40"
            title="Report a Bug"
          >
            <Bug className="w-5 h-5" />
          </button>

          <BugReportModal 
            isOpen={showBugReport} 
            onClose={() => setShowBugReport(false)} 
          />
          
        </AuthWrapper>
      </div>
    </AuthProvider>
  );
}