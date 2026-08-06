import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { notificationService } from '@/lib/services/notification.service';
import { authenticateAdmin } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('is_read');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Authenticate admin
    const auth = await authenticateAdmin(request);
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    // Create admin client with SERVICE_ROLE_KEY
    const adminSupabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const result = await notificationService.getAllNotifications(adminSupabase, {
      is_read: isRead ? isRead === 'true' : undefined,
      type: type as any || undefined,
      search: search || undefined,
      page,
      limit,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      notifications: result.notifications,
      total: result.total,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Authenticate admin
    const auth = await authenticateAdmin(request);
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
    }

    // Create admin client with SERVICE_ROLE_KEY
    const adminSupabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    if (action === 'broadcast') {
      const { title, message, type, action_url, data, recipient_type, plan_slug, user_ids } = body;

      if (!title || !message || !type || !recipient_type) {
        return NextResponse.json({ 
          success: false, 
          error: 'Title, message, type, and recipient_type are required' 
        }, { status: 400 });
      }

      const result = await notificationService.broadcastNotification(adminSupabase, {
        title,
        message,
        type,
        action_url,
        data,
        recipient_type,
        plan_slug,
        user_ids,
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Broadcast sent to ${result.count} users`,
        count: result.count 
      });
    }

    if (action === 'send-user') {
      const { user_id, title, message, type, action_url, data } = body;

      if (!user_id || !title || !message || !type) {
        return NextResponse.json({ 
          success: false, 
          error: 'User ID, title, message, and type are required' 
        }, { status: 400 });
      }

      const result = await notificationService.sendUserNotification(adminSupabase, {
        user_id,
        title,
        message,
        type,
        action_url,
        data,
      });

      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Notification sent successfully',
        notification: result.notification 
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}