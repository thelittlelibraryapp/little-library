// File: /src/app/api/books/[id]/claim/route.ts
// PUT endpoint to claim a free book (authenticated users)
// POST endpoint to claim a free book (public users with just userId)

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get the user from the auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;
    const bookId = id;

    // Get the book and verify it's available for claiming
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*, libraries!inner(owner_id)')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check if user is trying to claim their own book
    if (book.libraries.owner_id === user.id) {
      return NextResponse.json({ error: 'You cannot claim your own book' }, { status: 400 });
    }

    // Check if book is marked as free to good home
    if (!book.is_free_to_good_home) {
      return NextResponse.json({ error: 'This book is not available for free' }, { status: 400 });
    }

    // Check if book is already claimed and not expired
    if (book.claimed_by_user_id && book.claim_expires_at) {
      const expiresAt = new Date(book.claim_expires_at);
      const now = new Date();
      
      if (expiresAt > now) {
        return NextResponse.json({ 
          error: 'This book is already claimed by someone else',
          claimedBy: book.claimed_by_user_id,
          expiresAt: book.claim_expires_at
        }, { status: 409 });
      }
    }

    // Claim the book (48 hour hold)
    const claimedAt = new Date();
    const expiresAt = new Date(claimedAt.getTime() + (48 * 60 * 60 * 1000)); // 48 hours

    const { error: claimError } = await supabase
      .from('books')
      .update({
        claimed_by_user_id: user.id,
        claimed_at: claimedAt.toISOString(),
        claim_expires_at: expiresAt.toISOString()
      })
      .eq('id', bookId);

    if (claimError) {
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    }

    // Get user info for response
    const { data: claimingUser } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    return NextResponse.json({ 
      success: true,
      message: `You've claimed "${book.title}"! You have 48 hours to arrange pickup.`,
      claimedAt: claimedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      deliveryMethod: book.delivery_method,
      claimingUser: claimingUser
    }, { status: 200 });

  } catch (error) {
    console.error('PUT /api/books/[id]/claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { id } = await params;
    const bookId = id;
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get the book and verify it's available for claiming
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check if user is trying to claim their own book
    if (book.user_id === userId) {
      return NextResponse.json({ error: 'You cannot claim your own book' }, { status: 400 });
    }

    // Check if book is marked as free to good home
    if (!book.is_free_to_good_home) {
      return NextResponse.json({ error: 'This book is not available for free' }, { status: 400 });
    }

    // Check if book is already claimed and not expired
    if (book.claimed_by_user_id && book.claim_expires_at) {
      const expiresAt = new Date(book.claim_expires_at);
      const now = new Date();
      
      if (expiresAt > now) {
        return NextResponse.json({ 
          error: 'This book is already claimed by someone else',
          claimedBy: book.claimed_by_user_id,
          expiresAt: book.claim_expires_at
        }, { status: 409 });
      }
    }

    // Claim the book (48 hour hold)
    const claimedAt = new Date();
    const expiresAt = new Date(claimedAt.getTime() + (48 * 60 * 60 * 1000)); // 48 hours

    const { error: claimError } = await supabase
      .from('books')
      .update({
        claimed_by_user_id: userId,
        claimed_at: claimedAt.toISOString(),
        claim_expires_at: expiresAt.toISOString()
      })
      .eq('id', bookId);

    if (claimError) {
      return NextResponse.json({ error: claimError.message }, { status: 500 });
    }

    // Get user info for response
    const { data: claimingUser } = await supabase
      .from('auth.users')
      .select('raw_user_meta_data')
      .eq('id', userId)
      .single();

    const userMetadata = claimingUser?.raw_user_meta_data as any;

    return NextResponse.json({ 
      success: true,
      message: `You've claimed "${book.title}"! You have 48 hours to arrange pickup.`,
      claimedAt: claimedAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      deliveryMethod: book.delivery_method,
      claimingUser: {
        first_name: userMetadata?.first_name || userMetadata?.firstName,
        last_name: userMetadata?.last_name || userMetadata?.lastName,
        email: userMetadata?.email
      }
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/books/[id]/claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}