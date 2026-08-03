'use client';

import {
  UserPlus,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Gift,
  Trophy,
} from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Your Account',
    description:
      'Sign up for free and instantly access your dashboard and free practice questions.',
  },
  {
    icon: BookOpen,
    title: 'Practice Daily',
    description:
      'Solve high-quality questions and strengthen your knowledge every day.',
  },
  {
    icon: ClipboardCheck,
    title: 'Take Mock Tests',
    description:
      'Attempt timed mock tests designed to match the real Kerala PSC examination.',
  },
  {
    icon: BarChart3,
    title: 'Analyze Performance',
    description:
      'Review your strengths, weak subjects and improve using detailed analytics.',
  },
  {
    icon: Gift,
    title: 'Earn Reward Points',
    description:
      'Report incorrect questions and earn points after admin approval.',
  },
  {
    icon: Trophy,
    title: 'Achieve Success',
    description:
      'Crack your dream government exam with consistent preparation.',
  },
];

export default function StudentJourney() {
  return (
    <section className="relative overflow-hidden bg-[#111318] py-28">

      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[#fe7402]/10 blur-[200px]" />
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-orange-500/5 blur-[200px]" />

      <div className="relative mx-auto max-w-7xl px-6">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-[#fe7402]/30 bg-[#fe7402]/10 px-5 py-2 text-sm font-medium text-[#fe7402]">
            Your Learning Journey
          </span>

          <h2 className="mt-6 text-5xl font-bold text-white">
            Your Roadmap to Success
          </h2>

          <p className="mt-6 text-lg text-slate-400">
            Every successful candidate follows a journey. Terrah Prep helps
            you at every stage—from your first practice question to your
            dream government job.
          </p>

        </div>

        <div className="relative mt-20">

          {/* Vertical Line */}

          <div className="absolute left-8 top-0 hidden h-full w-px bg-gradient-to-b from-[#fe7402] to-transparent lg:block"></div>

          <div className="space-y-12">

            {steps.map((step, index) => {

              const Icon = step.icon;

              return (

                <div
                  key={index}
                  className="group relative flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 backdrop-blur transition duration-300 hover:border-[#fe7402]/40 lg:flex-row lg:items-center"
                >

                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-[#fe7402]">

                    <Icon className="h-8 w-8 text-white" />

                  </div>

                  <div className="flex-1">

                    <span className="text-sm font-semibold uppercase tracking-wider text-[#fe7402]">
                      Step {index + 1}
                    </span>

                    <h3 className="mt-2 text-2xl font-bold text-white">
                      {step.title}
                    </h3>

                    <p className="mt-4 leading-8 text-slate-400">
                      {step.description}
                    </p>

                  </div>

                </div>

              );

            })}

          </div>

        </div>

      </div>

    </section>
  );
}