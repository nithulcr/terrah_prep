'use client';

import {
  Quote,
  Star,
  ArrowRight,
} from 'lucide-react';

const testimonials = [
  {
    name: 'Coming Soon',
    role: 'Kerala PSC Aspirant',
    rating: 5,
    review:
      'Terrah Prep helped me improve my confidence through daily practice and realistic mock tests.',
  },
  {
    name: 'Coming Soon',
    role: 'Degree Level Candidate',
    rating: 5,
    review:
      'The dashboard, analytics and explanations made it easy to identify my weak subjects.',
  },
  {
    name: 'Coming Soon',
    role: 'LDC Aspirant',
    rating: 5,
    review:
      'The question quality and clean interface make Terrah Prep enjoyable to use every day.',
  },
];

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-[#09090B] py-28">

      <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-[#fe7402]/10 blur-[180px]" />
      <div className="absolute right-0 bottom-0 h-96 w-96 rounded-full bg-orange-500/5 blur-[180px]" />

      <div className="relative mx-auto max-w-7xl px-6">

        <div className="mx-auto max-w-3xl text-center">

          <span className="rounded-full border border-[#fe7402]/30 bg-[#fe7402]/10 px-5 py-2 text-sm font-medium text-[#fe7402]">
            Success Stories
          </span>

          <h2 className="mt-6 text-5xl font-bold text-white">
            Trusted By Future Government Employees
          </h2>

          <p className="mt-6 text-lg text-slate-400">
            Join a growing community of aspirants preparing smarter with
            Terrah Prep.
          </p>

        </div>

        <div className="mt-20 grid gap-8 lg:grid-cols-3">

          {testimonials.map((item, index) => (

            <div
              key={index}
              className="group rounded-3xl border border-slate-800 bg-slate-900/70 p-8 transition duration-300 hover:-translate-y-2 hover:border-[#fe7402]/40"
            >

              <Quote className="h-10 w-10 text-[#fe7402]" />

              <div className="mt-6 flex gap-1">

                {[1,2,3,4,5].map((star)=>(
                  <Star
                    key={star}
                    className="h-5 w-5 fill-[#fe7402] text-[#fe7402]"
                  />
                ))}

              </div>

              <p className="mt-6 leading-8 text-slate-400">

                "{item.review}"

              </p>

              <div className="mt-8 border-t border-slate-800 pt-6">

                <h4 className="text-xl font-semibold text-white">

                  {item.name}

                </h4>

                <p className="mt-2 text-slate-500">

                  {item.role}

                </p>

              </div>

            </div>

          ))}

        </div>

        <div className="mt-16 text-center">

          <button className="group inline-flex items-center gap-3 rounded-full border border-[#fe7402]/40 px-8 py-4 text-white transition hover:bg-[#fe7402]">

            Be One Of Our Success Stories

            <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1"/>

          </button>

        </div>

      </div>

    </section>
  );
}