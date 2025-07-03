// File: /src/app/api/books/[id]/toggle-free/route.ts
// PUT endpoint to toggle Free to Good Home status

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
    const { isFreeToGoodHome, deliveryMethod } = await request.json();

    // Verify the user owns this book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('*, libraries!inner(owner_id)')
      .eq('id', bookId)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.libraries.owner_id !== user.id) {
      return NextResponse.json({ error: 'You do not own this book' }, { status: 403 });
    }

    // Update the book's free status
    const { error: updateError } = await supabase
      .from('books')
      .update({
        is_free_to_good_home: isFreeToGoodHome,
        delivery_method: deliveryMethod || 'pickup',
        // Clear any existing claims when toggling
        claimed_by_user_id: null,
        claimed_at: null,
        claim_expires_at: null
      })
      .eq('id', bookId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: isFreeToGoodHome ? 'Book marked as free to good home!' : 'Book removed from free offerings',
      isFreeToGoodHome,
      deliveryMethod
    }, { status: 200 });

  } catch (error) {
    console.error('PUT /api/books/[id]/toggle-free error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}