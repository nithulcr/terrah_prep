'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  Crown,
  Rocket,
  Star,
  Gem,
  ArrowRight,
} from 'lucide-react';

const plans = [
  {
    icon: Star,
    name: 'FREE',
    price: '₹0',
    subtitle: 'Lifetime',
    color: 'border-slate-700',
    button: 'Start Free',
    features: [
      '100 Lifetime Questions',
      'Community Support',
      'Basic Practice',
    ],
  },

  {
    icon: Rocket,
    name: 'STARTER',
    price: '₹99',
    subtitle: '/30 Days',
    color: 'border-[#fe7402]/30',
    button: 'Get Starter',
    features: [
      '100 Questions / Day',
      '15 Mock Tests',
      'Unlimited Practice',
    ],
  },

  {
    icon: Crown,
    name: 'PRO',
    price: '₹199',
    subtitle: '/30 Days',
    color: 'border-yellow-500/30',
    button: 'Go PRO',
    features: [
      '30 Mock Tests',
      'Bookmarks',
      'Review Answers',
    ],
  },

  {
    icon: Gem,
    name: 'ELITE',
    price: '₹299',
    subtitle: '/30 Days',
    popular: true,
    color: 'border-[#fe7402]',
    button: 'Most Popular',
    features: [
      'Performance Dashboard',
      'PDF Downloads',
      'Everything in PRO',
    ],
  },
];

export default function PricingPreview() {
  return (
    <section className="relative overflow-hidden bg-[#09090B] py-28">

      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[#fe7402]/10 blur-[180px]" />

      <div className="relative mx-auto max-w-7xl px-6">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-[#fe7402]/30 bg-[#fe7402]/10 px-4 py-2 text-sm text-[#fe7402]">

            Affordable Pricing

          </span>

          <h2 className="mt-6 text-5xl font-bold text-white">

            Choose Your Qbankaration Plan

          </h2>

          <p className="mt-6 text-lg text-slate-400">

            Start free and upgrade anytime as your Qbankaration grows.

          </p>

        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-4">

          {plans.map((plan,index)=>{

            const Icon=plan.icon;

            return(

              <div
                key={index}
                className={`relative rounded-3xl border bg-slate-900 p-8 ${plan.color}`}
              >

                {plan.popular &&(

                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#fe7402] px-5 py-2 text-sm font-semibold text-white">

                    Most Popular

                  </div>

                )}

                <div className="flex items-center gap-3">

                  <Icon className="h-8 w-8 text-[#fe7402]" />

                  <h3 className="text-2xl font-bold text-white">

                    {plan.name}

                  </h3>

                </div>

                <div className="mt-8">

                  <span className="text-5xl font-bold text-white">

                    {plan.price}

                  </span>

                  <span className="ml-2 text-slate-400">

                    {plan.subtitle}

                  </span>

                </div>

                <div className="mt-8 space-y-4">

                  {plan.features.map((item,i)=>(

                    <div
                      key={i}
                      className="flex items-center gap-3"
                    >

                      <CheckCircle2 className="h-5 w-5 text-[#fe7402]" />

                      <span className="text-slate-300">

                        {item}

                      </span>

                    </div>

                  ))}

                </div>

              </div>

            )

          })}

        </div>

        <div className="mt-14 text-center">

          <Link href="/pricing">

            <button className="group inline-flex items-center gap-3 rounded-full bg-[#fe7402] px-8 py-4 font-semibold text-white hover:bg-orange-500">

              View Full Pricing

              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1"/>

            </button>

          </Link>

        </div>

      </div>

    </section>
  )
}