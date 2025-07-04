 
// src/types/index.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
}

export interface Book {
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
  borrowedBy?: string;
  borrowerName?: string;
  is_free_to_good_home?: boolean;
  delivery_method?: 'pickup' | 'mail' | 'both';
  claimed_by_user_id?: string;
  claimed_at?: string;
  claim_expires_at?: string;
  transfer_status?: 'none' | 'pending' | 'completed';
  transfer_id?: string;
  cover_image_url?: string;
  spine_image_url?: string;
  has_custom_cover?: boolean;
  has_custom_spine?: boolean;
}

export interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  bookCount: number;
  availableBooks: number;
  friendshipDate: string;
}

export interface Invitation {
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

export interface Achievement {
  id: string;
  type: string;
  name: string;
  icon: string;
  description: string;
  points: number;
  unlockedAt: string;
}

export interface BorrowRequest {
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

export interface ClaimNotification {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  claimerName: string;
  claimerUsername: string;
  claimerEmail: string;
  claimedAt: string;
  timeRemaining: number;
}

export interface FriendLibrary {
  friendId: string;
  friendName: string;
  books: Book[];
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, username: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}