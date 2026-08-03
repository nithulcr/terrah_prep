'use client';

import {
  GraduationCap,
  Train,
  Landmark,
  Briefcase,
  Award,
  ArrowRight,
} from 'lucide-react';

const exams = [
  {
    icon: GraduationCap,
    title: 'Kerala PSC',
    description: 'Complete preparation for LDC, LGS, Degree Level, Secretariat Assistant, Police and more.',

  },
  {
    icon: Briefcase,
    title: 'SSC',
    description: 'Practice for CGL, CHSL, MTS and other SSC examinations.',
    status: 'Coming Soon',
  },
  {
    icon: Train,
    title: 'Railway',
    description: 'Prepare for RRB NTPC, Group D, ALP and Technician exams.',
    status: 'Coming Soon',
  },
  {
    icon: Landmark,
    title: 'Banking',
    description: 'IBPS, SBI PO, Clerk and other banking recruitment exams.',
    status: 'Coming Soon',
  },
  {
    icon: Award,
    title: 'UPSC',
    description: 'Civil Services Preliminary and General Studies preparation.',
    status: 'Coming Soon',
  },
];

export default function ExamCategories() {
  return (
    <section className="relative overflow-hidden bg-black text-white py-24">



      <div className="relative mx-auto max-w-7xl px-6">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-[#fe7402]/30 bg-[#fe7402]/10 px-4 py-2 text-sm font-medium text-[#fe7402]">
            Explore Exams
          </span>

          <h2 className="mt-6 text-4xl font-bold text-white md:text-5xl">
            Prepare For Every Competitive Exam
          </h2>

          <p className="mt-6 text-lg text-slate-400">
            Start your journey with Kerala PSC and explore more competitive
            exams as Terrah Prep continues to grow.
          </p>

        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {exams.map((exam, index) => {

            const Icon = exam.icon;

            return (

              <div
                key={index}
                className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-8 backdrop-blur transition duration-300 hover:-translate-y-2 hover:border-[#fe7402]/40"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fe7402]/10">

                    <Icon className="h-8 w-8 text-[#fe7402]" />

                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold text-white absolute right-4 top-[-15px] ${
                      exam.status === 'Coming Soon' ? 'bg-blue-500 px-3 py-1' : ''
                    }`}
                  >
                    {exam.status}
                  </span>

                </div>

                <h3 className="mt-8 text-2xl font-bold text-white">

                  {exam.title}

                </h3>

                <p className="mt-4 leading-7 text-slate-400">

                  {exam.description}

                </p>


              </div>

            );
          })}

        </div>

      </div>
    </section>
  );
}