'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody, Button, Badge, Textarea, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth/use-auth';
import { supabase } from '@/lib/supabase/client';
import { QuestionReport } from '@/types';
import { CheckCircle, XCircle, Eye, Search, Filter } from 'lucide-react';
import AdminLayout from '@/app/admin/layout';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminQuestionReportsPage() {
  const { user, profile } = useAuth();
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<QuestionReport | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [rewardPoints, setRewardPoints] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Edited question fields
  const [editedQuestion, setEditedQuestion] = useState('');
  const [editedOptionA, setEditedOptionA] = useState('');
  const [editedOptionB, setEditedOptionB] = useState('');
  const [editedOptionC, setEditedOptionC] = useState('');
  const [editedOptionD, setEditedOptionD] = useState('');
  const [editedCorrectOption, setEditedCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [editedExplanation, setEditedExplanation] = useState('');
  const [editedCategoryId, setEditedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<Array<{id: number; name: string}>>([]);

  useEffect(() => {
    if (user) {
      loadReports();
      loadCategories();
    }
  }, [user, filter, searchQuery, page]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        status: filter,
        ...(searchQuery && { search: searchQuery }),
        page: page.toString(),
        limit: '20',
      });

      console.log('Admin: Loading reports from /api/admin/question-reports');
      
      // Get session for Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setError('No session found. Please login again.');
        return;
      }
      
      const response = await fetch(`/api/admin/question-reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      console.log('Admin: Response received:', { success: data.success, error: data.error, debug: data.debug });

      if (!data.success) {
        const errorMsg = data.error || 'Failed to load reports';
        setError(errorMsg);
        console.error('Failed to load reports:', data.debug || data.error);
        return;
      }

      setReports(data.reports || []);
      setTotal(data.total || 0);
      console.log('Admin: Loaded', data.reports?.length || 0, 'reports');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load reports';
      setError(errorMsg);
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = async (report: QuestionReport) => {
    // Comprehensive logging
    console.log('REPORT OBJECT', report);
    console.log('Report ID:', report?.id);
    console.log('Report ID type:', typeof report?.id);
    
    // Validate report.id - MUST be a valid number from question_reports.id
    if (!report || !report.id) {
      console.error('Missing report or report.id', { report, reportId: report?.id });
      alert('Invalid report. Cannot load report details.');
      return;
    }

    const reportId = report.id;
    console.log('Using reportId:', reportId);
    
    if (!Number.isFinite(reportId) || reportId <= 0) {
      console.error('Invalid report id', { reportId, report });
      alert('Invalid report ID. Cannot load report details.');
      return;
    }

    try {
      const fetchUrl = `/api/admin/question-reports/${reportId}`;
      console.log('Fetching:', fetchUrl);
      
      // Get session for Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('No session found. Please login again.');
        return;
      }
      
      const response = await fetch(fetchUrl, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      console.log('Admin: Report detail response:', { success: data.success, error: data.error });

      if (!data.success) {
        alert(data.error || 'Failed to load report details');
        console.error('Failed to load report:', data.debug);
        return;
      }

      setSelectedReport(data.report);
      
      // Initialize edited fields with current values
      if (data.report.question) {
        setEditedQuestion(data.report.question.question || '');
        setEditedOptionA(data.report.question.option_a || '');
        setEditedOptionB(data.report.question.option_b || '');
        setEditedOptionC(data.report.question.option_c || '');
        setEditedOptionD(data.report.question.option_d || '');
        setEditedCorrectOption(data.report.question.correct_option || 'A');
        setEditedExplanation(data.report.question.explanation || '');
        setEditedCategoryId(data.report.question.category?.id || null);
      }
      
      setShowModal(true);
      setAction(null);
      console.log('Admin: Report details loaded');
    } catch (err: any) {
      alert(err.message || 'Failed to load report details');
      console.error('Error loading report:', err);
    }
  };

  const handleDelete = async (report: QuestionReport) => {
    if (!report.id || isNaN(report.id)) {
      alert('Invalid report ID. Cannot delete.');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete Report #${report.id}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setSubmitting(true);
    try {
      console.log('Admin: Deleting report:', report.id);
      
      // Get session for Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('No session found. Please login again.');
        return;
      }
      
      const response = await fetch(`/api/admin/question-reports/${report.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();
      console.log('Admin: Delete response:', { success: data.success, error: data.error });

      if (!data.success) {
        alert(data.error || 'Failed to delete report');
        console.error('Delete failed:', data.debug);
        return;
      }

      alert('Report deleted successfully');
      await loadReports();
      console.log('Admin: Report deleted successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to delete report');
      console.error('Error deleting report:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async () => {
    if (!selectedReport || !action) return;

    // Validate report ID
    if (!selectedReport.id || isNaN(selectedReport.id)) {
      alert('Invalid report ID. Cannot process action.');
      return;
    }

    setSubmitting(true);
    try {
      console.log('Admin: Submitting action:', action, 'for report:', selectedReport.id);
      
      // Get session for Authorization header
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        alert('No session found. Please login again.');
        return;
      }
      
      const requestBody: any = {
        action,
        rewardPoints: action === 'approve' ? rewardPoints : undefined,
      };

      // If approving and question was edited, include the updated question data
      if (action === 'approve' && selectedReport.question) {
        const hasEdits = 
          editedQuestion !== selectedReport.question.question ||
          editedOptionA !== selectedReport.question.option_a ||
          editedOptionB !== selectedReport.question.option_b ||
          editedOptionC !== selectedReport.question.option_c ||
          editedOptionD !== selectedReport.question.option_d ||
          editedCorrectOption !== selectedReport.question.correct_option ||
          editedExplanation !== selectedReport.question.explanation ||
          editedCategoryId !== selectedReport.question.category?.id;

        if (hasEdits) {
          requestBody.updatedQuestion = {
            id: selectedReport.question_id,
            question: editedQuestion,
            option_a: editedOptionA,
            option_b: editedOptionB,
            option_c: editedOptionC,
            option_d: editedOptionD,
            correct_option: editedCorrectOption,
            explanation: editedExplanation,
            category_id: editedCategoryId,
          };
        }
      }
      
      const response = await fetch(`/api/admin/question-reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Admin: Action response:', { success: data.success, error: data.error, message: data.message });

      if (!data.success) {
        setError(data.error || 'Failed to process action');
        console.error('Action failed:', data.debug);
        return;
      }

      setSuccessMessage(data.message);
      setShowModal(false);
      await loadReports();
      console.log('Admin: Action completed successfully');
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to process action');
      console.error('Error handling action:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'approved':
        return <Badge variant="success">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      wrong_answer: 'Wrong Answer',
      wrong_question: 'Wrong Question',
      wrong_explanation: 'Wrong Explanation',
      typo: 'Typo',
      duplicate: 'Duplicate',
      image_issue: 'Image Issue',
      other: 'Other',
    };
    return labels[reason] || reason;
  };

  const totalPages = Math.ceil(total / 20);

  return (
     <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
           Question Reports
          </h1>
          <p className="mt-3 text-lg text-slate-600">
           Review and manage user-submitted question reports
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        
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
                  variant={filter === 'pending' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => { setFilter('pending'); setPage(1); }}
                >
                  Pending
                </Button>
                <Button
                  variant={filter === 'approved' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => { setFilter('approved'); setPage(1); }}
                >
                  Approved
                </Button>
                <Button
                  variant={filter === 'rejected' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => { setFilter('rejected'); setPage(1); }}
                >
                  Rejected
                </Button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                  className="pl-10"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <button 
              onClick={() => setError(null)}
              className="mt-2 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Success Message Display */}
        {successMessage && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800">
            <p className="font-semibold">Success:</p>
            <p>{successMessage}</p>
          </div>
        )}

        {/* Reports List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded animate-pulse"></div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card className="border border-slate-200 shadow-sm">
            <CardBody className="p-12 text-center">
              <Filter className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No reports found</h3>
              <p className="text-slate-600">
                {filter === 'all' ? 'No question reports have been submitted yet.' : `No ${filter} reports found.`}
              </p>
            </CardBody>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardBody className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Report #{report.id}
                          </h3>
                          {getStatusBadge(report.status)}
                          {report.reward_points > 0 && (
                            <Badge variant="success">+{report.reward_points} pts</Badge>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-slate-700">Question: </span>
                            <span className="text-slate-600 line-clamp-2">
                              {report.question?.question || 'Unknown question'}
                            </span>
                          </div>

                          <div>
                            <span className="font-medium text-slate-700">Category: </span>
                            <span className="text-slate-600">
                              {report.question?.category?.name || 'Unknown'}
                            </span>
                          </div>

                          <div>
                            <span className="font-medium text-slate-700">Reason: </span>
                            <span className="text-slate-600">{getReasonLabel(report.reason)}</span>
                          </div>

                          <div>
                            <span className="font-medium text-slate-700">Reported by: </span>
                            <span className="text-slate-600">
                              {report.user?.full_name || report.user?.email || 'Unknown user'}
                            </span>
                          </div>

                          {report.comment && (
                            <div>
                              <span className="font-medium text-slate-700">Comment: </span>
                              <span className="text-slate-600">{report.comment}</span>
                            </div>
                          )}

                          <div className="text-xs text-slate-500">
                            {new Date(report.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        {report.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(report)}
                            disabled={submitting}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

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
          </>
        )}

        {/* Report Detail Modal */}
        {showModal && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Report #{selectedReport.id}</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Question Editor */}
                <div>
                  <h3 className="font-semibold text-slate-700 mb-2">Question</h3>
                  <div className="rounded-lg bg-slate-50 p-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Question Text</p>
                      <Textarea
                        value={editedQuestion}
                        onChange={(e) => setEditedQuestion(e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Option A</p>
                        <Input
                          value={editedOptionA}
                          onChange={(e) => setEditedOptionA(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Option B</p>
                        <Input
                          value={editedOptionB}
                          onChange={(e) => setEditedOptionB(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Option C</p>
                        <Input
                          value={editedOptionC}
                          onChange={(e) => setEditedOptionC(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Option D</p>
                        <Input
                          value={editedOptionD}
                          onChange={(e) => setEditedOptionD(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Correct Option</p>
                        <select
                          value={editedCorrectOption}
                          onChange={(e) => setEditedCorrectOption(e.target.value as 'A' | 'B' | 'C' | 'D')}
                          className="mt-1 w-full rounded border border-slate-300 p-2"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Category</p>
                        <select
                          value={editedCategoryId || ''}
                          onChange={(e) => setEditedCategoryId(Number(e.target.value) || null)}
                          className="mt-1 w-full rounded border border-slate-300 p-2"
                        >
                          <option value="">Select category</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-1">Explanation</p>
                      <Textarea
                        value={editedExplanation}
                        onChange={(e) => setEditedExplanation(e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Report Details */}
                <div>
                  <h3 className="font-semibold text-slate-700 mb-2">Report Details</h3>
                  <div className="rounded-lg bg-slate-50 p-4 space-y-2">
                    <div>
                      <span className="font-medium">Reason: </span>
                      <span className="text-slate-600">{getReasonLabel(selectedReport.reason)}</span>
                    </div>
                    {selectedReport.comment && (
                      <div>
                        <span className="font-medium">Comment: </span>
                        <span className="text-slate-600">{selectedReport.comment}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Reported by: </span>
                      <span className="text-slate-600">
                        {selectedReport.user?.full_name || selectedReport.user?.email}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Status: </span>
                      {getStatusBadge(selectedReport.status)}
                    </div>
                    {selectedReport.reward_points > 0 && (
                      <div>
                        <span className="font-medium">Reward: </span>
                        <span className="text-slate-600">{selectedReport.reward_points} points</span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Date: </span>
                      <span className="text-slate-600">
                        {new Date(selectedReport.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reward Points Input */}
                {selectedReport.status === 'pending' && (
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Reward Points</h3>
                    <p className="text-sm text-slate-600 mb-2">Points to award to the reporter</p>
                    <Input
                      type="number"
                      min="1"
                      value={rewardPoints}
                      onChange={(e) => setRewardPoints(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {selectedReport.status === 'pending' && (
                    <>
                      <Button
                        onClick={() => setAction('approve')}
                        disabled={submitting}
                        className="flex-1"
                        variant="primary"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setAction('reject')}
                        disabled={submitting}
                        className="flex-1"
                        variant="danger"
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => setShowModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>

                {/* Confirmation */}
                {action && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm text-blue-800">
                      {action === 'approve' 
                        ? `You are about to approve this report and award ${rewardPoints} points to the user.`
                        : 'You are about to reject this report. No points will be awarded.'}
                    </p>
                    <Button
                      onClick={handleAction}
                      disabled={submitting}
                      className="mt-3 w-full"
                      variant={action === 'approve' ? 'primary' : 'danger'}
                    >
                      {submitting ? 'Processing...' : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </main>
   
  );
}