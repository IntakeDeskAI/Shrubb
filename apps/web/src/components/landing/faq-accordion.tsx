"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Does the AI sound robotic on calls?",
    answer:
      "No. Shrubb uses a natural-sounding voice model trained on professional service conversations. It greets callers by your company name, asks about their project, and has real back-and-forth dialogue. If someone asks for a human, the call forwards to your phone immediately.",
  },
  {
    question: "What if the AI says something wrong to a customer?",
    answer:
      "The AI never quotes pricing, commits to schedules, or makes promises. It gathers information — project type, address, budget, timeline, and preferences — then saves it for you. You stay in control of every quote and commitment.",
  },
  {
    question: "How does the free trial work?",
    answer:
      "Sign up, create your company — no credit card needed. You get 7 days with 3 proposals, 6 renders, and 15 chat messages. Your AI phone number is provisioned in under 60 seconds. When the trial ends, pick the plan that fits.",
  },
  {
    question: "Do I need to change my existing phone number?",
    answer:
      "No. Shrubb gives you a separate dedicated local number. Put it on your yard signs, trucks, Google Business listing, and ads. Your personal number stays private. Calls can forward to you when needed.",
  },
  {
    question: "What do my clients see when I send a proposal?",
    answer:
      "A branded proposal page with photorealistic renders, plant list, layout, and a one-click Accept button. You see exactly when they open it and when they accept. If they view it but don't respond, Shrubb auto-nudges them via text.",
  },
  {
    question: "Can my whole crew use it?",
    answer:
      "Yes. Starter includes 3 users, Pro includes 8, Growth includes 15. All team members share the same dashboard, proposal credits, and AI phone number.",
  },
  {
    question: "What happens to my data?",
    answer:
      "Your data is yours. All call recordings, transcripts, and client information are stored securely and never shared. You can export or delete it anytime. We use enterprise-grade encryption in transit and at rest.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Cancel from your Settings page at any time. No long-term contracts, no cancellation fees. Your plan stays active through the end of the billing period.",
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
    <div>
      {FAQ_ITEMS.map((item, index) => (
        <AccordionItem
          key={item.question}
          item={item}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
        />
      ))}
    </div>
  );
}
