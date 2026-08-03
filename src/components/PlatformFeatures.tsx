'use client';

import {
  ClipboardCheck,
  BarChart3,
  Bookmark,
  FileSearch,
  Gift,
  BadgeCheck,
  Smartphone,
  ShieldCheck,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: ClipboardCheck,
    title: 'Unlimited Mock Tests',
    desc: 'Practice realistic mock tests designed to match Kerala PSC exam patterns.',
  },
  {
    icon: BarChart3,
    title: 'Performance Dashboard',
    desc: 'Track accuracy, progress, weak subjects and overall performance.',
  },
  {
    icon: Bookmark,
    title: 'Bookmark Questions',
    desc: 'Save important questions for revision anytime.',
  },
  {
    icon: FileSearch,
    title: 'Review Answers',
    desc: 'Analyze every answer with explanations and improve your mistakes.',
  },
  {
    icon: Gift,
    title: 'Earn Reward Points',
    desc: 'Report incorrect questions and earn reward points for every approved report.',
  },
  {
    icon: BadgeCheck,
    title: 'Redeem Premium Plans',
    desc: 'Use earned points to unlock subscription plans or spin the lucky wheel.',
  },
  {
    icon: Smartphone,
    title: 'Responsive Experience',
    desc: 'Works beautifully across desktop, tablet and mobile devices.',
  },
  {
    icon: ShieldCheck,
    title: 'Cloud Progress',
    desc: 'Your tests, bookmarks and achievements stay synced securely.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    desc: 'Built with Next.js and Supabase for an ultra-fast experience.',
  },
];

export default function PlatformFeatures() {
  return (
    <section className="relative overflow-hidden bg-[#09090B] py-24">

      <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-[#fe7402]/10 blur-[180px]" />
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-orange-500/5 blur-[180px]" />

      <div className="relative mx-auto max-w-7xl px-6">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-[#fe7402]/30 bg-[#fe7402]/10 px-4 py-2 text-sm font-medium text-[#fe7402]">
            Platform Features
          </span>

          <h2 className="mt-6 text-4xl font-bold text-white md:text-5xl">
            Everything You Need To Prepare Smarter
          </h2>

          <p className="mt-6 text-lg text-slate-400">
            Terrah Prep is more than a question bank. It's a complete preparation
            platform designed to help you crack competitive exams with confidence.
          </p>

        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {features.map((feature, index) => {

            const Icon = feature.icon;

            return (

              <div
                key={index}
                className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-[#fe7402]/40 hover:bg-slate-900"
              >

                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fe7402]/10">

                  <Icon className="h-8 w-8 text-[#fe7402]" />

                </div>

                <h3 className="text-2xl font-semibold text-white">

                  {feature.title}

                </h3>

                <p className="mt-4 leading-7 text-slate-400">

                  {feature.desc}

                </p>

              </div>

            );

          })}

        </div>

      </div>

    </section>
  );
}