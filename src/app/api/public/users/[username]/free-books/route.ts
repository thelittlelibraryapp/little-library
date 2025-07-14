import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // First, get the user by username
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id, raw_user_meta_data')
      .eq('raw_user_meta_data->>username', username)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userData.id;
    const userMetadata = userData.raw_user_meta_data as any;

    // Get user's books that are marked as "free to good home"
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', userId)
      .eq('is_free_to_good_home', true)
      .eq('status', 'available') // Only show available books
      .order('created_at', { ascending: false });

    if (booksError) {
      console.error('Error fetching books:', booksError);
      return NextResponse.json(
        { error: 'Failed to fetch books' },
        { status: 500 }
      );
    }

    // Transform the books data to match our interface
    const transformedBooks = (books || []).map((book: any) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      genre: book.genre,
      publicationYear: book.publication_year,
      condition: book.condition,
      notes: book.notes,
      delivery_method: book.delivery_method,
      addedAt: book.created_at,
    }));

    // Return user info and books
    return NextResponse.json({
      user: {
        id: userId,
        firstName: userMetadata?.first_name || userMetadata?.firstName || 'Book Lover',
        username: username,
      },
      books: transformedBooks,
    });

  } catch (error) {
    console.error('Error in public books API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}