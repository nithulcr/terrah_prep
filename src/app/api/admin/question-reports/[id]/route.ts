import { NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/server';
import { questionReportsService } from '@/lib/services/question-reports.service';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== Admin API: PUT /api/admin/question-reports/[id] ===');
    
    // Use unified authentication helper
    const auth = await authenticateAdmin(request);
    
    if (auth.error) {
      console.error('Admin API: Auth failed:', auth.error);
      return NextResponse.json({ 
        success: false,
        error: auth.error,
        debug: { 
          userId: auth.user?.id,
          userEmail: auth.user?.email,
          profileId: auth.profile?.id,
          profileRole: auth.profile?.role
        }
      }, { status: auth.error === 'Unauthorized' ? 401 : 403 });
    }

    const supabase = auth.supabase;

    const body = await request.json();
    const { action, rewardPoints } = body;

    const reportId = parseInt(params.id);

    console.log('Admin API: Action request:', { reportId, action, rewardPoints });

    if (action === 'approve') {
      if (!rewardPoints || rewardPoints < 1) {
        return NextResponse.json({ 
          success: false,
          error: 'Reward points must be at least 1' 
        }, { status: 400 });
      }

      const result = await questionReportsService.approveReport(
        supabase,
        reportId,
        rewardPoints,
        auth.user.id
      );

      console.log('Admin API: Approve result:', { success: result.success, error: result.error });

      if (!result.success) {
        return NextResponse.json({ 
          success: false,
          error: result.error || 'Failed to approve report',
          debug: result.debug
        }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Report approved and points awarded successfully' 
      });
    } else if (action === 'reject') {
      const result = await questionReportsService.rejectReport(
        supabase,
        reportId,
        auth.user.id
      );

      console.log('Admin API: Reject result:', { success: result.success, error: result.error });

      if (!result.success) {
        return NextResponse.json({ 
          success: false,
          error: result.error || 'Failed to reject report',
          debug: result.debug
        }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Report rejected successfully' 
      });
    }

    return NextResponse.json({ 
      success: false,
      error: 'Invalid action' 
    }, { status: 400 });
  } catch (error: any) {
    console.error('Admin API: Unexpected error in PUT:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      debug: { message: error.message, stack: error.stack }
    }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('=== Admin API: GET /api/admin/question-reports/[id] ===');
    
    // Use unified authentication helper
    const auth = await authenticateAdmin(request);
    
    if (auth.error) {
      console.error('Admin API: Auth failed:', auth.error);
      return NextResponse.json({ 
        success: false,
        error: auth.error,
        debug: { 
          userId: auth.user?.id,
          userEmail: auth.user?.email,
          profileId: auth.profile?.id,
          profileRole: auth.profile?.role
        }
      }, { status: auth.error === 'Unauthorized' ? 401 : 403 });
    }

    const supabase = auth.supabase;

    const reportId = parseInt(params.id);

    console.log('Admin API: Fetching report details for ID:', reportId);

    const result = await questionReportsService.getReportById(supabase, reportId);

    console.log('Admin API: Service result:', { success: result.success, error: result.error });

    if (!result.success) {
      return NextResponse.json({ 
        success: false,
        error: result.error || 'Report not found',
        debug: result.debug
      }, { status: 404 });
    }

    console.log('Admin API: Success - returning report details');
    
    return NextResponse.json({ 
      success: true,
      report: result.report
    });
  } catch (error: any) {
    console.error('Admin API: Unexpected error in GET [id]:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      debug: { message: error.message, stack: error.stack }
    }, { status: 500 });
  }
}