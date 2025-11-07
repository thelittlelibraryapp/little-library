import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Helper function to fetch genre from Google Books API
async function fetchGenreFromGoogle(isbn: string): Promise<string | undefined> {
  if (!isbn) return undefined;

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    );
    const data = await response.json();

    if (data.items && data.items[0]?.volumeInfo?.categories) {
      const category = data.items[0].volumeInfo.categories[0];

      // Map Google Books categories to our genre list
      const genreMapping: Record<string, string> = {
        'fiction': 'fiction',
        'literary fiction': 'fiction',
        'science fiction': 'science-fiction',
        'fantasy': 'fantasy',
        'mystery': 'mystery',
        'thriller': 'mystery',
        'romance': 'romance',
        'biography': 'biography',
        'autobiography': 'biography',
        'history': 'history',
        'self-help': 'self-help',
        'business': 'business',
        'non-fiction': 'non-fiction'
      };

      const lowerCategory = category.toLowerCase();
      for (const [key, value] of Object.entries(genreMapping)) {
        if (lowerCategory.includes(key)) {
          return value;
        }
      }

      return 'other';
    }
  } catch (error) {
    console.error('Error fetching genre from Google Books:', error);
  }
  return undefined;
}

// POST - Update missing genres for books (in batches to avoid timeout)
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

    // Get books with missing genres (limit to 25 per request to avoid timeout)
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id, isbn, genre, title')
      .eq('library_id', library.id)
      .or('genre.is.null,genre.eq.')
      .limit(25);

    if (booksError) {
      return NextResponse.json({ error: booksError.message }, { status: 500 });
    }

    // Check total remaining
    const { count: totalRemaining } = await supabase
      .from('books')
      .select('id', { count: 'exact', head: true })
      .eq('library_id', library.id)
      .or('genre.is.null,genre.eq.');

    let updatedCount = 0;
    let failedCount = 0;
    const failedBooks: string[] = [];
    let consecutiveFailures = 0;

    // Process each book with missing genre
    for (const book of books || []) {
      // Stop if we've hit too many consecutive failures (likely rate limited)
      if (consecutiveFailures >= 10) {
        console.log('Stopping: Too many consecutive failures, likely rate limited');
        break;
      }

      if (book.isbn) {
        try {
          const genre = await fetchGenreFromGoogle(book.isbn);

          if (genre) {
            // Update the book with the fetched genre
            const { error: updateError } = await supabase
              .from('books')
              .update({
                genre,
                updated_at: new Date().toISOString()
              })
              .eq('id', book.id);

            if (updateError) {
              console.error(`Failed to update genre for book ${book.id}:`, updateError);
              failedCount++;
              failedBooks.push(book.title);
              consecutiveFailures++;
            } else {
              updatedCount++;
              consecutiveFailures = 0; // Reset on success
            }
          } else {
            failedCount++;
            failedBooks.push(book.title);
            consecutiveFailures++;
          }

          // Longer delay to respect rate limits (2 seconds)
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error processing book ${book.id}:`, error);
          failedCount++;
          failedBooks.push(book.title);
          consecutiveFailures++;
        }
      } else {
        failedCount++;
        failedBooks.push(book.title);
        // Don't count "no ISBN" as consecutive API failure
      }
    }

    return NextResponse.json({
      message: `Updated ${updatedCount} books. ${failedCount} books couldn't be updated.`,
      updatedCount,
      failedCount,
      totalProcessed: (books || []).length,
      totalRemaining: (totalRemaining || 0) - updatedCount,
      hasMore: ((totalRemaining || 0) - updatedCount) > 0,
      failedBooks: failedBooks.slice(0, 5) // Return first 5 failed books
    }, { status: 200 });

  } catch (error) {
    console.error('POST /api/books/update-genres error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
