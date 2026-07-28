'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { TestResult, Question, UserAnswer } from '@/types';
import { useAuth } from '@/lib/auth/use-auth';
import { Trophy, Calendar, TrendingUp, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function ResultsPage() {
  const { user } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'recent'>('recent');
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user) {
      loadResults();
    }
  }, [user, filter]);

  const loadResults = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('test_results')
        .select('*, batch:batches(*)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (filter === 'recent') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('created_at', thirtyDaysAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading results:', error);
        return;
      }

      setResults((data ?? []) as TestResult[]);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteResult = async (resultId: number) => {
    if (!confirm('Are you sure you want to delete this result?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('test_results')
        .delete()
        .eq('id', resultId)
        .eq('user_id', user?.id);

      if (error) {
        alert('Failed to delete result');
        return;
      }

      setResults((all) => all.filter((r) => r.id !== resultId));
    } catch (error) {
      alert('Failed to delete result');
    }
  };

  const toggleResultExpansion = async (resultId: number) => {
    setExpandedResults((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });

    // If expanding, fetch questions with answers
    if (!expandedResults.has(resultId)) {
      try {
        const { data: userAnswers, error } = await supabase
          .from('user_answers')
          .select('*, question:questions(*, category:categories(*))')
          .eq('test_result_id', resultId)
          .order('question_id', { ascending: true });

        if (error || !userAnswers) {
          console.error('Error fetching questions:', error);
          return;
        }

        // Update the result with questions
        setResults((all) =>
          all.map((r) =>
            r.id === resultId
              ? { ...r, questions: userAnswers }
              : r
          )
        );
      } catch (error) {
        console.error('Error fetching questions:', error);
      }
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'info';
    if (percentage >= 40) return 'warning';
    return 'danger';
  };

  return (
    <main className="min-h-screen bg-slate-50 pt-20">
      <section className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-violet-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Test Results
              </h1>
              <p className="mt-3 text-lg text-slate-600">
                Track your performance and progress
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'recent' ? 'primary' : 'outline'}
                onClick={() => setFilter('recent')}
              >
                Recent
              </Button>
              <Button
                variant={filter === 'all' ? 'primary' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All Time
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : results.length === 0 ? (
          <Card>
            <CardBody className="p-12 text-center">
              <Trophy className="mx-auto h-16 w-16 text-slate-400" />
              <h3 className="mt-4 text-xl font-semibold text-slate-900">
                No test results yet
              </h3>
              <p className="mt-2 text-slate-600">
                Start taking mock tests to see your results here
              </p>
              <Link href="/mock-tests">
                <Button className="mt-6">Take Your First Test</Button>
              </Link>
            </CardBody>
          </Card>
        ) : (
          <div className="grid gap-6">
            {results.map((result) => (
              <Card key={result.id} className="border border-slate-200 shadow-sm">
                <CardBody className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {(result as any).batch?.batch_name || 'Unknown Batch'}
                        </h3>
                        <Badge variant={getScoreBadge(result.percentage)}>
                          {result.percentage}%
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(result.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          {result.score}/{result.total_questions} correct
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${getScoreColor(result.percentage)}`}>
                          {result.percentage}%
                        </p>
                        <p className="text-xs text-slate-500">Score</p>
                      </div>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteResult(result.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-4">
                    <div className="rounded-lg bg-green-50 p-3 text-center">
                      <p className="text-xs text-slate-600">Correct</p>
                      <p className="text-lg font-bold text-green-600">
                        {result.correct_answers}
                      </p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3 text-center">
                      <p className="text-xs text-slate-600">Wrong</p>
                      <p className="text-lg font-bold text-red-600">
                        {result.wrong_answers}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3 text-center">
                      <p className="text-xs text-slate-600">Skipped</p>
                      <p className="text-lg font-bold text-gray-600">
                        {result.skipped_answers}
                      </p>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-3 text-center">
                      <p className="text-xs text-slate-600">Negative</p>
                      <p className="text-lg font-bold text-yellow-600">
                        {result.negative_marks}
                      </p>
                    </div>
                  </div>

                  {result.time_taken_seconds > 0 && (
                    <div className="mt-3 text-sm text-slate-600">
                      Time taken: {Math.floor(result.time_taken_seconds / 60)}m {result.time_taken_seconds % 60}s
                    </div>
                  )}

                  {/* View Questions Button - Always show for results with questions */}
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => toggleResultExpansion(result.id)}
                      className="w-full"
                    >
                      {expandedResults.has(result.id) ? (
                        <>
                          <ChevronUp className="mr-2 h-4 w-4" />
                          Hide Questions
                        </>
                      ) : (
                        <>
                          <ChevronDown className="mr-2 h-4 w-4" />
                          View All Questions
                        </>
                      )}
                    </Button>

                    {expandedResults.has(result.id) && (
                      <div className="mt-4 space-y-4">
                        {(result as any).questions && (result as any).questions.length > 0 ? (
                          (result as any).questions.map((userAnswer: UserAnswer & { question: Question }, index: number) => {
                            const question = userAnswer.question;
                            const selectedOption = userAnswer.selected_option;
                            const isCorrect = userAnswer.is_correct;
                            const correctOption = question.correct_option;

                            return (
                              <Card key={userAnswer.id || index} className="border border-slate-200">
                                <CardBody className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="info">
                                          Q{index + 1}
                                        </Badge>
                                        <Badge variant="info">
                                          {question.category?.name || 'General'}
                                        </Badge>
                                        {isCorrect ? (
                                          <Badge variant="success">Correct</Badge>
                                        ) : selectedOption ? (
                                          <Badge variant="danger">Wrong</Badge>
                                        ) : (
                                          <Badge variant="warning">Skipped</Badge>
                                        )}
                                      </div>
                                      <p className="text-slate-900 font-medium">{question.question}</p>
                                      
                                      <div className="mt-3 space-y-2">
                                        {['A', 'B', 'C', 'D'].map((option) => {
                                          const optionText = question[`option_${option.toLowerCase()}` as keyof Question] as string;
                                          const isSelected = selectedOption === option;
                                          const isCorrectOption = correctOption === option;

                                          return (
                                            <div
                                              key={option}
                                              className={`rounded border p-2 ${
                                                isCorrectOption
                                                  ? 'border-green-500 bg-green-50'
                                                  : isSelected
                                                  ? 'border-red-500 bg-red-50'
                                                  : 'border-slate-200'
                                              }`}
                                            >
                                              <span className="font-semibold">{option}.</span> {optionText}
                                              {isCorrectOption && <span className="ml-2 text-green-600">✓ Correct</span>}
                                              {isSelected && !isCorrectOption && <span className="ml-2 text-red-600">✗ Your Answer</span>}
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {question.explanation && (
                                        <div className="mt-3 rounded-lg bg-blue-50 p-3">
                                          <p className="text-sm font-semibold text-blue-900">Explanation:</p>
                                          <p className="text-sm text-blue-800">{question.explanation}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardBody>
                              </Card>
                            );
                          })
                        ) : (
                          <Card className="border border-slate-200">
                            <CardBody className="p-6 text-center">
                              <p className="text-slate-600">Loading questions...</p>
                            </CardBody>
                          </Card>
                        )}
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
