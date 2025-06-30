// src/app/api/books/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET - Fetch user's books
export async function GET(request: NextRequest) {
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

    // Get user's library first
    const { data: library, error: libraryError } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (libraryError || !library) {
      return NextResponse.json({ error: 'Library not found' }, { status: 404 });
    }

    // Fetch books from user's library with status and borrower info
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select(`
        *,
        book_status!inner(status),
        borrowing_history(
          borrower_id,
          checked_out_at,
          due_date,
          borrower:borrower_id(first_name, last_name, username)
        )
      `)
      .eq('library_id', library.id)
      .order('added_at', { ascending: false });

    if (booksError) {
      return NextResponse.json({ error: booksError.message }, { status: 500 });
    }

    // Transform the data to match our Book interface
    const transformedBooks = books?.map(book => {
      const activeBorrow = book.borrowing_history?.find(
        (bh: any) => bh.checked_out_at && !bh.checked_in_at
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
        borrowedBy: activeBorrow?.borrower?.username || null,
        borrowerName: activeBorrow ? 
          `${activeBorrow.borrower?.first_name} ${activeBorrow.borrower?.last_name}` : null,
        dueDate: activeBorrow?.due_date || null
      };
    }) || [];

    return NextResponse.json({ books: transformedBooks }, { status: 200 });

  } catch (error) {
    console.error('GET /api/books error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add new book
export async function POST(request: NextRequest) {
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

    // Get user's library
    const { data: library, error: libraryError } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (libraryError || !library) {
      return NextResponse.json({ error: 'Library not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { title, author, isbn, genre, publicationYear, condition, notes } = body;

    // Validate required fields
    if (!title || !author || !condition) {
      return NextResponse.json({ error: 'Title, author, and condition are required' }, { status: 400 });
    }

    // Create book
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert([{
        library_id: library.id,
        title,
        author,
        isbn: isbn || null,
        genre: genre || null,
        publication_year: publicationYear || null,
        condition,
        notes: notes || null,
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (bookError) {
      return NextResponse.json({ error: bookError.message }, { status: 500 });
    }

    // Create initial book status
    const { error: statusError } = await supabase
      .from('book_status')
      .insert([{
        book_id: book.id,
        status: 'available',
        created_at: new Date().toISOString()
      }]);

    if (statusError) {
      console.error('Failed to create book status:', statusError);
      // Don't fail the request, just log the error
    }

    // Transform response to match our Book interface
    const transformedBook = {
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      genre: book.genre,
      publicationYear: book.publication_year,
      condition: book.condition,
      notes: book.notes,
      status: 'available',
      addedAt: book.added_at
    };

    return NextResponse.json({ book: transformedBook }, { status: 201 });

  } catch (error) {
    console.error('POST /api/books error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove a book
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get book ID from URL
    const url = new URL(request.url);
    const bookId = url.searchParams.get('id');
    
    if (!bookId) {
      return NextResponse.json({ error: 'Book ID required' }, { status: 400 });
    }

    // Get user's library
    const { data: library } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (!library) {
      return NextResponse.json({ error: 'Library not found' }, { status: 404 });
    }

    // Verify book belongs to user's library before deleting
    const { data: book } = await supabase
      .from('books')
      .select('id')
      .eq('id', bookId)
      .eq('library_id', library.id)
      .single();

    if (!book) {
      return NextResponse.json({ error: 'Book not found or not owned by user' }, { status: 404 });
    }

    // Delete book_status first (foreign key constraint)
    await supabase
      .from('book_status')
      .delete()
      .eq('book_id', bookId);

    // Delete the book
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Book deleted successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}