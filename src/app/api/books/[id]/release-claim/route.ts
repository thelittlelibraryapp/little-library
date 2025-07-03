// File: /src/app/api/books/[id]/release-claim/route.ts
// PUT endpoint to release a book claim

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

    // Get the book and verify claim ownership
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*, libraries!inner(owner_id)')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    // Check if book is claimed by this user
    if (book.claimed_by_user_id !== user.id) {
      return NextResponse.json({ 
        error: 'You can only release claims on books you have claimed' 
      }, { status: 403 });
    }

    // Check if claim has already expired
    if (book.claim_expires_at) {
      const expiresAt = new Date(book.claim_expires_at);
      const now = new Date();
      
      if (expiresAt < now) {
        return NextResponse.json({ 
          error: 'This claim has already expired' 
        }, { status: 400 });
      }
    }

    // Release the claim
    const { error: releaseError } = await supabase
      .from('books')
      .update({
        claimed_by_user_id: null,
        claimed_at: null,
        claim_expires_at: null
      })
      .eq('id', bookId);

    if (releaseError) {
      return NextResponse.json({ error: releaseError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: `You've released your claim on "${book.title}". It's now available for others to claim!`,
      bookTitle: book.title,
      deliveryMethod: book.delivery_method
    }, { status: 200 });

  } catch (error) {
    console.error('PUT /api/books/[id]/release-claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}