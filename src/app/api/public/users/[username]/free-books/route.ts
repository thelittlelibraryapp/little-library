import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Get the user by username from the custom users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, first_name, username')
      .eq('username', username)
      .single();

    if (userError || !userData) {
      console.log('User lookup error:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // FIXED: Get user's library first, then get books from that library
    const { data: library, error: libraryError } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (libraryError || !library) {
      console.log('Library lookup error:', libraryError);
      return NextResponse.json(
        { error: 'User library not found' },
        { status: 404 }
      );
    }

    // Get books that are marked as "free to good home" from the user's library
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('*')
      .eq('library_id', library.id)
      .eq('is_free_to_good_home', true)
      .order('added_at', { ascending: false });

    if (booksError) {
      console.error('Error fetching books:', booksError);
      return NextResponse.json(
        { 
          error: 'Failed to fetch books',
          debug: {
            userId,
            libraryId: library.id,
            booksError: booksError.message
          }
        },
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
      addedAt: book.added_at,
    }));

    // Return user info and books
    return NextResponse.json({
      user: {
        id: userId,
        firstName: userData.first_name,
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