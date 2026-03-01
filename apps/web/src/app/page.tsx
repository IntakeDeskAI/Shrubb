import Link from 'next/link';
import { ShrubbLogo } from '@/components/shrubb-logo';
import PricingTable from '@/components/landing/pricing-table';
import FaqAccordion from '@/components/landing/faq-accordion';
import BeforeAfterSlider from '@/components/landing/before-after-slider';
import {
  OrganizationSchema,
  SoftwareApplicationSchema,
  FaqPageSchema,
} from '@/components/seo/json-ld';

const HOME_FAQ_ITEMS = [
  { question: 'How does the free trial work?', answer: 'Sign up and create your company — no credit card needed. You get 7 days with 3 proposals, 6 renders, and 15 chat messages. When the trial ends, pick a plan that fits your team.' },
  { question: 'What do my clients see?', answer: 'Clients receive an email with a link to a branded, hosted proposal page. They can view the renders, plant list, and layout — then click Accept right from the page. You see when they view and accept.' },
  { question: 'What inputs do I need to create a proposal?', answer: 'Upload a few photos of the property or enter an address (we pull satellite imagery). Then fill out a short questionnaire about style, budget, climate zone, and plant preferences. The AI handles the rest.' },
  { question: 'How accurate are the designs?', answer: 'Designs use real plant species suited to the client USDA zone, with accurate sizing and spacing. Renders are photorealistic enough to impress clients, though we recommend a site survey before major construction.' },
  { question: 'Can my whole team use Shrubb?', answer: 'Yes — each plan includes multiple seats. Starter includes 3 users, Pro includes 8, and Growth includes 15. All team members share the company proposal and render credits.' },
  { question: 'What happens if I run out of proposals or renders?', answer: 'You can purchase add-on packs anytime from Settings. A Proposal Pack adds 20 proposals for $79, and a Render Pack adds 25 renders for $59. Credits are added instantly.' },
  { question: 'Can I customize proposals with my branding?', answer: 'Your company name appears on all proposal pages and emails sent to clients. Full brand kit customization (logo, colors, templates) is available on Pro and Growth plans.' },
  { question: 'Can I cancel anytime?', answer: 'Yes — cancel from your Settings page at any time. Your plan stays active through the end of the billing period. No long-term contracts or cancellation fees.' },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <OrganizationSchema />
      <SoftwareApplicationSchema />
      <FaqPageSchema items={HOME_FAQ_ITEMS} />
      {/* ═══════════ NAV ═══════════ */}
      <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <ShrubbLogo size="default" color="green" />
          <nav className="hidden items-center gap-8 text-sm text-gray-500 sm:flex">
            <a href="#how-it-works" className="transition hover:text-gray-900">How it works</a>
            <a href="#pricing" className="transition hover:text-gray-900">Pricing</a>
            <a href="#examples" className="transition hover:text-gray-900">Examples</a>
            <a href="#faq" className="transition hover:text-gray-900">FAQ</a>
            <Link href="/login" className="text-gray-700 hover:text-gray-900">Sign in</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              Start landscaper trial
            </Link>
          </nav>
          <Link
            href="/signup"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white sm:hidden"
          >
            Start landscaper trial
          </Link>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative flex min-h-[580px] items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-6 pt-28 pb-20">
        <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            AI proposals for landscapers that{' '}
            <span className="text-brand-600">close more jobs.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Built for landscaping and design&nbsp;build teams. Upload a client&apos;s yard photo or
            address and generate a branded proposal with renders, plant list, and an accept button
            in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
            >
              Start landscaper trial
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#examples"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              View a sample client proposal
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            7-day free trial. No credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ═══════════ IDEAL FOR STRIP ═══════════ */}
      <section className="border-b border-gray-100 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-4">
          <span className="text-sm font-medium text-gray-400">Ideal for:</span>
          {[
            { icon: '🌿', label: 'Design build landscapers' },
            { icon: '🧱', label: 'Hardscape & pavers' },
            { icon: '💧', label: 'Irrigation & lighting crews' },
          ].map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700"
            >
              <span aria-hidden="true">{chip.icon}</span>
              {chip.label}
            </span>
          ))}
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF STRIP ═══════════ */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="mb-6 text-center text-sm font-medium text-gray-500">
            Trusted by landscaping companies across the US
          </p>
          {/* Testimonials */}
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { quote: 'Closed a $12K backyard remodel after sending the AI proposal. Client said it was the most professional pitch they received.', name: 'Mike T.', location: 'Austin, TX' },
              { quote: 'We used to spend 3 hours per proposal. Now it takes 15 minutes — and the renders blow clients away.', name: 'Sarah L.', location: 'Portland, OR' },
              { quote: 'Shrubb paid for itself on the first job. The plant list and layout plan are exactly what my crew needs to start work.', name: 'Carlos M.', location: 'Denver, CO' },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-gray-100 bg-white p-5">
                <p className="text-sm italic text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-3 text-sm font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-400">{t.location}</p>
              </div>
            ))}
          </div>
          {/* Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {['Zone-aware plants', 'Branded proposals', 'Client tracking', 'Instant PDF export'].map((badge) => (
              <span key={badge} className="rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ROI ANCHOR ═══════════ */}
      <section className="border-b border-gray-100 bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Close one extra $3,000 job a month &mdash; Shrubb pays for itself.
          </h2>
          <p className="mt-3 text-gray-500">
            Most teams recoup the cost within the first week.
          </p>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">How it works</h2>
          <p className="mt-3 text-center text-gray-500">From client lead to signed proposal in 4 steps.</p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '1', title: 'Add a client & upload their yard', desc: 'Snap a photo of the property or enter an address. Shrubb fetches satellite imagery automatically.' },
              { step: '2', title: 'Set style, budget & plant preferences', desc: 'Modern? Drought-tolerant? Low maintenance? Customize every detail for your client.' },
              { step: '3', title: 'AI generates designs — refine in chat', desc: 'Get multiple design concepts with photorealistic renders. Chat to tweak plants, materials, or layout.' },
              { step: '4', title: 'Send a branded proposal to your client', desc: 'One click sends a hosted proposal page with renders, plant list, and accept button.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-xl font-bold text-brand-600">
                  {s.step}
                </div>
                <h3 className="mt-4 text-sm font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ EXAMPLES GALLERY ═══════════ */}
      <section id="examples" className="border-t border-gray-100 bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">See the difference</h2>
          <p className="mt-3 text-center text-gray-500">Before and after &mdash; powered by AI.</p>
          <div className="mt-12 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <BeforeAfterSlider />
          </div>
          {/* ── Proposal page mockup ── */}
          <div className="mt-12">
            <h3 className="text-center text-xl font-semibold text-gray-900">
              What your client sees
            </h3>
            <p className="mt-2 text-center text-sm text-gray-500">
              A branded proposal page with renders, plant list, and one-click accept.
            </p>
            <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              <div className="bg-brand-600 px-6 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">Proposal from</p>
                <p className="text-lg font-bold text-white">Your Landscaping Co.</p>
              </div>
              <div className="space-y-4 px-6 py-6">
                <div className="aspect-[16/9] rounded-lg bg-gradient-to-br from-brand-100 to-brand-50 flex items-center justify-center">
                  <span className="text-sm font-medium text-brand-600">Design render preview</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-xs text-gray-400">Estimated total</p>
                    <p className="text-xl font-bold text-gray-900">$4,250</p>
                  </div>
                  <div className="rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm">
                    Accept Proposal
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">12 plants</span>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">3 renders</span>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">PDF included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">Simple monthly pricing</h2>
          <p className="mt-3 text-center text-gray-500">
            Start with a 7-day free trial. Upgrade, downgrade, or cancel anytime.
          </p>
          <p className="mt-1 text-center text-xs text-gray-400">
            Each proposal uses AI compute. Usage is included per plan, with add-on packs available.
          </p>
          <div className="mt-12">
            <PricingTable />
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="border-t border-gray-100 bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mt-12">
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Ready to close more landscaping jobs?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Join landscapers using Shrubb to create stunning proposals and win more clients.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
          >
            Start your landscaper trial
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-light tracking-wide text-gray-900">shrubb</span>
          <nav className="flex gap-6 text-sm text-gray-400">
            <a href="#how-it-works" className="hover:text-gray-600">How it works</a>
            <a href="#pricing" className="hover:text-gray-600">Pricing</a>
            <a href="#faq" className="hover:text-gray-600">FAQ</a>
            <Link href="/login" className="hover:text-gray-600">Sign in</Link>
          </nav>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Shrubb. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
