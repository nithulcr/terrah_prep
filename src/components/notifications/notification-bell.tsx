'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Bell, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/use-auth';
import { supabase } from '@/lib/supabase/client';
import { notificationService } from '@/lib/services/notification.service';
import { Notification } from '@/types/notification';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadNotifications = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      const result = await notificationService.getNotifications(supabase, user!.id, {
        limit: 10,
      });

      if (result.success) {
        setNotifications(result.notifications || []);
        setUnreadCount(result.unread || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user, loadNotifications]);

  // Enable realtime notifications
  useEffect(() => {
    if (!user) return;

    console.log('Setting up realtime notifications for user:', user.id);

    // Create new channel with unique name
    const channelName = `notifications_${user.id}`;
    
    const channel = supabase.channel(channelName);
    
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      },
      (payload) => {
        console.log('New notification received:', payload);
        loadNotifications();
      }
    );

    const subscription = channel.subscribe();

    return () => {
      console.log('Cleaning up realtime notifications');
      subscription.unsubscribe();
    };
  }, [user, loadNotifications]);

  const handleMarkAsRead = async (notificationId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      await notificationService.markAsRead(supabase, notificationId, user!.id);
      loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (notificationId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) return;

      await notificationService.deleteNotification(supabase, notificationId, user!.id);
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'report':
        return '📋';
      case 'reward':
        return '🎁';
      case 'subscription':
        return '⭐';
      case 'payment':
        return '💳';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5 text-gray-700" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-white rounded-lg shadow-lg border border-slate-200 z-20 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto max-h-[400px]">
              {loading ? (
                <div className="p-4 text-center text-slate-500">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="mx-auto h-12 w-12 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                          {notification.action_url && (
                            <Link
                              href={notification.action_url}
                              className="text-xs text-blue-600 hover:text-blue-700 mt-2 inline-block"
                              onClick={() => setIsOpen(false)}
                            >
                              View details →
                            </Link>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.is_read && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="p-1 text-slate-600 hover:text-blue-600"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => handleDelete(notification.id, e)}
                            className="p-1 text-slate-600 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-slate-200">
                <Link
                  href="/notifications"
                  className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};