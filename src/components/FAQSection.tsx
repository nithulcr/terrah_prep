'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: 'Can I use Terrah Qbank for free?',
    answer:
      'Yes. Every new user gets access to the FREE plan with 100 lifetime practice questions. You can upgrade anytime for additional features.',
  },
  {
    question: 'Which exams are currently supported?',
    answer:
      'Terrah Qbank currently focuses on Kerala PSC. Support for SSC, Railway, Banking and UPSC will be added in future updates.',
  },
  {
    question: 'Can I practice mock tests?',
    answer:
      'Yes. Depending on your subscription plan, you can access monthly mock tests designed to simulate the real exam environment.',
  },
  {
    question: 'How do reward points work?',
    answer:
      'If you report an incorrect question and our team approves the report, reward points will be credited to your account. These points can later be redeemed for subscription plans or Lucky Spin.',
  },
  {
    question: 'Can I use Terrah Qbank on multiple devices?',
    answer:
      'Yes. Device limits depend on your subscription plan. Higher plans support more simultaneous devices.',
  },
  {
    question: 'Will my progress be saved?',
    answer:
      'Yes. Your practice history, bookmarks, performance statistics and subscriptions are securely stored in your account.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="relative overflow-hidden bg-[#111318] py-28">

      <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-[#fe7402]/10 blur-[180px]" />

      <div className="relative mx-auto max-w-5xl px-6">

        <div className="text-center">

          <span className="rounded-full border border-[#fe7402]/30 bg-[#fe7402]/10 px-5 py-2 text-sm font-medium text-[#fe7402]">
            Frequently Asked Questions
          </span>

          <h2 className="mt-6 text-5xl font-bold text-white">
            Have Questions?
          </h2>

          <p className="mt-6 text-lg text-slate-400">
            Everything you need to know about Terrah Qbank.
          </p>

        </div>

        <div className="mt-20 space-y-6">

          {faqs.map((faq, index) => {

            const isOpen = openIndex === index;

            return (

              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900"
              >

                <button
                  onClick={() =>
                    setOpenIndex(isOpen ? null : index)
                  }
                  className="flex w-full items-center justify-between px-8 py-6 text-left"
                >

                  <h3 className="text-lg font-semibold text-white">

                    {faq.question}

                  </h3>

                  <ChevronDown
                    className={`h-6 w-6 text-[#fe7402] transition ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />

                </button>

                <div
                  className={`grid transition-all duration-300 ${
                    isOpen
                      ? 'grid-rows-[1fr]'
                      : 'grid-rows-[0fr]'
                  }`}
                >

                  <div className="overflow-hidden">

                    <p className="px-8 pb-6 leading-8 text-slate-400">

                      {faq.answer}

                    </p>

                  </div>

                </div>

              </div>

            );

          })}

        </div>

      </div>

    </section>
  );
}