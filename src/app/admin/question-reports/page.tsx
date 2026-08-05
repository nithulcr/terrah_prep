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

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user, filter, searchQuery, page]);

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
      
      // Get session for Authorization header (same as working admin APIs)
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/admin/question-reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
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
    try {
      console.log('Admin: Loading report details for ID:', report.id);
      
      // Get session for Authorization header (same as working admin APIs)
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/admin/question-reports/${report.id}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
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
      setShowModal(true);
      setAction(null);
      console.log('Admin: Report details loaded');
    } catch (err: any) {
      alert(err.message || 'Failed to load report details');
      console.error('Error loading report:', err);
    }
  };

  const handleAction = async () => {
    if (!selectedReport || !action) return;

    setSubmitting(true);
    try {
      console.log('Admin: Submitting action:', action, 'for report:', selectedReport.id);
      
      // Get session for Authorization header (same as working admin APIs)
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(`/api/admin/question-reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          rewardPoints: action === 'approve' ? rewardPoints : undefined,
        }),
      });

      const data = await response.json();
      console.log('Admin: Action response:', { success: data.success, error: data.error, message: data.message });

      if (!data.success) {
        alert(data.error || 'Failed to process action');
        console.error('Action failed:', data.debug);
        return;
      }

      alert(data.message);
      setShowModal(false);
      await loadReports();
      console.log('Admin: Action completed successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to process action');
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
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6">
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
                <div>
                  <h3 className="font-semibold text-slate-700 mb-2">Question</h3>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-slate-900">{selectedReport.question?.question}</p>
                    {selectedReport.question && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-slate-600">
                          <strong>A.</strong> {selectedReport.question.option_a}
                        </p>
                        <p className="text-sm text-slate-600">
                          <strong>B.</strong> {selectedReport.question.option_b}
                        </p>
                        <p className="text-sm text-slate-600">
                          <strong>C.</strong> {selectedReport.question.option_c}
                        </p>
                        <p className="text-sm text-slate-600">
                          <strong>D.</strong> {selectedReport.question.option_d}
                        </p>
                      </div>
                    )}
                    {selectedReport.question?.correct_option && (
                      <p className="mt-2 text-sm font-semibold text-green-600">
                        Correct Option: {selectedReport.question.correct_option}
                      </p>
                    )}
                    {selectedReport.question?.explanation && (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-semibold">Explanation:</span> {selectedReport.question.explanation}
                      </p>
                    )}
                    <p className="text-sm text-slate-500 mt-1">
                      Category: {selectedReport.question?.category?.name}
                    </p>
                  </div>
                </div>

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

                {selectedReport.status === 'pending' && (
                  <div>
                    <h3 className="font-semibold text-slate-700 mb-2">Reward Points</h3>
                    <Input
                      type="number"
                      min="1"
                      value={rewardPoints}
                      onChange={(e) => setRewardPoints(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

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
