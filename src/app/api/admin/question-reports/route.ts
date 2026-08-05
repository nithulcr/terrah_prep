import { NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/supabase/server';
import { questionReportsService } from '@/lib/services/question-reports.service';

export async function GET(request: Request) {
  try {
    console.log('=== Admin API: GET /api/admin/question-reports ===');
    
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

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    console.log('Admin API: Query params:', { status, search, page, limit });

    const result = await questionReportsService.getAllReports(supabase, {
      status,
      search,
      page,
      limit,
    });

    console.log('Admin API: Service result:', { 
      success: result.success, 
      reportsCount: result.reports?.length || 0,
      total: result.total,
      error: result.error 
    });

    if (!result.success) {
      console.error('Admin API: Service failed:', result.debug);
      return NextResponse.json({ 
        success: false,
        error: result.error || 'Failed to fetch reports',
        debug: result.debug
      }, { status: 400 });
    }

    console.log('Admin API: Success - returning', result.reports?.length || 0, 'reports');
    
    return NextResponse.json({ 
      success: true,
      reports: result.reports || [],
      total: result.total || 0
    });
  } catch (error: any) {
    console.error('Admin API: Unexpected error in GET:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      debug: { message: error.message, stack: error.stack }
    }, { status: 500 });
  }
}