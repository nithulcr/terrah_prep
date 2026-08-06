'use client';

import { useState } from 'react';
import { Card, CardBody, Button, Input, Textarea, Select } from '@/components/ui';
import { useAuth } from '@/lib/auth/use-auth';
import { supabase } from '@/lib/supabase/client';
import { Send, Users, UserCheck } from 'lucide-react';
import AdminLayout from '@/app/admin/layout';

type RecipientType = 'all' | 'plan' | 'specific';

export default function BroadcastNotificationPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const notificationTypes = [
    { value: 'system', label: 'System' },
    { value: 'broadcast', label: 'Broadcast' },
    { value: 'message', label: 'Message' },
    { value: 'reward', label: 'Reward' },
  ];

  const [notificationType, setNotificationType] = useState('broadcast');

  const searchUsers = async (query: string) => {
    if (!query || query.length < 2) {
      setUsers([]);
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setResult({ success: false, message: 'Unauthorized' });
        return;
      }

      const body: any = {
        action: recipientType === 'specific' ? 'send-user' : 'broadcast',
        title,
        message,
        type: notificationType,
        recipient_type: recipientType,
      };

      if (recipientType === 'plan') {
        body.plan_slug = selectedPlan;
      } else if (recipientType === 'specific') {
        body.user_id = selectedUsers[0]; // Send to first selected user
      }

      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        setResult({ 
          success: true, 
          message: data.message || `Notification sent successfully to ${data.count || 1} user(s)` 
        });
        // Reset form
        setTitle('');
        setMessage('');
        setSelectedUsers([]);
        setUserSearch('');
      } else {
        setResult({ success: false, message: data.error || 'Failed to send notification' });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || 'Failed to send notification' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Send Notification</h1>
          <p className="mt-2 text-slate-600">
            Send notifications to users or broadcast to all users
          </p>
        </div>

        <Card className="border border-slate-200 shadow-sm">
          <CardBody className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Notification Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notification Type
                </label>
                <select
                  value={notificationType}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {notificationTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Title
                </label>
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Message
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter notification message"
                  rows={6}
                  required
                />
              </div>

              {/* Recipient Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Send To
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="all"
                      checked={recipientType === 'all'}
                      onChange={(e) => setRecipientType(e.target.value as RecipientType)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <Users className="h-4 w-4 text-slate-600" />
                    <span className="text-sm text-slate-700">All Users</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="plan"
                      checked={recipientType === 'plan'}
                      onChange={(e) => setRecipientType(e.target.value as RecipientType)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-sm text-slate-700">By Plan</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="specific"
                      checked={recipientType === 'specific'}
                      onChange={(e) => setRecipientType(e.target.value as RecipientType)}
                      className="h-4 w-4 text-blue-600"
                    />
                    <UserCheck className="h-4 w-4 text-slate-600" />
                    <span className="text-sm text-slate-700">Specific User</span>
                  </label>
                </div>
              </div>

              {/* Plan Selection */}
              {recipientType === 'plan' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Plan
                  </label>
                  <select
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a plan</option>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="elite">Elite</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              )}

              {/* User Selection */}
              {recipientType === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Search User
                  </label>
                  <Input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    placeholder="Search by email or name"
                  />
                  {users.length > 0 && (
                    <div className="mt-2 border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className={`p-3 hover:bg-slate-50 cursor-pointer ${
                            selectedUsers.includes(user.id) ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            if (selectedUsers.includes(user.id)) {
                              setSelectedUsers([]);
                            } else {
                              setSelectedUsers([user.id]);
                            }
                          }}
                        >
                          <p className="text-sm font-medium text-slate-900">
                            {user.full_name || user.email}
                          </p>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedUsers.length > 0 && (
                    <p className="mt-2 text-sm text-green-600">
                      Selected: {users.find(u => u.id === selectedUsers[0])?.email}
                    </p>
                  )}
                </div>
              )}

              {/* Result Message */}
              {result && (
                <div
                  className={`p-4 rounded-lg ${
                    result.success
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {result.message}
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
                size="lg"
              >
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Sending...' : 'Send Notification'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </AdminLayout>
  );
}