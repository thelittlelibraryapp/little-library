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

    // Fetch books from user's library with status, borrower info, transfer status, AND IMAGES
    const { data: books, error: booksError } = await supabase
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
        borrowing_history(
          borrower_id,
          checked_out_at,
          due_date,
          borrower:borrower_id(first_name, last_name, username)
        ),
        book_transfers!left(
          id,
          status,
          transfer_initiated_at,
          transfer_completed_at,
          to_library_id
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
        borrowedBy: activeBorrow?.borrower?.username || null,
        borrowerName: activeBorrow ? 
          `${activeBorrow.borrower?.first_name} ${activeBorrow.borrower?.last_name}` : null,
        dueDate: activeBorrow?.due_date || null,
        is_free_to_good_home: book.is_free_to_good_home || false,
        delivery_method: book.delivery_method || 'pickup',
        claimed_by_user_id: book.claimed_by_user_id || null,
        claimed_at: book.claimed_at || null,
        claim_expires_at: book.claim_expires_at || null,
        // TRANSFER FIELDS
        transfer_status: pendingTransfer ? 'pending' : 'none',
        transfer_id: pendingTransfer?.id || null,
        // NEW IMAGE FIELDS
        cover_image_url: book.cover_image_url || null,
        spine_image_url: book.spine_image_url || null,
        has_custom_cover: book.has_custom_cover || false,
        has_custom_spine: book.has_custom_spine || false
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
      addedAt: book.added_at,
      // Initialize transfer fields for new books
      transfer_status: 'none',
      transfer_id: null,
      // Initialize image fields for new books
      cover_image_url: null,
      spine_image_url: null,
      has_custom_cover: false,
      has_custom_spine: false
    };

    return NextResponse.json({ book: transformedBook }, { status: 201 });

  } catch (error) {
    console.error('POST /api/books error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}