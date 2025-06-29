// File: src/app/api/achievements/route.ts (Enhanced Version)

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const ACHIEVEMENTS = {
  // Social Achievements
  'first_friend': { 
    name: 'Connector', 
    icon: '🤝', 
    description: 'Made your first friend connection',
    points: 10
  },
  'social_butterfly': { 
    name: 'Social Butterfly', 
    icon: '🦋', 
    description: 'Invited 5+ friends to join',
    points: 25
  },
  'network_builder': { 
    name: 'Network Builder', 
    icon: '🌐', 
    description: 'Connected with 10+ friends',
    points: 50
  },

  // Library Achievements
  'first_book': { 
    name: 'Library Starter', 
    icon: '📚', 
    description: 'Added your first book',
    points: 5
  },
  'book_collector': { 
    name: 'Book Collector', 
    icon: '📖', 
    description: 'Added 10+ books to your library',
    points: 20
  },
  'library_master': { 
    name: 'Library Master', 
    icon: '🏛️', 
    description: 'Built a library of 50+ books',
    points: 75
  },
  'genre_explorer': { 
    name: 'Genre Explorer', 
    icon: '🗺️', 
    description: 'Added books from 5+ different genres',
    points: 30
  },

  // Sharing Achievements
  'first_lend': { 
    name: 'Generous Spirit', 
    icon: '💝', 
    description: 'Lent your first book to a friend',
    points: 15
  },
  'generous_lender': { 
    name: 'Generous Lender', 
    icon: '🎁', 
    description: 'Lent 25+ books to friends',
    points: 40
  },
  'library_champion': { 
    name: 'Library Champion', 
    icon: '🏆', 
    description: 'Lent 100+ books to the community',
    points: 100
  },

  // Borrowing Achievements
  'first_borrow': { 
    name: 'Curious Reader', 
    icon: '🤓', 
    description: 'Borrowed your first book from a friend',
    points: 10
  },
  'book_explorer': { 
    name: 'Book Explorer', 
    icon: '🧭', 
    description: 'Borrowed books from 5+ different friends',
    points: 35
  },
  'voracious_reader': { 
    name: 'Voracious Reader', 
    icon: '📚', 
    description: 'Borrowed 50+ books total',
    points: 60
  },

  // Special Achievements
  'early_adopter': { 
    name: 'Early Adopter', 
    icon: '🌟', 
    description: 'One of the first 100 users!',
    points: 25
  },
  'perfect_borrower': { 
    name: 'Perfect Borrower', 
    icon: '⭐', 
    description: 'Returned 20+ books on time',
    points: 30
  },
  'isbn_wizard': { 
    name: 'ISBN Wizard', 
    icon: '🧙‍♂️', 
    description: 'Used ISBN lookup 10+ times',
    points: 15
  }
};

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', session.user.id)
      .order('earned_at', { ascending: false });

    // Add achievement details
    const enrichedAchievements = (achievements || []).map(achievement => ({
      ...achievement,
      ...ACHIEVEMENTS[achievement.achievement_type as keyof typeof ACHIEVEMENTS]
    }));

    // Calculate total points
    const totalPoints = enrichedAchievements.reduce((sum, achievement) => 
      sum + (achievement.points || 0), 0
    );

    // Get user's level (every 100 points = 1 level)
    const level = Math.floor(totalPoints / 100) + 1;
    const pointsToNextLevel = 100 - (totalPoints % 100);

    return NextResponse.json({ 
      achievements: enrichedAchievements,
      stats: {
        totalPoints,
        level,
        pointsToNextLevel,
        achievementCount: enrichedAchievements.length,
        availableAchievements: Object.keys(ACHIEVEMENTS).length
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { achievement_type, progress_data = {} } = await request.json();

    // Check if user already has this achievement
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('achievement_type', achievement_type)
      .single();

    if (existing) {
      return NextResponse.json({ message: 'Achievement already earned' });
    }

    // Award the achievement
    const { data: achievement, error } = await supabase
      .from('user_achievements')
      .insert({
        user_id: session.user.id,
        achievement_type,
        progress_data
      })
      .select()
      .single();

    if (error) throw error;

    // Update user's achievement count and points
    const achievementInfo = ACHIEVEMENTS[achievement_type as keyof typeof ACHIEVEMENTS];
    const points = achievementInfo?.points || 0;

    await supabase
      .from('users')
      .update({ 
        achievements_count: supabase.sql`achievements_count + 1`,
        total_points: supabase.sql`COALESCE(total_points, 0) + ${points}`
      })
      .eq('id', session.user.id);

    return NextResponse.json({ 
      achievement: {
        ...achievement,
        ...achievementInfo
      },
      newlyEarned: true,
      pointsEarned: points
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to award achievement' }, { status: 500 });
  }
}

// Utility function to check and award achievements
export async function checkAndAwardAchievements(userId: string, eventType: string, eventData: any = {}) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    // Get user stats for achievement checking
    const { data: userStats } = await supabase
      .from('users')
      .select(`
        id,
        achievements_count,
        libraries(
          id,
          friend_count,
          books(count)
        )
      `)
      .eq('id', userId)
      .single();

    const bookCount = userStats?.libraries?.[0]?.books?.length || 0;
    const friendCount = userStats?.libraries?.[0]?.friend_count || 0;

    const achievementsToAward = [];

    switch (eventType) {
      case 'book_added':
        if (bookCount === 1) achievementsToAward.push('first_book');
        if (bookCount === 10) achievementsToAward.push('book_collector');
        if (bookCount === 50) achievementsToAward.push('library_master');
        break;

      case 'friend_added':
        if (friendCount === 1) achievementsToAward.push('first_friend');
        if (friendCount === 10) achievementsToAward.push('network_builder');
        break;

      case 'invitation_sent':
        // Count total invitations sent
        const { count: inviteCount } = await supabase
          .from('library_invitations')
          .select('id', { count: 'exact' })
          .eq('inviter_id', userId);
        
        if (inviteCount === 5) achievementsToAward.push('social_butterfly');
        break;

      case 'first_lend':
        achievementsToAward.push('first_lend');
        break;

      case 'first_borrow':
        achievementsToAward.push('first_borrow');
        break;

      case 'isbn_lookup':
        // Track ISBN lookups in user progress
        const { count: isbnCount } = await supabase
          .from('user_achievements')
          .select('progress_data', { count: 'exact' })
          .eq('user_id', userId)
          .eq('achievement_type', 'isbn_wizard');
        
        if (!isbnCount && eventData.lookupCount >= 10) {
          achievementsToAward.push('isbn_wizard');
        }
        break;
    }

    // Award new achievements
    for (const achievementType of achievementsToAward) {
      await fetch('/api/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ achievement_type: achievementType })
      });
    }

    return achievementsToAward;

  } catch (error) {
    console.error('Achievement check failed:', error);
    return [];
  }
}