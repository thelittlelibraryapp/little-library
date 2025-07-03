import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    // Get user's library
    const { data: library } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (!library) {
      return NextResponse.json({ books: [] });
    }

    // Get available books WITH FREE TO GOOD HOME FIELDS, TRANSFER STATUS, AND IMAGES
    const { data: books, error } = await supabase
      .from('books')
      .select(`
        *,
        is_free_to_good_home,
        delivery_method,
        claimed_by_user_id,
        claimed_at,
        claim_expires_at,
        cover_image_url,
        spine_image_url,
        has_custom_cover,
        has_custom_spine,
        book_status!inner(status),
        book_transfers!left(
          id,
          status,
          transfer_initiated_at,
          transfer_completed_at,
          to_library_id
        )
      `)
      .eq('library_id', library.id)
      .eq('book_status.status', 'available')
      .order('added_at', { ascending: false });

    if (error) throw error;

    // Transform to match your Book interface WITH NEW FIELDS, TRANSFER STATUS, AND IMAGES
    const transformedBooks = books?.map(book => {
      // Get the most recent pending transfer
      const pendingTransfer = book.book_transfers?.find(
        (transfer: any) => transfer.status === 'pending'
      );
      
      return {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        genre: book.genre,
        publicationYear: book.publication_year,
        condition: book.condition,
        notes: book.notes,
        status: book.book_status[0]?.status || 'available',
        addedAt: book.added_at,
        // FREE TO GOOD HOME FIELDS:
        is_free_to_good_home: book.is_free_to_good_home || false,
        delivery_method: book.delivery_method || 'pickup',
        claimed_by_user_id: book.claimed_by_user_id || null,
        claimed_at: book.claimed_at || null,
        claim_expires_at: book.claim_expires_at || null,
        // TRANSFER FIELDS:
        transfer_status: pendingTransfer ? 'pending' : 'none',
        transfer_id: pendingTransfer?.id || null,
        // NEW IMAGE FIELDS:
        cover_image_url: book.cover_image_url || null,
        spine_image_url: book.spine_image_url || null,
        has_custom_cover: book.has_custom_cover || false,
        has_custom_spine: book.has_custom_spine || false
      };
    }) || [];

    return NextResponse.json({ books: transformedBooks });

  } catch (error) {
    console.error('Get user books error:', error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}