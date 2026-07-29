'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { Question, questionOptions } from '@/types';
import { CheckCircle, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

export default function MockTestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const testNumber = Number(searchParams.get('testNumber') || 1);
  const batchId = Number(searchParams.get('batchId'));
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [testResultId, setTestResultId] = useState<number | null>(null);

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
        
        // Check if this is a retest
        const allowRetest = searchParams.get('retest') === 'true';
        
        const response = await fetch(`/api/mock-tests/${testNumber}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
          },
          body: JSON.stringify({ batchId, allowRetest }),
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

        setTestResultId(data.test.testResultId);
        setQuestions(data.questions || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to load test');
        setLoading(false);
      }
    };

    void startTest();
  }, [testNumber, batchId, router]);

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
        return;
      }

      setResult(data.result);
      setSubmitted(true);
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
          <Link href="/mock-tests">
            <Button className="mt-6">Back to Mock Tests</Button>
          </Link>
        </CardBody>
      </Card>
    </main>;
  }

  if (!questions.length) return <main className="p-6"><h1 className="text-2xl font-bold">Test {testNumber}</h1><p className="mt-3">No questions are available for this test.</p></main>;

  const question = questions[index];

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

  return <main className="mx-auto max-w-3xl p-6">
    <div className="mb-5 flex justify-between">
      <Badge>{question.category?.name ?? 'Question'}</Badge>
      <span>{index + 1} / {questions.length}</span>
    </div>
    <Card>
      <CardBody className="p-6">
        <h1 className="text-xl font-semibold">{question.question}</h1>
        <div className="mt-6 space-y-3">
          {questionOptions(question).map((option) => (
            <button
              key={option.key}
              onClick={() => setAnswers((all) => ({ ...all, [question.id]: option.key }))}
              className={`block w-full rounded border p-3 text-left transition-colors ${
                answers[question.id] === option.key
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <strong>{option.key}.</strong> {option.text}
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-between">
          <Button variant="outline" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}>
            <ChevronLeft /> Previous
          </Button>
          {index === questions.length - 1 ? (
            <Button onClick={handleSubmit}>Submit</Button>
          ) : (
            <Button onClick={() => setIndex((current) => current + 1)}>
              Next <ChevronRight />
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  </main>;
}