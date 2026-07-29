'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { QuestionForm } from '@/components/admin/QuestionForm';
import { Button } from '@/components/ui';
import { questionService } from '@/lib/services/question.service';
import { supabase } from '@/lib/supabase/client';
import { Question } from '@/types';
export default function EditQuestionPage() { const { id } = useParams<{ id: string }>(); const questionId = Number(id); const [question, setQuestion] = useState<Question | null>(null); const [error, setError] = useState(''); useEffect(() => { if (Number.isInteger(questionId) && questionId > 0) void questionService.getQuestion(supabase, questionId).then(({ question, error }) => { setQuestion(question); setError(error ?? ''); }); }, [questionId]); if (error) return <p>{error}</p>; if (!question) return <p>Loading…</p>; return <div className="space-y-6"><div className="flex items-center justify-between"><h1 className="text-3xl font-bold">Edit Question</h1><Link href="/admin/questions"><Button variant="outline">Back</Button></Link></div><QuestionForm question={question} /></div>; }
