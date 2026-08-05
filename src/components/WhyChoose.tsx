'use client';

import {
  BookOpen,
  Trophy,
  BarChart3,
  Bookmark,
  Clock3,
  ShieldCheck,
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: '30,000+ Quality Questions',
    description:
      'Carefully curated Kerala PSC, SSC, Railway, Banking and UPSC practice questions with detailed explanations.',
  },
  {
    icon: Trophy,
    title: 'Real Exam Experience',
    description:
      'Timed mock tests designed to replicate the actual PSC examination environment.',
  },
  {
    icon: BarChart3,
    title: 'Performance Dashboard',
    description:
      'Analyze strengths, identify weak subjects and improve with detailed performance insights.',
  },
  {
    icon: Bookmark,
    title: 'Bookmark & Review',
    description:
      'Save important questions and review them anytime with your personal collection.',
  },
  {
    icon: Clock3,
    title: 'Daily Practice',
    description:
      'Build consistency with daily questions, mock tests and continuous progress tracking.',
  },
  {
    icon: ShieldCheck,
    title: 'Reliable Question Bank',
    description:
      'Questions are continuously reviewed and improved through our quality verification system.',
  },
];

export default function WhyChoose() {
  return (
    <section className="relative overflow-hidden bg-black text-white py-24">

      {/* Background Glow */}

      <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-[#fe7402]/10 blur-[150px]" />

      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-orange-500/5 blur-[180px]" />

      <div className="relative mx-auto max-w-7xl px-6">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-[#fe7402]/30 bg-[#fe7402]/10 px-4 py-2 text-sm font-medium text-[#fe7402]">
            Why Choose Terrah Qbank
          </span>

          <h2 className="mt-6 text-4xl font-bold text-white md:text-5xl">
            Everything You Need to Crack Competitive Exams
          </h2>

          <p className="mt-6 text-lg leading-8 text-slate-400">
            Terrah Qbank combines high-quality practice questions, realistic
            mock tests and smart analytics to help you Qbankare with confidence.
          </p>

        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {features.map((feature, index) => {

            const Icon = feature.icon;

            return (

              <div
                key={index}
                className="group rounded-3xl border border-slate-800 bg-slate-900/60 p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:border-[#fe7402]/40 hover:bg-slate-900"
              >

                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fe7402]/10 transition-all group-hover:bg-[#fe7402]">

                  <Icon className="h-8 w-8 text-[#fe7402] transition-all group-hover:text-white" />

                </div>

                <h3 className="text-2xl font-semibold text-white">

                  {feature.title}

                </h3>

                <p className="mt-4 leading-7 text-slate-400">

                  {feature.description}

                </p>

              </div>

            );
          })}

        </div>

      </div>
    </section>
  );
}