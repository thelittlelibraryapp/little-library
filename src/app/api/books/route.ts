 
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to create Supabase client INSIDE the function
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  try {
    const supabase = createSupabaseClient(); // Create client INSIDE the function
    
    // Simple test response for now
    return NextResponse.json({ 
      success: true, 
      message: "Books API is working!",
      books: []
    });
  } catch (error) {
    return NextResponse.json({ error: 'API Error' }, { status: 500 });
  }
}