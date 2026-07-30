import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { testSetsService } from '@/lib/services/test-sets.service';

export async function POST(request: Request) {

  try {

    console.log('=== ADMIN: Generate Test Sets ===');

    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { 'Authorization': `Bearer ${token}` } },
      }
    );

    // Get current user
    console.log('ADMIN GENERATE QUERY: auth.getUser - BEFORE');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('ADMIN GENERATE QUERY: auth.getUser - AFTER', {
      hasUser: !!user,
      userId: user?.id,
      error: authError,
    });
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    console.log('ADMIN GENERATE QUERY: profiles select role - BEFORE', {
      userId: user.id,
    });
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    console.log('ADMIN GENERATE QUERY: profiles select role - AFTER', {
      role: profile?.role,
      error: profileError,
    });

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { batchId } = body;

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });
    }

    console.log('Generating test sets for batch:', batchId);
    console.log('Admin user:', user.email);
    console.log("SERVICE ROLE:", !!config.supabase.serviceRoleKey);
    console.log(
      "SERVICE ROLE PREFIX:",
      config.supabase.serviceRoleKey?.substring(0, 20)
    );
if (!config.supabase.serviceRoleKey?.length) {
    console.log("No Service Role Key → Using RPC");

    const { data: rpcData, error: rpcError } = await supabase.rpc(
        "admin_generate_test_sets_for_batch",
        { p_batch_id: Number(batchId) }
    );

    if (rpcError) {
        console.error(rpcError);

        return NextResponse.json(
            {
                error: rpcError.message,
                details: rpcError.details,
                hint: rpcError.hint,
            },
            { status: 500 }
        );
    }

    const result = Array.isArray(rpcData)
        ? rpcData[0]
        : rpcData;

    return NextResponse.json({
        success: true,
        testSetsCreated: Number(result.test_sets_created),
        questionsAssigned: Number(result.questions_assigned),
    });
}

console.log("Using Service Role Client");
const adminSupabase = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

const result = await testSetsService.generateTestSetsForBatch(
    adminSupabase,
    Number(batchId)
);
    if (!result.success) {
      console.error('Failed to generate test sets:', result.error);
      return NextResponse.json({
        error: result.error || 'Failed to generate test sets'
      }, { status: 500 });
    }

    console.log('Test sets generated successfully:', result);

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${result.testSetsCreated} test sets with ${result.questionsAssigned} questions`,
      testSetsCreated: result.testSetsCreated,
      questionsAssigned: result.questionsAssigned,
    });

  } catch (error) {
    console.error('Error in generate test sets API:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
