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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <ShrubbLogo size="default" color="green" />
          <nav className="hidden items-center gap-8 text-sm text-gray-500 sm:flex">
            <a href="#how-it-works" className="transition hover:text-gray-900">How it works</a>
            <a href="#pricing" className="transition hover:text-gray-900">Pricing</a>
            <a href="#examples" className="transition hover:text-gray-900">Examples</a>
            <a href="#faq" className="transition hover:text-gray-900">FAQ</a>
            <Link href="/login" className="text-gray-700 hover:text-gray-900">Sign in</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Start landscaper trial
            </Link>
          </nav>
          <Link
            href="/signup"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white sm:hidden"
          >
            Try free
          </Link>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════
        Mobile-first: generous top padding to clear nav + safe area.
        Tight vertical rhythm — no dead space.
        One dominant CTA. Secondary demoted to text link.
      ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 to-white px-5 pt-28 pb-10 sm:px-6 sm:pt-32 sm:pb-16 lg:pt-36 lg:pb-20">
        <div className="pointer-events-none absolute top-0 left-1/2 h-[320px] w-[480px] -translate-x-1/2 rounded-full bg-brand-100/50 blur-3xl sm:h-[500px] sm:w-[800px]" />
        <div className="relative z-10 mx-auto max-w-2xl text-center lg:max-w-3xl">
          <h1 className="text-[28px] font-extrabold leading-[1.15] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            AI proposals for landscapers that{' '}
            <span className="text-brand-600">close more jobs.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-gray-700 sm:mt-5 sm:max-w-2xl sm:text-lg">
            Built for landscaping and design&nbsp;build teams. Upload a client&apos;s yard photo,
            generate a branded proposal with renders, plant list, and accept button — in minutes.
          </p>
          <p className="mx-auto mt-2 max-w-xl text-[14px] leading-relaxed font-medium text-gray-800 sm:max-w-2xl sm:text-base">
            Get a dedicated Shrubb number that texts leads instantly and answers inbound calls with AI.
          </p>

          {/* Primary CTA — full width on mobile, auto on desktop */}
          <Link
            href="/signup"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-[15px] font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 sm:mt-8 sm:w-auto sm:px-10 sm:py-4 sm:text-base"
          >
            Start landscaper trial — free for 7 days
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          {/* Micro trust + secondary link — tight under CTA */}
          <p className="mt-2.5 text-xs text-gray-400 sm:text-sm">
            No credit card required &middot; Cancel anytime &middot;{' '}
            <a href="#examples" className="text-brand-600 underline underline-offset-2 hover:text-brand-700">
              See a sample proposal
            </a>
          </p>

          {/* Proof strip */}
          <p className="mt-4 text-[11px] tracking-wide text-gray-400 sm:text-xs">
            Dedicated local number &middot; SMS + inbound calls &middot; Transcripts saved &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* ═══════════ YOUR SHRUBB AI NUMBER ═══════════ */}
      <section className="border-b border-gray-100 bg-white px-5 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold text-gray-900 sm:text-3xl">Your Shrubb AI number</h2>
          <ul className="mx-auto mt-5 max-w-md space-y-3 text-left text-[14px] text-gray-700 sm:text-base">
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">1</span>
              Shrubb assigns your business a local number
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">2</span>
              AI replies to texts and answers inbound calls
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">3</span>
              Every conversation is saved with transcripts and summaries
            </li>
          </ul>

          {/* Demo button */}
          <a
            href="#ai-demo"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            See AI texting + call handling demo
          </a>
        </div>
      </section>

      {/* ═══════════ AI DEMO — static screenshots ═══════════ */}
      <section id="ai-demo" className="border-b border-gray-100 bg-gray-50/80 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-4xl">
          <h3 className="text-center text-lg font-bold text-gray-900 sm:text-xl">AI SMS + Call Handling</h3>
          <p className="mt-1 text-center text-xs text-gray-500 sm:text-sm">
            See how Shrubb handles inbound leads automatically.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-6">
            {/* Screenshot 1: Call log */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100">
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <p className="mt-2 text-xs font-semibold text-brand-700">Call Log</p>
                </div>
              </div>
              <p className="mt-3 text-center text-xs font-medium text-gray-600">Inbound calls answered by AI</p>
            </div>

            {/* Screenshot 2: Transcript */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100">
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <p className="mt-2 text-xs font-semibold text-brand-700">Transcript</p>
                </div>
              </div>
              <p className="mt-3 text-center text-xs font-medium text-gray-600">Full transcript saved automatically</p>
            </div>

            {/* Screenshot 3: Lead created */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-brand-100">
                <div className="text-center">
                  <svg className="mx-auto h-8 w-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                  <p className="mt-2 text-xs font-semibold text-brand-700">Lead Created</p>
                </div>
              </div>
              <p className="mt-3 text-center text-xs font-medium text-gray-600">New lead added to your CRM</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ IDEAL FOR — tight, compact, no dead space ═══════════ */}
      <section className="border-b border-gray-100 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">Ideal for</span>
          {[
            { icon: '🌿', label: 'Design-build' },
            { icon: '🧱', label: 'Hardscape & pavers' },
            { icon: '💧', label: 'Irrigation & lighting' },
          ].map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-600 sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <span aria-hidden="true">{chip.icon}</span>
              {chip.label}
            </span>
          ))}
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF — immediately after hero ═══════════ */}
      <section className="border-b border-gray-100 bg-gray-50/80 px-4 py-6 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:mb-5 sm:text-xs">
            Trusted by landscaping companies across the US
          </p>
          <div className="grid gap-3 sm:grid-cols-3 sm:gap-5">
            {[
              { quote: 'Closed a $12K backyard remodel after sending the AI proposal. Client said it was the most professional pitch they received.', name: 'Mike T.', location: 'Austin, TX' },
              { quote: 'We used to spend 3 hours per proposal. Now it takes 15 minutes — and the renders blow clients away.', name: 'Sarah L.', location: 'Portland, OR' },
              { quote: 'Shrubb paid for itself on the first job. The plant list and layout plan are exactly what my crew needs to start work.', name: 'Carlos M.', location: 'Denver, CO' },
            ].map((t) => (
              <div key={t.name} className="rounded-lg border border-gray-100 bg-white p-3.5 sm:rounded-xl sm:p-5">
                <p className="text-[13px] leading-snug text-gray-700 sm:text-sm sm:leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <p className="mt-2 text-[13px] font-bold text-gray-900 sm:mt-3 sm:text-sm">{t.name}</p>
                <p className="text-[11px] text-gray-400 sm:text-xs">{t.location}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:mt-6 sm:gap-3">
            {['Zone-aware plants', 'Branded proposals', 'Client tracking', 'PDF export'].map((badge) => (
              <span key={badge} className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 sm:px-3.5 sm:py-1 sm:text-xs">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ROI ANCHOR ═══════════ */}
      <section className="bg-white px-5 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold text-gray-900 sm:text-3xl">
            Close one extra $3,000 job a month — Shrubb pays for itself.
          </h2>
          <p className="mt-2 text-sm text-gray-500 sm:mt-3">
            Most teams recoup the cost within the first week.
          </p>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="border-t border-gray-100 px-5 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-4xl">How it works</h2>
          <p className="mt-2 text-center text-sm text-gray-500 sm:mt-3">From client lead to signed proposal in 4 steps.</p>
          <div className="mt-8 grid gap-6 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4 sm:gap-8">
            {[
              { step: '1', title: 'Add a client & upload their yard', desc: 'Snap a photo of the property or enter an address. Shrubb fetches satellite imagery automatically.', tip: 'Tip: address lookup auto-fetches Google satellite view' },
              { step: '2', title: 'Set style, budget & plant preferences', desc: 'Modern? Drought-tolerant? Low maintenance? Customize every detail for your client.', tip: 'Tip: save presets for your most common project types' },
              { step: '3', title: 'AI generates designs — refine in chat', desc: 'Get multiple design concepts with photorealistic renders. Chat to tweak plants, materials, or layout.', tip: 'Tip: ask the AI to swap materials or resize beds' },
              { step: '4', title: 'Send a branded proposal to your client', desc: 'One click sends a hosted proposal page with renders, plant list, and accept button.', tip: 'Tip: you get notified when your client views or accepts' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-lg font-bold text-brand-700 sm:h-14 sm:w-14 sm:rounded-2xl sm:text-xl">
                  {s.step}
                </div>
                <h3 className="mt-3 text-[13px] font-bold text-gray-900 sm:mt-4 sm:text-sm">{s.title}</h3>
                <p className="mt-1.5 text-[13px] leading-snug text-gray-500 sm:mt-2 sm:text-sm sm:leading-relaxed">{s.desc}</p>
                <p className="mt-2 rounded-md bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-700 sm:mt-3 sm:text-xs">
                  {s.tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ EXAMPLES GALLERY ═══════════ */}
      <section id="examples" className="border-t border-gray-100 bg-gray-50 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-4xl">See the difference</h2>
          <p className="mt-2 text-center text-sm text-gray-500 sm:mt-3">Before and after — powered by AI.</p>
          <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 shadow-sm sm:mt-10 sm:rounded-2xl">
            <BeforeAfterSlider />
          </div>

          {/* ── Proposal page mockup ── */}
          <div className="mt-8 sm:mt-12">
            <h3 className="text-center text-lg font-bold text-gray-900 sm:text-xl">
              What your client sees
            </h3>
            <p className="mt-1 text-center text-xs text-gray-500 sm:mt-2 sm:text-sm">
              A branded proposal page with renders, plant list, and one-click accept.
            </p>
            <div className="mx-auto mt-4 max-w-sm overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg sm:mt-6 sm:max-w-md sm:rounded-2xl">
              <div className="bg-brand-700 px-4 py-3 sm:px-6 sm:py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-200 sm:text-xs">Proposal from</p>
                <p className="text-base font-bold text-white sm:text-lg">Your Landscaping Co.</p>
              </div>
              <div className="space-y-3 px-4 py-4 sm:space-y-4 sm:px-6 sm:py-6">
                <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-brand-50">
                  <span className="text-xs font-semibold text-brand-600 sm:text-sm">Design render preview</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 sm:pt-4">
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 sm:text-xs">Estimated total</p>
                    <p className="text-lg font-bold text-gray-900 sm:text-xl">$4,250</p>
                  </div>
                  <div className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm sm:px-6 sm:py-2.5 sm:text-sm">
                    Accept Proposal
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 sm:text-xs sm:py-1">12 plants</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 sm:text-xs sm:py-1">3 renders</span>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 sm:text-xs sm:py-1">PDF included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-4xl">Simple monthly pricing</h2>
          <p className="mt-2 text-center text-sm text-gray-500 sm:mt-3">
            Start with a 7-day free trial. Upgrade, downgrade, or cancel anytime.
          </p>
          <p className="mt-1 text-center text-[11px] text-gray-400 sm:text-xs">
            Each proposal uses AI compute. Usage is included per plan, with add-on packs available.
          </p>
          <div className="mt-8 sm:mt-12">
            <PricingTable />
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="border-t border-gray-100 bg-gray-50 px-4 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <FaqAccordion />
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="px-5 py-12 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-4xl">
            Ready to close more landscaping jobs?
          </h2>
          <p className="mt-3 text-sm text-gray-500 sm:mt-4 sm:text-lg">
            Join landscapers using Shrubb to create stunning proposals and win more clients.
          </p>
          <Link
            href="/signup"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 sm:mt-8 sm:w-auto sm:px-10 sm:py-4 sm:text-base"
          >
            Start your landscaper trial
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-gray-100 bg-white px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row sm:gap-4">
          <span className="text-sm font-light tracking-wide text-gray-900">shrubb</span>
          <nav className="flex flex-wrap justify-center gap-4 text-xs text-gray-400 sm:gap-6 sm:text-sm">
            <a href="#how-it-works" className="hover:text-gray-600">How it works</a>
            <a href="#pricing" className="hover:text-gray-600">Pricing</a>
            <a href="#faq" className="hover:text-gray-600">FAQ</a>
            <Link href="/login" className="hover:text-gray-600">Sign in</Link>
          </nav>
          <p className="text-[11px] text-gray-400 sm:text-xs">&copy; {new Date().getFullYear()} Shrubb. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
