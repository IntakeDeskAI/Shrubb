import Link from 'next/link';
import { ShrubbLogo } from '@/components/shrubb-logo';
import PricingTable from '@/components/landing/pricing-table';
import FaqAccordion from '@/components/landing/faq-accordion';
import BeforeAfterSlider from '@/components/landing/before-after-slider';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ═══════════ NAV ═══════════ */}
      <header className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <ShrubbLogo size="default" color="green" />
          <nav className="hidden items-center gap-8 text-sm text-gray-500 sm:flex">
            <a href="#how-it-works" className="transition hover:text-gray-900">How it works</a>
            <a href="#pricing" className="transition hover:text-gray-900">Pricing</a>
            <a href="#examples" className="transition hover:text-gray-900">Examples</a>
            <a href="#faq" className="transition hover:text-gray-900">FAQ</a>
            <Link href="/auth/login" className="text-gray-700 hover:text-gray-900">Sign in</Link>
            <Link
              href="/start"
              className="rounded-lg bg-brand-500 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              Get my yard plan
            </Link>
          </nav>
          <Link
            href="/start"
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white sm:hidden"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative flex min-h-[580px] items-center justify-center overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-6 pt-28 pb-20">
        <div className="pointer-events-none absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Upload your yard. Get a climate&#8209;smart landscape plan{' '}
            <span className="text-brand-600">in minutes.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-600">
            Photo or address. Local plant list. Layout plan. Before&#8209;and&#8209;after renders.{' '}
            <strong className="text-gray-900">No subscription.</strong>
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/start"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
            >
              Get my plan
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="#examples"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              View examples
            </a>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Designed for your USDA zone and watering preference.
          </p>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF STRIP ═══════════ */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          {/* Testimonials */}
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { quote: 'Exactly what I wanted for my backyard redo. Saved me thousands on a designer.', name: 'Sarah M.', location: 'Austin, TX' },
              { quote: 'The plant list was perfect for my zone. Everything is thriving 6 months later.', name: 'James R.', location: 'Portland, OR' },
              { quote: 'Used the PDF to brief my contractor. He said it was the best plan he ever got from a homeowner.', name: 'Priya K.', location: 'Chicago, IL' },
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
            {['Zone-aware', 'Drought-friendly', 'Low maintenance options', 'Pet-safe filters'].map((badge) => (
              <span key={badge} className="rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">How it works</h2>
          <p className="mt-3 text-center text-gray-500">From photo to professional plan in 4 steps.</p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: '1', title: 'Upload a photo or enter your address', desc: 'Snap your yard or paste an address. We fetch satellite imagery automatically.' },
              { step: '2', title: 'Tell us your style, budget & maintenance level', desc: 'Modern? Cottage? Drought-tolerant? Low upkeep? We customize everything.' },
              { step: '3', title: 'Get 2–4 concepts and refine in chat', desc: 'AI generates multiple designs. Chat to tweak plants, materials, or layout.' },
              { step: '4', title: 'Download your plan and shopping list', desc: 'Export a PDF with layout, plant list, materials, and maintenance notes.' },
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
          <p className="mt-3 text-center text-gray-500">Before and after — powered by AI.</p>
          <div className="mt-12 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
            <BeforeAfterSlider />
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="aspect-[16/9] overflow-hidden rounded-xl border border-gray-200">
              <BeforeAfterSlider />
            </div>
            <div className="aspect-[16/9] overflow-hidden rounded-xl border border-gray-200">
              <BeforeAfterSlider />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">Simple, one&#8209;time pricing</h2>
          <p className="mt-3 text-center text-gray-500">
            No subscription. Pay once, own your plan forever.
          </p>
          <p className="mt-1 text-center text-xs text-gray-400">
            Each message triggers AI compute. Chat iterations are included per tier.
          </p>
          <div className="mt-12">
            <PricingTable />
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="border-t border-gray-100 bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">Frequently asked questions</h2>
          <div className="mt-12">
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Ready to transform your outdoor space?
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Upload your yard photo and get a professional landscape plan in minutes.
          </p>
          <Link
            href="/start"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
          >
            Get my yard plan
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
            <Link href="/auth/login" className="hover:text-gray-600">Sign in</Link>
          </nav>
          <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Shrubb. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
