'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Badge, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth/use-auth';
import { supabase } from '@/lib/supabase/client';
import { Bell, Search, Filter, Trash2, Check, CheckCheck, AlertCircle } from 'lucide-react';
import UserLayout from '@/app/user-layout';
import Link from 'next/link';

type FilterType = 'all' | 'unread' | 'read';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, filter, searchQuery, page]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return;
      }

      const params = new URLSearchParams({
        ...(filter !== 'all' && { is_read: filter === 'read' ? 'true' : 'false' }),
        ...(searchQuery && { search: searchQuery }),
        page: page.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications || []);
        setTotal(data.total || 0);
        setUnreadCount(data.unread || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark-read',
          notification_id: notificationId,
        }),
      });

      loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setSubmitting(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark-all-read',
        }),
      });

      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (notificationId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      case 'reward':
        return <Check className="h-5 w-5 text-green-600" />;
      case 'subscription':
        return <Bell className="h-5 w-5 text-purple-600" />;
      case 'payment':
        return <Check className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <UserLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
            <p className="mt-2 text-slate-600">
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={handleMarkAllAsRead}
              disabled={submitting}
              variant="outline"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="border border-slate-200 shadow-sm mb-6">
          <CardBody className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => { setFilter('all'); setPage(1); }}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'unread' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => { setFilter('unread'); setPage(1); }}
                >
                  Unread
                </Button>
                <Button
                  variant={filter === 'read' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => { setFilter('read'); setPage(1); }}
                >
                  Read
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No notifications</h3>
              <p className="text-slate-600">
                {filter === 'all' ? 'You have no notifications yet.' : `No ${filter} notifications found.`}
              </p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`border shadow-sm transition-all ${
                  !notification.is_read ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'
                }`}
              >
                <CardBody className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-slate-900">
                            {notification.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {notification.message}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                            <Badge variant="info" size="sm">
                              {notification.type}
                            </Badge>
                            {!notification.is_read && (
                              <Badge variant="info" size="sm">New</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(notification.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </UserLayout>
  );
}