'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardBody, Badge, Input } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { Plan } from '@/types';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    duration_days: '',
    daily_question_limit: '',
    monthly_mock_test_limit: '',
    lifetime_question_limit: '',
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
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) {
        console.error('Error loading plans:', error);
        return;
      }

      setPlans((data ?? []) as Plan[]);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const planData = {
        name: formData.name,
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        description: formData.description,
        price: parseFloat(formData.price) || 0,
        duration_days: formData.duration_days ? parseInt(formData.duration_days) : null,
        daily_question_limit: formData.daily_question_limit ? parseInt(formData.daily_question_limit) : null,
        monthly_mock_test_limit: formData.monthly_mock_test_limit ? parseInt(formData.monthly_mock_test_limit) : null,
        lifetime_question_limit: formData.lifetime_question_limit ? parseInt(formData.lifetime_question_limit) : null,
        allow_result_history: formData.allow_result_history,
        allow_pdf_download: formData.allow_pdf_download,
        allow_analytics: formData.allow_analytics,
        allow_bookmarks: formData.allow_bookmarks,
        allow_review_answers: formData.allow_review_answers,
        allow_performance_dashboard: formData.allow_performance_dashboard,
        priority_support: formData.priority_support,
        is_active: formData.is_active,
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', editingPlan.id);

        if (error) {
          alert('Failed to update plan');
          return;
        }
      } else {
        const { error } = await supabase
          .from('plans')
          .insert(planData);

        if (error) {
          alert('Failed to create plan');
          return;
        }
      }

      resetForm();
      loadPlans();
    } catch (error) {
      alert('Failed to save plan');
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      slug: plan.slug,
      description: plan.description || '',
      price: plan.price.toString(),
      duration_days: plan.duration_days?.toString() || '',
      daily_question_limit: plan.daily_question_limit?.toString() || '',
      monthly_mock_test_limit: plan.monthly_mock_test_limit?.toString() || '',
      lifetime_question_limit: plan.lifetime_question_limit?.toString() || '',
      allow_result_history: plan.allow_result_history,
      allow_pdf_download: plan.allow_pdf_download,
      allow_analytics: plan.allow_analytics,
      allow_bookmarks: plan.allow_bookmarks,
      allow_review_answers: plan.allow_review_answers,
      allow_performance_dashboard: plan.allow_performance_dashboard,
      priority_support: plan.priority_support,
      is_active: plan.is_active,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this plan?')) {
      return;
    }

    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', planId);

    if (error) {
      alert('Failed to delete plan');
      return;
    }

    loadPlans();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: '',
      duration_days: '',
      daily_question_limit: '',
      monthly_mock_test_limit: '',
      lifetime_question_limit: '',
      allow_result_history: false,
      allow_pdf_download: false,
      allow_analytics: false,
      allow_bookmarks: false,
      allow_review_answers: false,
      allow_performance_dashboard: false,
      priority_support: false,
      is_active: true,
    });
    setEditingPlan(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-slate-600">Loading plans...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-12 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Manage Plans
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Create and manage subscription plans
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Plan
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="mb-8 border border-slate-200 shadow-sm">
            <CardBody className="p-6">
              <h2 className="mb-4 text-2xl font-bold text-slate-950">
                {editingPlan ? 'Edit Plan' : 'Add New Plan'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Plan Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                  <Input
                    label="Price (₹)"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                  <Input
                    label="Duration (days, leave empty for unlimited)"
                    type="number"
                    value={formData.duration_days}
                    onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                  />
                  <Input
                    label="Daily Question Limit (leave empty for unlimited)"
                    type="number"
                    value={formData.daily_question_limit}
                    onChange={(e) => setFormData({ ...formData, daily_question_limit: e.target.value })}
                  />
                  <Input
                    label="Monthly Mock Test Limit (leave empty for unlimited)"
                    type="number"
                    value={formData.monthly_mock_test_limit}
                    onChange={(e) => setFormData({ ...formData, monthly_mock_test_limit: e.target.value })}
                  />
                  <Input
                    label="Lifetime Question Limit (leave empty for unlimited)"
                    type="number"
                    value={formData.lifetime_question_limit}
                    onChange={(e) => setFormData({ ...formData, lifetime_question_limit: e.target.value })}
                  />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allow_result_history}
                      onChange={(e) => setFormData({ ...formData, allow_result_history: e.target.checked })}
                    />
                    <span className="text-sm text-slate-700">Allow Result History</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allow_pdf_download}
                      onChange={(e) => setFormData({ ...formData, allow_pdf_download: e.target.checked })}
                    />
                    <span className="text-sm text-slate-700">Allow PDF Download</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allow_analytics}
                      onChange={(e) => setFormData({ ...formData, allow_analytics: e.target.checked })}
                    />
                    <span className="text-sm text-slate-700">Allow Analytics</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allow_bookmarks}
                      onChange={(e) => setFormData({ ...formData, allow_bookmarks: e.target.checked })}
                    />
                    <span className="text-sm text-slate-700">Allow Bookmarks</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allow_review_answers}
                      onChange={(e) => setFormData({ ...formData, allow_review_answers: e.target.checked })}
                    />
                    <span className="text-sm text-slate-700">Allow Review Answers</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allow_performance_dashboard}
                      onChange={(e) => setFormData({ ...formData, allow_performance_dashboard: e.target.checked })}
                    />
                    <span className="text-sm text-slate-700">Allow Performance Dashboard</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.priority_support}
                      onChange={(e) => setFormData({ ...formData, priority_support: e.target.checked })}
                    />
                    <span className="text-sm text-slate-700">Priority Support</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    <span className="text-sm text-slate-700">Active</span>
                  </label>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button type="submit">
                    <Check className="mr-2 h-4 w-4" />
                    {editingPlan ? 'Update' : 'Create'} Plan
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        )}

        {/* Plans List */}
        <div className="grid gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="border border-slate-200 shadow-sm">
              <CardBody className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-slate-900">{plan.name}</h3>
                      <Badge variant={plan.is_active ? 'success' : 'warning'}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <code className="rounded bg-slate-100 px-2 py-1 text-sm text-slate-700">
                        {plan.slug}
                      </code>
                    </div>
                    <p className="mt-2 text-slate-600">{plan.description}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                      <span><strong>Price:</strong> ₹{plan.price}</span>
                      <span><strong>Duration:</strong> {plan.duration_days ? `${plan.duration_days} days` : 'Unlimited'}</span>
                      <span><strong>Daily Questions:</strong> {plan.daily_question_limit ?? 'Unlimited'}</span>
                      <span><strong>Monthly Tests:</strong> {plan.monthly_mock_test_limit ?? 'Unlimited'}</span>
                      <span><strong>Lifetime Questions:</strong> {plan.lifetime_question_limit ?? 'Unlimited'}</span>
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