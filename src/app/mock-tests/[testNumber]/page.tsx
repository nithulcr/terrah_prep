'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { Question, questionOptions } from '@/types';
import { CheckCircle, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Bookmark, Flag, Clock } from 'lucide-react';
import UserLayout from '@/app/user-layout';

export default function MockTestPage() {


  const params = useParams();

  const searchParams = useSearchParams();

  const testNumber = Number(params.testNumber);

  const batchId = Number(searchParams.get("batchId"));
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [testResultId, setTestResultId] = useState<number | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [reviewFlags, setReviewFlags] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [testDuration, setTestDuration] = useState<number>(90); // Default 90 minutes

  // Function to add bookmark to database
  const addBookmarkToDatabase = async (questionId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please login to bookmark questions');
        return;
      }

      const response = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to add bookmark:', data.error);
        // Revert local state on failure
        setBookmarks((all) => all.filter(id => id !== questionId));
      }
    } catch (err) {
      console.error('Error adding bookmark:', err);
      // Revert local state on failure
      setBookmarks((all) => all.filter(id => id !== questionId));
    }
  };

  // Function to remove bookmark from database
  const removeBookmarkFromDatabase = async (questionId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Please login to manage bookmarks');
        return;
      }

      const response = await fetch('/api/bookmarks', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to remove bookmark:', data.error);
        // Revert local state on failure
        setBookmarks((all) => [...all, questionId]);
      }
    } catch (err) {
      console.error('Error removing bookmark:', err);
      // Revert local state on failure
      setBookmarks((all) => [...all, questionId]);
    }
  };

  // Auto-redirect on error disabled for debugging
  // useEffect(() => {
  //   if (error) {
  //     const timer = setTimeout(() => {
  //       window.location.href = '/mock-tests';
  //     }, 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [error]);

  useEffect(() => {
    if (!batchId || !testNumber) {
      setError('Invalid test parameters');
      setLoading(false);
      return;
    }

    const startTest = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError('Please login to start the test');
          setLoading(false);
          return;
        }

        // Get session and pass token in header
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setError('Please login to start the test');
          setLoading(false);
          return;
        }

        // Check if this is a retest
        const allowRetest = searchParams.get('retest') === 'true';

        console.log("Starting Test", testNumber);
        console.log("Session exists:", !!session);
        console.log("Token length:", session.access_token?.length);

        const response = await fetch('/api/test/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ batchId, testNumber, allowRetest }),
        });

        console.log('MockTestPage: Response status:', response.status);
        const data = await response.json();
        console.log('MockTestPage: Response data:', data);

        if (!response.ok) {
          console.error('MockTestPage: Error starting test:', data);
          if (data.redirectTo) {
            router.push(data.redirectTo);
            return;
          }
          setError(data.error || 'Failed to start test');
          setLoading(false);
          return;
        }

        console.log('MockTestPage: Test started successfully:', data);
        console.log('MockTestPage: Question IDs received:', data.questions?.map((q: Question) => q.id));
        setTestResultId(data.testResultId);
        setQuestions(data.questions || []);
        setTestDuration(data.testDurationMinutes || 90); // Set duration from API
        setTimeRemaining((data.testDurationMinutes || 90) * 60); // Convert to seconds
        setIsResuming(data.isResuming || false); // Set resume flag
        setLoading(false);
      } catch (err) {
        setError('Failed to load test');
        setLoading(false);
      }
    };

    void startTest();
  }, [testNumber, batchId, router]);

  // Timer countdown effect
  useEffect(() => {
    if (timeRemaining <= 0 || submitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto submit
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, submitted]);

  const handleSubmit = async () => {
    try {
      if (!testResultId) {
        setError('Test not started properly');
        return;
      }

      // Get session and pass token in header
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/test/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          testResultId,
          answers,
          questionIds: questions.map(q => q.id),
          timeTakenSeconds: 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit test');
        setErrorDetails(data);
        return;
      }

      setResult(data.result);
      setSubmitted(true);

      // No auto-redirect - user can manually navigate using the buttons
    } catch (err) {
      setError('Failed to submit test');
    }
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="text-slate-600">Loading test...</p>
      </div>
    </main>;
  }

  if (error) {
    return <main className="mx-auto max-w-2xl p-6">
      <Card>
        <CardBody className="p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
          <h1 className="mt-3 text-2xl font-bold">Error</h1>
          <p className="mt-3 text-slate-600">{error}</p>
          
          {/* Show detailed error information */}
          {errorDetails && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-left">
              <p className="text-sm font-semibold text-red-900">Error Details:</p>
              {errorDetails.databaseError && (
                <p className="mt-1 text-xs text-red-700">Database Error: {errorDetails.databaseError}</p>
              )}
              {errorDetails.code && (
                <p className="mt-1 text-xs text-red-700">Error Code: {errorDetails.code}</p>
              )}
              {errorDetails.hint && (
                <p className="mt-1 text-xs text-red-700">Hint: {errorDetails.hint}</p>
              )}
              <p className="mt-2 text-xs text-red-600">
                Check browser console (F12) for complete error logs
              </p>
            </div>
          )}
          
          <Link href="/mock-tests">
            <Button className="mt-6">Back to Mock Tests</Button>
          </Link>
        </CardBody>
      </Card>
    </main>;
  }

  if (!questions.length) return <main className="p-6"><h1 className="text-2xl font-bold">Test {testNumber}</h1><p className="mt-3">No questions are available for this test.</p></main>;

  const question = questions[index];

  // Show resume confirmation if user is resuming an in-progress test
  if (isResuming && !submitted) {
    return (
      <UserLayout>
        <div className="mx-auto max-w-2xl p-6">
          <Card>
            <CardBody className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-blue-600" />
              <h1 className="mt-4 text-2xl font-bold">Resume Test?</h1>
              <p className="mt-3 text-slate-600">
                You have an incomplete test. Would you like to continue where you left off or start fresh?
              </p>
              <div className="mt-6 flex gap-4">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => setIsResuming(false)}
                >
                  Continue Test
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // Reset test by creating a new test result
                    setTestResultId(null);
                    setIsResuming(false);
                    // Trigger test start again
                    window.location.reload();
                  }}
                >
                  Start Fresh
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </UserLayout>
    );
  }

  if (submitted && result) {
    return <main className="mx-auto max-w-4xl p-6">
      <Card>
        <CardBody className="p-8">
          <div className="mb-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
            <h1 className="mt-4 text-3xl font-bold">Test Complete!</h1>
            <p className="mt-2 text-slate-600">Test {testNumber}</p>
          </div>

          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-blue-50 p-4 text-center">
              <p className="text-sm text-slate-600">Score</p>
              <p className="text-3xl font-bold text-blue-600">{result.score}/{result.totalQuestions}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-sm text-slate-600">Correct</p>
              <p className="text-3xl font-bold text-green-600">{result.correctAnswers}</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-sm text-slate-600">Wrong</p>
              <p className="text-3xl font-bold text-red-600">{result.wrongAnswers}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <p className="text-sm text-slate-600">Skipped</p>
              <p className="text-3xl font-bold text-gray-600">{result.skippedAnswers}</p>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-emerald-50 p-4 text-center">
              <p className="text-sm text-slate-600">Earned Marks</p>
              <p className="text-3xl font-bold text-emerald-600">{result.earnedMarks}</p>
            </div>
            <div className="rounded-lg bg-orange-50 p-4 text-center">
              <p className="text-sm text-slate-600">Negative Marks</p>
              <p className="text-3xl font-bold text-orange-600">{result.negativeMarks}</p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <p className="text-sm text-slate-600">Final Marks</p>
              <p className="text-3xl font-bold text-purple-600">{result.finalMarks}</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-600">Percentage</span>
              <span className="font-semibold">{result.percentage}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${result.percentage}%` }}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/dashboard/results" className="flex-1">
              <Button variant="outline" className="w-full">View Results</Button>
            </Link>
            <Link
              href={`/mock-tests/${testNumber}?batchId=${batchId}&retest=true`}
              className="flex-1"
            >
              <Button variant="outline" className="w-full border-blue-500 text-blue-700 hover:bg-blue-50">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retake Test
              </Button>
            </Link>
            <Link href="/mock-tests" className="flex-1">
              <Button className="w-full">Back to Mock Tests</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </main>;
  }

  // Calculate progress
  const answeredCount = Object.keys(answers).length;
  const progressPercentage = (answeredCount / questions.length) * 100;

  return (
    <UserLayout>
      <div className="mx-auto max-w-3xl p-6">
    {/* Timer Display */}
    {timeRemaining > 0 && (
      <div className={`mb-4 rounded-lg p-4 ${timeRemaining < 300 ? 'bg-red-50' : 'bg-blue-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`h-5 w-5 ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`} />
            <span className="font-semibold text-slate-700">Time Remaining</span>
          </div>
          <span className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-blue-600'}`}>
            {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
          </span>
        </div>
      </div>
    )}

    {/* Progress Bar */}
    <div className="mb-4 rounded-lg bg-slate-100 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-600">Progress</span>
        <span className="font-semibold">{answeredCount} / {questions.length} Answered</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
        <span>{bookmarks.length} Bookmarks</span>
        <span>{reviewFlags.length} Review Flags</span>
        {timeRemaining > 0 && <span>{Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')} remaining</span>}
      </div>
    </div>

    <div className="mb-5 flex justify-between">
      <Badge>{question.category?.name ?? 'Question'}</Badge>
      <span>{index + 1} / {questions.length}</span>
    </div>
    <Card>
      <CardBody className="p-6">
        <h1 className="text-xl font-semibold">{question.question}</h1>
        <div className="mt-6 space-y-3">
          {questionOptions(question).map((option) => {
            const isSelected = answers[question.id] === option.key;
            return (
              <button
                key={option.key}
                onClick={() => {
                  // Toggle: if already selected, deselect; otherwise select
                  if (isSelected) {
                    setAnswers((all) => {
                      const newAnswers = { ...all };
                      delete newAnswers[question.id];
                      return newAnswers;
                    });
                  } else {
                    setAnswers((all) => ({ ...all, [question.id]: option.key }));
                  }
                }}
                className={`block w-full rounded border p-3 text-left transition-colors ${isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                  }`}
              >
                <strong>{option.key}.</strong> {option.text}
              </button>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (bookmarks.includes(question.id)) {
                // Remove bookmark
                setBookmarks(bookmarks.filter(id => id !== question.id));
                removeBookmarkFromDatabase(question.id);
              } else {
                // Add bookmark
                setBookmarks([...bookmarks, question.id]);
                addBookmarkToDatabase(question.id);
              }
            }}
          >
            <Bookmark className={`mr-1 h-4 w-4 ${bookmarks.includes(question.id) ? 'fill-current text-yellow-600' : ''}`} />
            {bookmarks.includes(question.id) ? 'Bookmarked' : 'Bookmark'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (reviewFlags.includes(question.id)) {
                setReviewFlags(reviewFlags.filter(id => id !== question.id));
              } else {
                setReviewFlags([...reviewFlags, question.id]);
              }
            }}
          >
            <Flag className={`mr-1 h-4 w-4 ${reviewFlags.includes(question.id) ? 'fill-current text-red-600' : ''}`} />
            {reviewFlags.includes(question.id) ? 'Flagged' : 'Flag for Review'}
          </Button>
        </div>

        <div className="mt-6 flex justify-between">
          <Button variant="outline" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}>
            <ChevronLeft /> Previous
          </Button>
          {index === questions.length - 1 ? (
            <Button onClick={handleSubmit}>Submit Test</Button>
          ) : (
            <Button onClick={() => setIndex((current) => current + 1)}>
              Next <ChevronRight />
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
      </div>
    </UserLayout>
  );
}
