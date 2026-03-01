"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "How does the free trial work?",
    answer:
      "Sign up and create your company — no credit card needed. You get 7 days with 3 proposals, 6 renders, and 15 chat messages. When the trial ends, pick a plan that fits your team.",
  },
  {
    question: "What do my clients see?",
    answer:
      "Clients receive an email with a link to a branded, hosted proposal page. They can view the renders, plant list, and layout — then click 'Accept' right from the page. You'll see when they view and accept.",
  },
  {
    question: "What inputs do I need to create a proposal?",
    answer:
      "Upload a few photos of the property or enter an address (we'll pull satellite imagery). Then fill out a short questionnaire about style, budget, climate zone, and plant preferences. The AI handles the rest.",
  },
  {
    question: "How accurate are the designs?",
    answer:
      "Designs use real plant species suited to the client's USDA zone, with accurate sizing and spacing. Renders are photorealistic enough to impress clients, though we recommend a site survey before major construction or grading.",
  },
  {
    question: "Can my whole team use Shrubb?",
    answer:
      "Yes — each plan includes multiple seats. Starter includes 3 users, Pro includes 8, and Growth includes 15. You can also purchase extra seats as add-ons. All team members share the company's proposal and render credits.",
  },
  {
    question: "What happens if I run out of proposals or renders?",
    answer:
      "You can purchase add-on packs anytime from Settings. A Proposal Pack adds 20 proposals for $79, and a Render Pack adds 25 renders for $59. Credits are added instantly.",
  },
  {
    question: "Can I customize proposals with my branding?",
    answer:
      "Your company name appears on all proposal pages and emails sent to clients. Full brand kit customization (logo, colors, templates) is available on Pro and Growth plans.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes — cancel from your Settings page at any time. Your plan stays active through the end of the billing period. No long-term contracts or cancellation fees.",
  },
];

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200 ${
        open ? "rotate-180" : "rotate-0"
      }`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-gray-200">
      <button
        type="button"
        className="flex w-full items-center justify-between py-5 text-left"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className="text-base font-medium text-gray-900">
          {item.question}
        </span>
        <ChevronIcon open={isOpen} />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm leading-relaxed text-gray-600">{item.answer}</p>
      </div>
    </div>
  );
}

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Frequently asked questions
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-center text-lg text-gray-600">
        Everything you need to know about Shrubb for your landscaping business.
      </p>

      <div className="mt-12">
        {FAQ_ITEMS.map((item, index) => (
          <AccordionItem
            key={item.question}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
          />
        ))}
      </div>
    </section>
  );
}
