// File: src/app/api/friends/invite/[id]/route.ts
// Accept/Decline Invitation API

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action, userId } = await request.json();
    const invitationId = params.id;

    console.log('=== ACCEPT/DECLINE DEBUG ===');
    console.log('Invitation ID:', invitationId);
    console.log('Action:', action);
    console.log('User ID:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    // Get the invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('library_invitations')
      .select(`
        id,
        inviter_id,
        invitee_id,
        invitee_email,
        status,
        inviter:inviter_id(first_name, last_name, email, id)
      `)
      .eq('id', invitationId)
      .eq('status', 'pending')
      .single();

    console.log('Invitation lookup result:', { invitation, fetchError });

    if (fetchError || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    // Check if the current user is the invitee
    const isDirectInvitee = invitation.invitee_id === userId;
    const isEmailInvitee = !invitation.invitee_id && invitation.invitee_email;

    if (!isDirectInvitee && !isEmailInvitee) {
      return NextResponse.json({ error: 'Not authorized to respond to this invitation' }, { status: 403 });
    }

    console.log('User authorized to respond');

    // Update invitation status
    const { error: updateError } = await supabase
      .from('library_invitations')
      .update({ 
        status: action,
        responded_at: new Date().toISOString(),
        invitee_id: isEmailInvitee ? userId : invitation.invitee_id // Set invitee_id if it was an email invitation
      })
      .eq('id', invitationId);

    if (updateError) {
      console.log('Update error:', updateError);
      throw updateError;
    }

    console.log('Invitation status updated to:', action);

    if (action === 'accepted') {
      // Get libraries
      const { data: inviterLibrary } = await supabase
        .from('libraries')
        .select('id')
        .eq('owner_id', invitation.inviter_id)
        .single();

      const { data: currentUserLibrary } = await supabase
        .from('libraries')
        .select('id')
        .eq('owner_id', userId)
        .single();

      console.log('Libraries found:', { inviterLibrary, currentUserLibrary });

      if (inviterLibrary && currentUserLibrary) {
        // Add mutual library access
        const accessRecords = [
          {
            library_id: inviterLibrary.id,
            user_id: userId,
            access_level: 'borrower',
            granted_by: invitation.inviter_id,
            granted_at: new Date().toISOString(),
            is_active: true
          },
          {
            library_id: currentUserLibrary.id,
            user_id: invitation.inviter_id,
            access_level: 'borrower',
            granted_by: userId,
            granted_at: new Date().toISOString(),
            is_active: true
          }
        ];

        console.log('Creating library access records:', accessRecords);

        const { error: accessError } = await supabase
          .from('library_access')
          .insert(accessRecords);

        if (accessError) {
          console.log('Access error:', accessError);
          // Don't throw - invitation was still accepted
        }

        // Update friend counts
        const { error: countError } = await supabase.rpc('increment_friend_count', {
          library_ids: [inviterLibrary.id, currentUserLibrary.id]
        });

        if (countError) {
          console.log('Count update error (non-critical):', countError);
        }

        console.log('Mutual library access created');
      }

      return NextResponse.json({ 
        success: true, 
        message: `You're now friends with ${invitation.inviter.first_name}!`,
        newFriend: invitation.inviter
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Invitation declined' 
    });

  } catch (error) {
    console.error('Accept/decline invitation error:', error);
    return NextResponse.json({ error: 'Failed to respond to invitation' }, { status: 500 });
  }
}