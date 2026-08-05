import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { luckySpinService } from '@/lib/services/lucky-spin.service';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient(request);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await luckySpinService.spin();

    if (!result.success) {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      reward: result.reward 
    });
  } catch (error) {
    console.error('Error in POST /api/points/spin:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient(request);
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [canSpin, availablePoints, spinHistory] = await Promise.all([
      luckySpinService.canSpin(),
      luckySpinService.getAvailablePoints(),
      luckySpinService.getSpinHistory(20),
    ]);

    return NextResponse.json({ 
      canSpin,
      availablePoints,
      spinHistory,
      spinCost: luckySpinService.SPIN_COST,
    });
  } catch (error) {
    console.error('Error in GET /api/points/spin:', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}