import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';
import { notificationService } from '@/lib/services/notification.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('is_read');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user from session
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await notificationService.getNotifications(supabase, user.id, {
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
      unread: result.unread,
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, notification_id } = body;

    // Get user from session
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'mark-read') {
      const result = await notificationService.markAsRead(supabase, notification_id, user.id);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'mark-all-read') {
      const result = await notificationService.markAllAsRead(supabase, user.id);
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, count: result.count });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = parseInt(searchParams.get('id') || '0');

    if (!notificationId) {
      return NextResponse.json({ success: false, error: 'Notification ID required' }, { status: 400 });
    }

    // Get user from session
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const result = await notificationService.deleteNotification(supabase, notificationId, user.id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}