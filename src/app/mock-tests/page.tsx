'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, CardBody } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { Batch } from '@/types';
import { BookOpen, Play } from 'lucide-react';
export default function MockTestsPage() { const [batches, setBatches] = useState<Batch[]>([]); useEffect(() => { void supabase.from('batches').select('*').eq('is_active', true).order('batch_number').then(({ data }) => setBatches((data ?? []) as Batch[])); }, []); return <main className="mx-auto max-w-6xl p-6"><h1 className="mb-6 text-3xl font-bold">Practice Batches</h1><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{batches.map((batch) => <Card key={batch.id}><CardBody className="p-6"><Badge>Batch {batch.batch_number}</Badge><h2 className="mt-3 text-xl font-semibold">{batch.batch_name}</h2>{batch.description && <p className="mt-2 text-gray-600">{batch.description}</p>}<Link className="mt-6 block" href={`/mock-tests/${batch.id}`}><Button><Play className="mr-2 h-4 w-4" />Start Test</Button></Link></CardBody></Card>)}</div>{batches.length === 0 && <p>No active batches are available.</p>}</main>; }
