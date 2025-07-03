// File: /src/app/api/books/claimed-notifications/route.ts
// GET endpoint to fetch books that have been claimed by others

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get user from the auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user's library
    const { data: library, error: libraryError } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (libraryError || !library) {
      return NextResponse.json({ notifications: [] });
    }

    // Get books that are claimed by others (not expired)
    const now = new Date().toISOString();
    const { data: claimedBooks, error: booksError } = await supabase
      .from('books')
      .select(`
        id,
        title,
        author,
        claimed_by_user_id,
        claimed_at,
        claim_expires_at,
        claimer:claimed_by_user_id(
          id,
          first_name,
          last_name,
          username,
          email
        )
      `)
      .eq('library_id', library.id)
      .eq('is_free_to_good_home', true)
      .not('claimed_by_user_id', 'is', null)
      .gt('claim_expires_at', now);

    if (booksError) {
      console.error('Error fetching claimed books:', booksError);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Transform to notification format
    const notifications = claimedBooks?.map(book => {
      const timeRemaining = book.claim_expires_at 
        ? Math.ceil((new Date(book.claim_expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60))
        : 0;

      return {
        bookId: book.id,
        bookTitle: book.title,
        bookAuthor: book.author,
        claimerName: `${book.claimer.first_name} ${book.claimer.last_name}`.trim(),
        claimerUsername: book.claimer.username,
        claimerEmail: book.claimer.email,
        claimedAt: book.claimed_at,
        timeRemaining: Math.max(0, timeRemaining)
      };
    }) || [];

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error('GET /api/books/claimed-notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}