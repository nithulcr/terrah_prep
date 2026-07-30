'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Badge, Input, Textarea } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/use-auth';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Plan } from '@/types';

export default function AdminPlansPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    duration_days: 30,
    daily_question_limit: 0,
    monthly_mock_test_limit: 0,
    lifetime_question_limit: 0,
    allow_result_history: false,
    allow_pdf_download: false,
    allow_analytics: false,
    allow_bookmarks: false,
    allow_review_answers: false,
    allow_performance_dashboard: false,
    priority_support: false,
    is_active: true,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data: plansData } = await supabase
        .from('plans')
        .select('*')
        .order('price');

      if (plansData) {
        setPlans(plansData);
      }
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price: plan.price,
      duration_days: plan.duration_days || 30,
      daily_question_limit: plan.daily_question_limit || 0,
      monthly_mock_test_limit: plan.monthly_mock_test_limit || 0,
      lifetime_question_limit: plan.lifetime_question_limit || 0,
      allow_result_history: plan.allow_result_history,
      allow_pdf_download: plan.allow_pdf_download,
      allow_analytics: plan.allow_analytics,
      allow_bookmarks: plan.allow_bookmarks,
      allow_review_answers: plan.allow_review_answers,
      allow_performance_dashboard: plan.allow_performance_dashboard,
      priority_support: plan.priority_support,
      is_active: plan.is_active,
    });
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      duration_days: 30,
      daily_question_limit: 0,
      monthly_mock_test_limit: 0,
      lifetime_question_limit: 0,
      allow_result_history: false,
      allow_pdf_download: false,
      allow_analytics: false,
      allow_bookmarks: false,
      allow_review_answers: false,
      allow_performance_dashboard: false,
      priority_support: false,
      is_active: true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        return;
      }

      const url = editingPlan 
        ? `/api/admin/plans/${editingPlan.id}`
        : '/api/admin/plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to save plan' });
        return;
      }

      setMessage({ type: 'success', text: editingPlan ? 'Plan updated successfully' : 'Plan created successfully' });
      setShowForm(false);
      await loadPlans();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save plan' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'Not authenticated' });
        return;
      }

      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to delete plan' });
        return;
      }

      setMessage({ type: 'success', text: 'Plan deleted successfully' });
      await loadPlans();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete plan' });
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 pt-20">
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Plan Management
              </h1>
              <p className="mt-3 text-lg text-slate-600">
                Create and manage subscription plans
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {message && (
          <div className={`mb-6 rounded-lg p-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {showForm && (
          <Card className="mb-6">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Plan Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Slug</label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Price (₹)</label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Duration (Days)</label>
                    <Input
                      type="number"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Daily Question Limit</label>
                    <Input
                      type="number"
                      value={formData.daily_question_limit}
                      onChange={(e) => setFormData({ ...formData, daily_question_limit: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Monthly Mock Test Limit</label>
                    <Input
                      type="number"
                      value={formData.monthly_mock_test_limit}
                      onChange={(e) => setFormData({ ...formData, monthly_mock_test_limit: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700">Lifetime Question Limit</label>
                    <Input
                      type="number"
                      value={formData.lifetime_question_limit}
                      onChange={(e) => setFormData({ ...formData, lifetime_question_limit: Number(e.target.value) })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Features</label>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {Object.keys(formData).filter(key => key.startsWith('allow_') || key === 'priority_support').map((key) => (
                        <label key={key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData[key as keyof typeof formData] as boolean}
                            onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <span className="text-sm text-slate-700">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-medium text-slate-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Plan'}
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        <div className="grid gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="border border-slate-200 shadow-sm">
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {plan.name}
                      </h3>
                      <Badge variant={plan.is_active ? 'success' : 'danger'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {plan.description || 'No description'}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="font-semibold text-blue-600">₹{plan.price}</span>
                      <span className="text-slate-600">{plan.duration_days} days</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {plan.allow_result_history && <Badge variant="info">Results</Badge>}
                      {plan.allow_pdf_download && <Badge variant="info">PDF</Badge>}
                      {plan.allow_analytics && <Badge variant="info">Analytics</Badge>}
                      {plan.allow_bookmarks && <Badge variant="info">Bookmarks</Badge>}
                      {plan.allow_review_answers && <Badge variant="info">Review</Badge>}
                      {plan.allow_performance_dashboard && <Badge variant="info">Dashboard</Badge>}
                      {plan.priority_support && <Badge variant="warning">Priority Support</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(plan)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}