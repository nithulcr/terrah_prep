'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface ReportQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: number;
  questionText: string;
}

type ReportReason = 'wrong_answer' | 'wrong_question' | 'wrong_explanation' | 'typo' | 'duplicate' | 'image_issue' | 'other';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'wrong_answer', label: 'Wrong Answer' },
  { value: 'wrong_question', label: 'Wrong Question' },
  { value: 'wrong_explanation', label: 'Wrong Explanation' },
  { value: 'typo', label: 'Typo' },
  { value: 'duplicate', label: 'Duplicate' },
  { value: 'image_issue', label: 'Image Issue' },
  { value: 'other', label: 'Other' },
];

export default function ReportQuestionModal({ isOpen, onClose, questionId, questionText }: ReportQuestionModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setReason(null);
      setComment('');
      setMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!reason) {
      setMessage({ type: 'error', text: 'Please select a reason' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessage({ type: 'error', text: 'Please login to report questions' });
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/question-reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          questionId,
          reason,
          comment: comment.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.error || 'Failed to submit report' });
        setSubmitting(false);
        return;
      }

      setMessage({ type: 'success', text: data.message || 'Report submitted successfully! Thank you for helping us improve.' });
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit report' });
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Report Question</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-700">Question:</p>
          <p className="mt-1 text-sm text-slate-600">{questionText}</p>
        </div>

        {message && (
          <div className={`mb-4 rounded-lg p-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="mb-4">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Reason for Report <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {REASONS.map((r) => (
              <label
                key={r.value}
                className={`flex cursor-pointer items-center rounded-lg border-2 p-3 transition-colors ${
                  reason === r.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="mr-2"
                />
                <span className="text-sm text-slate-700">{r.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Additional Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="Provide more details about the issue..."
            maxLength={500}
          />
          <p className="mt-1 text-xs text-slate-500">{comment.length}/500</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !reason}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </div>
    </div>
  );
}