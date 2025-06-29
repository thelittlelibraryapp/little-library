import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase with service role key for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    console.log('=== API DEBUG START ===');
    console.log('supabaseUrl:', supabaseUrl);
    console.log('supabaseServiceKey exists:', !!supabaseServiceKey);
    
    if (!supabaseServiceKey) {
      console.log('ERROR: No service role key found');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email, message, userId } = await request.json();
    
    console.log('Request data:', { email, message, userId });
    
    // For now, we'll get userId from the request body
    if (!userId) {
      console.log('ERROR: No userId provided');
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    console.log('Looking up user with ID:', userId);

    // Get current user info
    const { data: inviter, error: userError } = await supabase
      .from('users')
      .select('first_name, last_name, email')
      .eq('id', userId)
      .single();

    console.log('User lookup result:', { inviter, userError });

    if (!inviter || userError) {
      console.log('ERROR: User not found or error:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    console.log('User found:', inviter);

    // Check if user exists
    const { data: inviteeUser } = await supabase
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('email', email.toLowerCase())
      .single();

    console.log('Invitee lookup result:', inviteeUser);

    if (inviteeUser) {
      console.log('Invitee exists, checking for existing invitation...');
      
      // User exists - send direct invitation
      const { data: existingInvite } = await supabase
        .from('library_invitations')
        .select('id')
        .eq('inviter_id', userId)
        .eq('invitee_id', inviteeUser.id)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        console.log('Existing invitation found');
        return NextResponse.json({ error: 'Invitation already sent' }, { status: 400 });
      }

      console.log('Creating new invitation...');

      // Create invitation
      const invitationToken = crypto.randomUUID(); // Generate a unique token
      
      const { data: invitation, error } = await supabase
        .from('library_invitations')
        .insert({
          inviter_id: userId,
          invitee_id: inviteeUser.id,
          invitee_email: inviteeUser.email || email.toLowerCase(), // Add email for existing users too
          invitation_token: invitationToken,
          message: message || '',
          status: 'pending'
        })
        .select()
        .single();

      console.log('Invitation creation result:', { invitation, error });

      if (error) throw error;

      console.log('SUCCESS: Invitation created');
      return NextResponse.json({ 
        success: true, 
        invitation,
        message: `Invitation sent to ${inviteeUser.first_name}!` 
      });

    } else {
      console.log('Invitee does not exist, creating email invitation...');
      
      // User doesn't exist - send email invitation
      const invitationToken = crypto.randomUUID(); // Generate a unique token
      
      const { data: invitation, error } = await supabase
        .from('library_invitations')
        .insert({
          inviter_id: userId,
          invitee_email: email.toLowerCase(),
          invitation_token: invitationToken,
          message: message || '',
          status: 'pending'
        })
        .select()
        .single();

      console.log('Email invitation result:', { invitation, error });

      if (error) throw error;

      console.log('SUCCESS: Email invitation created');
      return NextResponse.json({ 
        success: true, 
        invitation,
        message: `Invitation sent to ${email}! They'll get an email to join.` 
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Get invitations sent by this user
    const { data: sentInvitations } = await supabase
      .from('library_invitations')
      .select(`
        id,
        invitee_email,
        message,
        status,
        created_at,
        invitee:invitee_id(first_name, last_name, email)
      `)
      .eq('inviter_id', userId)
      .order('created_at', { ascending: false });

    // Get invitations received by this user
    const { data: receivedInvitations } = await supabase
      .from('library_invitations')
      .select(`
        id,
        message,
        status,
        created_at,
        inviter:inviter_id(first_name, last_name, email)
      `)
      .eq('invitee_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({ 
      sent: sentInvitations || [],
      received: receivedInvitations || []
    });

  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
  }
}