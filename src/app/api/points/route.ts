import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { pointsService } from '@/lib/services/points.service';

export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [points, transactions] = await Promise.all([
      pointsService.getUserPoints(),
      pointsService.getUserTransactions(50),
    ]);

    return NextResponse.json({ 
      points,
      transactions 
    });
  } catch (error) {
    console.error('Error in GET /api/points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, planSlug } = body;

    if (action === 'redeem') {
      if (!planSlug) {
        return NextResponse.json({ error: 'Plan slug is required' }, { status: 400 });
      }

      const result = await pointsService.redeemPoints(planSlug);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: result.message 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in POST /api/points:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}