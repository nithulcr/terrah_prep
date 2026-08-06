import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { authenticateAdmin } from '@/lib/supabase/server';
import { questionReportsService } from '@/lib/services/question-reports.service';

export async function GET(request: Request) {
  try {
    console.log('=== Admin API: GET /api/admin/question-reports ===');
    
    // First authenticate using anon client
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

    // Create admin client with SERVICE_ROLE_KEY to bypass RLS
    const adminSupabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    console.log('Admin API: Using SERVICE_ROLE_KEY - bypassing RLS');

    // Get query parameters
    const url = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    console.log('Admin API: Query params:', { status, search, page, limit });
    console.log('Admin API: Calling getAllReports - expecting ALL reports from database');

    const result = await questionReportsService.getAllReports(adminSupabase, {
      status,
      search,
      page,
      limit,
    });

    console.log('Admin API: Service result:', { 
      success: result.success, 
      reportsCount: result.reports?.length || 0,
      total: result.total,
      error: result.error,
      reportIds: result.reports?.map(r => r.id),
      reportUserIds: result.reports?.map(r => r.user_id)
    });
    
    // Additional logging
    console.log('Reports returned:', result.reports?.length || 0);
    console.log('Report data:', result.reports);

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