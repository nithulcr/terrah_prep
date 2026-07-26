'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardBody, Badge } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { Question } from '@/types';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]); const [loading, setLoading] = useState(true);
  const load = async () => { setLoading(true); const { data, error } = await supabase.from('questions').select('*, category:categories(*), batch:batches(*)').order('created_at', { ascending: false }); if (error) alert(error.message); setQuestions((data ?? []) as Question[]); setLoading(false); };
  useEffect(() => { void load(); }, []);
  const remove = async (id: string) => { if (!confirm('Delete this question?')) return; const { error } = await supabase.from('questions').delete().eq('id', id); if (error) return alert(error.message); setQuestions((all) => all.filter((question) => question.id !== id)); };
  const toggle = async (question: Question) => { const { error } = await supabase.from('questions').update({ is_active: !question.is_active }).eq('id', question.id); if (error) return alert(error.message); setQuestions((all) => all.map((item) => item.id === question.id ? { ...item, is_active: !item.is_active } : item)); };
  return <div className="space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Questions</h1><p className="text-gray-600">Manage your question bank</p></div><Link href="/admin/questions/new"><Button>Add Question</Button></Link></div><Card><CardBody className="p-0">{loading ? <p className="p-6">Loading…</p> : <div className="overflow-x-auto"><table className="w-full"><thead><tr className="border-b bg-gray-50 text-left"><th className="p-3">Question</th><th className="p-3">Category</th><th className="p-3">Batch</th><th className="p-3">Difficulty</th><th className="p-3">Marks</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead><tbody>{questions.map((question) => <tr key={question.id} className="border-b"><td className="p-3">{question.question_text}</td><td className="p-3">{question.category?.name ?? '—'}</td><td className="p-3">{question.batch?.batch_name ?? '—'}</td><td className="p-3"><Badge>{question.difficulty}</Badge></td><td className="p-3">{question.marks}</td><td className="p-3"><button onClick={() => toggle(question)}><Badge variant={question.is_active ? 'success' : 'warning'}>{question.is_active ? 'Active' : 'Inactive'}</Badge></button></td><td className="p-3 space-x-2"><Link href={`/admin/questions/${question.id}/edit`}><Button size="sm" variant="outline">Edit</Button></Link><Button size="sm" variant="danger" onClick={() => remove(question.id)}>Delete</Button></td></tr>)}</tbody></table>{questions.length === 0 && <p className="p-6 text-center">No questions yet.</p>}</div>}</CardBody></Card></div>;
}
