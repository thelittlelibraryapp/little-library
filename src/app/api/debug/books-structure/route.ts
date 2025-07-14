import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get a sample book to see the structure
    const { data: sampleBook, error: sampleError } = await supabase
      .from('books')
      .select('*')
      .limit(1)
      .single();

    // Get user libraries to see the relationship
    const { data: libraries, error: librariesError } = await supabase
      .from('libraries')
      .select('*')
      .limit(5);

    return NextResponse.json({
      sampleBook,
      sampleError: sampleError?.message,
      libraries,
      librariesError: librariesError?.message
    });

  } catch (error) {
    console.error('Debug books structure error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}