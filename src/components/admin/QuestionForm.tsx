'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, Input, Textarea } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { CorrectOption, Question } from '@/types';
import { QuestionCreateData, questionService } from '@/lib/services/question.service';

type FormValues = QuestionCreateData;
const emptyForm: FormValues = {
  batch_id: 0, category_id: 0, question: '', option_a: '', option_b: '', option_c: '', option_d: '',
  correct_option: 'A', explanation: '', difficulty: 'easy', language: 'english', marks: 1,
  negative_marks: 0, question_image: '', options_image: '', is_active: true,
};

export function QuestionForm({ question }: { question?: Question }) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(question ? {
    batch_id: question.batch_id, category_id: question.category_id, question: question.question,
    option_a: question.option_a, option_b: question.option_b, option_c: question.option_c, option_d: question.option_d,
    correct_option: question.correct_option, explanation: question.explanation ?? '', difficulty: question.difficulty,
    language: question.language, marks: question.marks, negative_marks: question.negative_marks,
    question_image: question.question_image ?? '', options_image: question.options_image ?? '', is_active: question.is_active,
  } : emptyForm);
  const [batches, setBatches] = useState<{ id: number; batch_name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { void Promise.all([
    supabase.from('batches').select('id, batch_name').order('batch_number'),
    supabase.from('categories').select('id, name').order('name'),
  ]).then(([batchResult, categoryResult]) => {
    setBatches(batchResult.data ?? []); setCategories(categoryResult.data ?? []);
  }); }, []);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    const payload = { ...values, explanation: values.explanation || null, question_image: values.question_image || null, options_image: values.options_image || null };
    const result = question ? await questionService.updateQuestion(supabase, question.id, payload) : await questionService.createQuestion(supabase, payload);
    setSaving(false);
    if (result.error) { alert(result.error); return; }
    router.push('/admin/questions'); router.refresh();
  };

  return <form onSubmit={submit} className="space-y-6">
    <Card><CardBody className="space-y-4 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label>Batch<select required value={values.batch_id || ''} onChange={(e) => set('batch_id', Number(e.target.value))} className="mt-1 w-full rounded border p-2"><option value="">Select batch</option>{batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.batch_name}</option>)}</select></label>
        <label>Category<select required value={values.category_id || ''} onChange={(e) => set('category_id', Number(e.target.value))} className="mt-1 w-full rounded border p-2"><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      </div>
      <label className="block">Question<Textarea required value={values.question} onChange={(e) => set('question', e.target.value)} rows={4} /></label>
      {(['A', 'B', 'C', 'D'] as CorrectOption[]).map((key) => <label key={key} className="block">Option {key}<Input required value={values[`option_${key.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c' | 'option_d']} onChange={(e) => set(`option_${key.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c' | 'option_d', e.target.value)} /></label>)}
      <label>Correct answer<select value={values.correct_option} onChange={(e) => set('correct_option', e.target.value as CorrectOption)} className="mt-1 w-full rounded border p-2">{(['A', 'B', 'C', 'D'] as CorrectOption[]).map((key) => <option key={key}>{key}</option>)}</select></label>
      <label className="block">Explanation<Textarea value={values.explanation ?? ''} onChange={(e) => set('explanation', e.target.value)} rows={3} /></label>
    </CardBody></Card>
    <Card><CardBody className="grid gap-4 p-6 md:grid-cols-2">
      <label>Difficulty<select value={values.difficulty} onChange={(e) => set('difficulty', e.target.value as FormValues['difficulty'])} className="mt-1 w-full rounded border p-2"><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
      <label>Language<Input value={values.language} onChange={(e) => set('language', e.target.value)} /></label>
      <label>Marks<Input type="number" min="0" value={values.marks} onChange={(e) => set('marks', Number(e.target.value))} /></label>
      <label>Negative marks<Input type="number" min="0" step="0.25" value={values.negative_marks} onChange={(e) => set('negative_marks', Number(e.target.value))} /></label>
      <label className="block md:col-span-2">Image URL<Input value={values.question_image ?? ''} onChange={(e) => set('question_image', e.target.value)} /></label>
      <label className="block md:col-span-2">Options Image URL<Input value={values.options_image ?? ''} onChange={(e) => set('options_image', e.target.value)} /></label>
      <label className="flex items-center gap-2"><input type="checkbox" checked={values.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Active</label>
    </CardBody></Card>
    <Button type="submit" disabled={saving}>{saving ? 'Saving…' : question ? 'Update Question' : 'Create Question'}</Button>
  </form>;
}
