'use client';
import { useEffect, useState } from 'react';
import { Card, CardBody } from '@/components/ui';
import { supabase } from '@/lib/supabase/client';
import { Plan } from '@/types';
export default function PricingPage() { const [plans, setPlans] = useState<Plan[]>([]); useEffect(() => { void supabase.from('plans').select('*').eq('is_active', true).order('price').then(({ data }) => setPlans((data ?? []) as Plan[])); }, []); return <main className="mx-auto max-w-6xl p-6"><h1 className="text-3xl font-bold">Plans</h1><p className="mt-2 text-gray-600">Contact the administrator to activate or change a subscription.</p><div className="mt-6 grid gap-6 md:grid-cols-3">{plans.map((plan) => <Card key={plan.id}><CardBody className="p-6"><h2 className="text-xl font-semibold">{plan.name}</h2><p className="mt-2 text-3xl font-bold">₹{plan.price}</p>{plan.description && <p className="mt-3 text-gray-600">{plan.description}</p>}</CardBody></Card>)}</div></main>; }
