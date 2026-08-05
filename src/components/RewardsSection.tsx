'use client';

import Link from 'next/link';
import {
  ShieldAlert,
  Coins,
  Gift,
  Trophy,
  ArrowRight,
  Sparkles,
} from 'lucide-react';



export default function RewardsSection() {
  return (
    <section className="relative overflow-hidden bg-[#0B0D13] py-28">

      {/* Glow */}

      <div className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-[#fe7402]/10 blur-[180px]" />

      <div className="absolute -right-32 bottom-10 h-[420px] w-[420px] rounded-full bg-orange-500/5 blur-[180px]" />

      <div className="relative mx-auto max-w-7xl px-6">

        {/* Heading */}

        <div className="mx-auto max-w-3xl text-center">

          <span className="inline-flex rounded-full border border-[#fe7402]/30 bg-[#fe7402]/10 px-5 py-2 text-sm font-medium tracking-wide text-[#fe7402]">

            Community Rewards

          </span>

          <h2 className="mt-6 text-4xl font-bold leading-tight text-white md:text-5xl">

            Learn, Contribute & Earn Rewards

          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-400">

            Terrah Qbank rewards every meaningful contribution. Help us improve
            the question bank and unlock premium benefits using reward points.

          </p>

        </div>



        <div className="mt-24">

          <div className="rounded-[36px] border border-[#fe7402]/20 bg-gradient-to-r from-[#fe7402]/10 via-slate-900 to-slate-900 p-10">

            <div className="flex items-center gap-3">

              <Sparkles className="h-7 w-7 text-[#fe7402]" />

              <h3 className="text-3xl font-bold text-white">
                How Rewards Work
              </h3>

            </div>

            <div className="mt-12 grid gap-10 lg:grid-cols-4">

              <div className="text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fe7402]/15">

                  <ShieldAlert className="h-10 w-10 text-[#fe7402]" />

                </div>

                <h4 className="mt-5 text-xl font-semibold text-white">
                  Report
                </h4>

                <p className="mt-3 text-slate-400">
                  Report incorrect questions, answers or explanations.
                </p>

              </div>

              <div className="text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fe7402]/15">

                  <Coins className="h-10 w-10 text-[#fe7402]" />

                </div>

                <h4 className="mt-5 text-xl font-semibold text-white">
                  Earn Points
                </h4>

                <p className="mt-3 text-slate-400">
                  Every approved report rewards valuable points.
                </p>

              </div>

              <div className="text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fe7402]/15">

                  <Gift className="h-10 w-10 text-[#fe7402]" />

                </div>

                <h4 className="mt-5 text-xl font-semibold text-white">
                  Redeem
                </h4>

                <p className="mt-3 text-slate-400">
                  Exchange points for premium subscription plans.
                </p>

              </div>

              <div className="text-center">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fe7402]/15">

                  <Trophy className="h-10 w-10 text-[#fe7402]" />

                </div>

                <h4 className="mt-5 text-xl font-semibold text-white">
                  Lucky Spin
                </h4>

                <p className="mt-3 text-slate-400">
                  Spend points for a chance to unlock premium rewards.
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* Reward Example */}

        <div className="mt-20 grid gap-8 lg:grid-cols-2">

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">

            <span className="text-sm font-semibold uppercase tracking-wider text-[#fe7402]">

              Example Reward

            </span>

            <h3 className="mt-4 text-3xl font-bold text-white">
              100 Points = Starter Plan
            </h3>

            <p className="mt-4 leading-8 text-slate-400">

              Earn reward points by helping improve Terrah Qbank. Once you
              collect enough points, redeem them for subscription plans or use
              them to spin the Lucky Wheel.

            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <span className="rounded-full bg-[#fe7402]/10 px-5 py-3 text-[#fe7402]">
                ⭐ 100 Points
              </span>

              <span className="rounded-full bg-slate-800 px-5 py-3 text-white">
                🎁 Starter Plan
              </span>

            </div>

          </div>

          <div className="rounded-3xl border border-[#fe7402]/20 bg-gradient-to-br from-[#fe7402]/15 to-slate-900 p-8">

            <span className="text-sm font-semibold uppercase tracking-wider text-[#fe7402]">

              Lucky Spin

            </span>

            <h3 className="mt-4 text-3xl font-bold text-white">

              Turn Rewards Into Bigger Wins

            </h3>

            <p className="mt-4 leading-8 text-slate-300">

              Feeling lucky? Spend your reward points on the Lucky Spin and get
              a chance to win premium plans, bonus points and exclusive rewards.

            </p>

            <div className="mt-8 inline-flex rounded-full bg-[#fe7402] px-6 py-3 font-semibold text-white">

              🎡 Spin & Win

            </div>

          </div>

        </div>

        {/* CTA */}

        <div className="mt-24 text-center">

          <h3 className="text-4xl font-bold text-white">

            Help Improve Terrah Qbank & Get Rewarded

          </h3>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-400">

            Every approved report helps thousands of aspirants while earning you
            valuable reward points that can be redeemed for premium plans.

          </p>

          <div className="mt-10">

            <Link href="/auth/register">

              <button className="group inline-flex items-center gap-3 rounded-full bg-[#fe7402] px-8 py-4 text-lg font-semibold text-white transition hover:scale-105 hover:bg-orange-500">

                Start Earning Rewards

                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />

              </button>

            </Link>

          </div>

        </div>

      </div>

    </section>
  );
}