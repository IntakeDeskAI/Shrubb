"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What inputs are needed?",
    answer:
      "You'll upload a few photos of your yard and answer a short questionnaire about your style preferences, budget, climate zone, and any special requirements. The more detail you provide, the more tailored your design will be.",
  },
  {
    question: "How accurate are the designs?",
    answer:
      "Our AI generates designs based on your photos, local climate data, and plant databases. While the layouts are highly detailed and use real plant species suited to your zone, we recommend a professional site survey before major construction or grading work.",
  },
  {
    question: "What's the refund policy?",
    answer:
      "If you're not satisfied with your initial concepts, contact us within 7 days of delivery. We'll work with you to revise the design or issue a full refund — no questions asked.",
  },
  {
    question: "Can I edit after generation?",
    answer:
      "Yes! Use the chat feature to request changes, swap plants, adjust bed shapes, and more. Your plan includes a set number of chat iterations depending on your tier, and you can purchase additional message packs anytime.",
  },
  {
    question: "What if I have an HOA?",
    answer:
      "Let us know during the questionnaire. We'll factor in common HOA requirements like approved plant lists, fence heights, and setback rules. You can also upload your HOA guidelines for more precise compliance.",
  },
  {
    question: "What about slope and drainage?",
    answer:
      "Our designs account for basic grading visible in your photos. For significant slopes or known drainage issues, mention them in your notes and we'll incorporate terracing, rain gardens, or French drains as appropriate.",
  },
  {
    question: "Can I use my own plants?",
    answer:
      "Absolutely. During the chat phase, tell the AI which existing plants you'd like to keep or specific species you want included. The design will integrate them into the overall layout.",
  },
  {
    question: "Are designs pet-safe?",
    answer:
      "Yes — just check the pet-safe option in your preferences. The AI will avoid toxic species (like lilies for cats or sago palms for dogs) and can suggest pet-friendly ground covers and fencing ideas.",
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
        Everything you need to know about Shrubb AI yard planning.
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
