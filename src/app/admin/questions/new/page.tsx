'use client';
import Link from 'next/link';
import { QuestionForm } from '@/components/admin/QuestionForm';
import { Button } from '@/components/ui';
export default function NewQuestionPage() { return <div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Add Question</h1><p className="text-gray-600">Options are stored directly with this question.</p></div><Link href="/admin/questions"><Button variant="outline">Back</Button></Link></div><QuestionForm /></div>; }
