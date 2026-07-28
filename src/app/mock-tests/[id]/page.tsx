'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { Batch, CorrectOption, Question, questionOptions } from '@/types';
import { CheckCircle, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

export default function BatchTestPage() {
  const { id } = useParams<{ id: string }>();
  const batchId = Number(id);
  const router = useRouter();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, CorrectOption>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!Number.isInteger(batchId) || batchId < 1) {
      setError('Invalid batch ID');
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

        // Call API to start test (checks limits)
        console.log('MockTestPage: Starting test request...');
        
        // Get session and pass token in header
        const { data: { session } } = await supabase.auth.getSession();
        console.log('MockTestPage: Session:', session ? 'EXISTS' : 'NULL');
        
        const response = await fetch('/api/test/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
          },
          body: JSON.stringify({ batchId }),
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

        setBatch(data.batch);
        setQuestions(data.questions);
        setLoading(false);
      } catch (err) {
        setError('Failed to load test');
        setLoading(false);
      }
    };

    void startTest();
  }, [batchId, router]);

  const handleSubmit = async () => {
    try {
      // Get session and pass token in header
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/test/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
        body: JSON.stringify({
          batchId,
          answers,
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
            <Button className="mt-6">Back to Batches</Button>
          </Link>
        </CardBody>
      </Card>
    </main>;
  }

  if (!batch) return <p className="p-6">Loading...</p>;
  if (!questions.length) return <main className="p-6"><h1 className="text-2xl font-bold">{batch.batch_name}</h1><p className="mt-3">No active questions are available in this batch.</p></main>;

  const question = questions[index];

  if (submitted && result) {
    return <main className="mx-auto max-w-4xl p-6">
      <Card>
        <CardBody className="p-8">
          <div className="mb-8 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
            <h1 className="mt-4 text-3xl font-bold">Test Complete!</h1>
            <p className="mt-2 text-slate-600">{batch.batch_name}</p>
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

          {result.negativeMarks > 0 && (
            <div className="mb-6 rounded-lg bg-yellow-50 p-4">
              <p className="text-sm text-slate-600">Negative Marks: <span className="font-semibold">{result.negativeMarks}</span></p>
            </div>
          )}

          <div className="flex gap-4">
            <Link href="/dashboard/results" className="flex-1">
              <Button variant="outline" className="w-full">View Results</Button>
            </Link>
            <Link href="/mock-tests" className="flex-1">
              <Button className="w-full">Back to Batches</Button>
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