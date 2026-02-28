import Link from 'next/link';

/* ───────── check / x icons for pricing ───────── */
function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ═══════════ NAV ═══════════ */}
      <header className="absolute top-0 z-50 w-full">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          {/* Logo */}
          <Link href="/" className="text-2xl font-light tracking-wide text-white">
            shrubb
          </Link>

          {/* Nav links */}
          <nav className="hidden items-center gap-8 text-sm text-white/80 sm:flex">
            <a href="#how-it-works" className="transition hover:text-white">how it works</a>
            <a href="#pricing" className="transition hover:text-white">pricing</a>
            <Link href="/auth/login" className="rounded-full border border-white/40 px-5 py-1.5 text-white transition hover:bg-white/10">
              log in
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button className="text-white sm:hidden" aria-label="Menu">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-gray-900 px-6 py-32 sm:min-h-[600px]">
        {/* Background — gradient simulating the lush garden photo */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-900 via-green-800 to-green-950 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,.25)_0%,transparent_70%)]" />
        {/* Noise overlay for texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl">
            Landscape Design Made Simple
          </h1>
          <p className="mt-4 text-lg text-white/70 sm:text-xl">
            Find and Work With Talented Designers
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Link
              href="/auth/signup"
              className="inline-block rounded-full bg-brand-500 px-10 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition hover:bg-brand-600"
            >
              Create a Contest
            </Link>
            <a href="#how-it-works" className="inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white/80">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/40">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </span>
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIAL ═══════════ */}
      <section className="border-b border-gray-100 bg-white px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-6 rounded-xl p-6">
            {/* Avatar placeholder */}
            <div className="hidden h-16 w-16 flex-shrink-0 rounded-full bg-brand-100 sm:block" />
            <div>
              <p className="text-gray-600 italic">
                &ldquo;I was very satisfied with the designs I received. The design community on Shrubb nailed it &mdash; all of my neighbors are jealous!!&rdquo;
              </p>
              <p className="mt-2 text-sm font-semibold text-gray-900">Brittney H.</p>
              <p className="text-xs text-gray-400">California</p>
            </div>
          </div>
          {/* Dots */}
          <div className="mt-4 flex justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-gray-200" />
          </div>
        </div>
      </section>

      {/* ═══════════ DESIGNERS DELIVER RESULTS ═══════════ */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">Our Designers Deliver Results</h2>
          <Link
            href="/auth/signup"
            className="mt-6 inline-block rounded-full bg-brand-500 px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-brand-600"
          >
            Find a Designer to Work With
          </Link>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              { name: 'Rob Smith', location: 'Santa Clara, CA' },
              { name: 'Gregory Jones', location: 'Chicago, IL' },
              { name: 'Diane Lane', location: 'New York, NY' },
            ].map((designer) => (
              <div key={designer.name} className="group text-center">
                {/* Portfolio image placeholder */}
                <div className="mx-auto aspect-[4/3] w-full overflow-hidden rounded-lg bg-gradient-to-br from-brand-100 to-brand-50">
                  <div className="flex h-full items-center justify-center">
                    <svg className="h-16 w-16 text-brand-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">{designer.name}</p>
                    <p className="text-xs text-gray-400">{designer.location}</p>
                  </div>
                </div>
                <a href="#" className="mt-1 text-xs font-semibold text-brand-500 hover:text-brand-600">
                  View {designer.name.split(' ')[0]}&apos;s Portfolio
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FEATURE HIGHLIGHT ═══════════ */}
      <section className="bg-gray-50 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="grid sm:grid-cols-2">
              <div className="flex flex-col justify-center p-8 sm:p-10">
                <h3 className="text-xl font-bold text-gray-900">Will It Thrive Here?</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">
                  Our designers take into account things like sunlight, seasonal temperatures, and watering needs to ensure your plantings thrive.
                </p>
                <div className="mt-6 flex gap-4">
                  {/* Sun icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                    <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                    </svg>
                  </div>
                  {/* Temp icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                    <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12l-.387.775c-.217.433-.132.956.21 1.298l1.348 1.348c.21.21.329.497.329.795v1.089c0 .426.24.815.622 1.006l.153.076c.433.217.956.132 1.298-.21l.723-.723a8.7 8.7 0 002.288-4.042 1.087 1.087 0 00-.358-1.099l-1.33-1.108c-.251-.21-.582-.299-.905-.245l-1.17.195a1.125 1.125 0 01-.98-.314l-.295-.295a1.125 1.125 0 010-1.591l.13-.132a1.125 1.125 0 011.3-.21l.603.302a.809.809 0 001.086-1.086L14.25 7.5l1.256-.837a4.5 4.5 0 001.528-1.732l.146-.292M6.115 5.19A9 9 0 1017.18 4.64M6.115 5.19A8.965 8.965 0 0112 3c1.929 0 3.716.607 5.18 1.64" />
                    </svg>
                  </div>
                  {/* Water icon */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                    <svg className="h-6 w-6 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                  </div>
                </div>
              </div>
              {/* Right side — concept preview placeholder */}
              <div className="flex items-center justify-center bg-gray-50 p-8">
                <div className="aspect-[4/3] w-full rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex h-full items-center justify-center text-xs text-gray-300">
                    Concept Preview
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Dots */}
          <div className="mt-6 flex justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
              <p className="mt-4 leading-relaxed text-gray-500">
                In a few simple steps, you&apos;ll tell us about your vision for your project. Our experienced designers will put together a specially-tailored plan that will look great from the day it&apos;s first planted until it&apos;s fully mature decades later.
              </p>
              <Link
                href="/auth/signup"
                className="mt-6 inline-block rounded-full bg-brand-500 px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-brand-600"
              >
                Choose a Package
              </Link>
            </div>
            {/* Video placeholder */}
            <div className="flex aspect-video items-center justify-center rounded-2xl bg-gray-900">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          </div>

          {/* 4 Steps */}
          <div className="mt-16 grid gap-8 border-t border-gray-100 pt-12 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: 'Create a Campaign',
                desc: 'Tell us where you live so we know which plants are the best fit for your region.',
              },
              {
                title: 'Start Your Contest',
                desc: 'See which shrubs will grow in your area and choose the ones you like.',
              },
              {
                title: 'Provide Feedback',
                desc: 'Tell us where you live so we know which plants are the best fit for your region.',
              },
              {
                title: 'Pick a Winning Design',
                desc: 'Tell us where you live so we know which plants are the best fit for your region.',
              },
            ].map((step) => (
              <div key={step.title}>
                <h3 className="text-sm font-bold text-gray-900 underline decoration-brand-500 underline-offset-4">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ EXPERT PLANNING ═══════════ */}
      <section className="border-t border-gray-100 bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Beautiful Landscape Requires Expert Planning
          </h2>
          <p className="mt-3 text-gray-500">
            Hiring an experienced landscape designer is an excellent investment: it will help ensure your yard looks beautiful as it grows and matures over decades.
          </p>
          {/* Before/After placeholder */}
          <div className="mt-10 flex items-center justify-center gap-1 overflow-hidden rounded-xl">
            <div className="aspect-[16/9] w-1/2 bg-gradient-to-br from-amber-100 to-amber-50">
              <div className="flex h-full items-center justify-center text-sm text-amber-300">Before</div>
            </div>
            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-brand-500 bg-white shadow">
              <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <div className="aspect-[16/9] w-1/2 bg-gradient-to-br from-brand-100 to-brand-50">
              <div className="flex h-full items-center justify-center text-sm text-brand-300">After</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-gray-900">Simple Pricing</h2>
          <p className="mt-3 text-gray-500">Start free, upgrade when you need more.</p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2">
            {/* Free */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-left">
              <h3 className="text-lg font-semibold text-gray-900">Free</h3>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><CheckIcon />1 project</li>
                <li className="flex items-start gap-2"><CheckIcon />AI concept generation</li>
                <li className="flex items-start gap-2"><CheckIcon />Unlimited revisions</li>
                <li className="flex items-start gap-2"><XIcon /><span className="text-gray-400">HD upscale &amp; PDF export</span></li>
              </ul>
              <Link href="/auth/signup" className="mt-8 block w-full rounded-full border border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
                Get Started
              </Link>
            </div>

            {/* Pro */}
            <div className="relative rounded-2xl border-2 border-brand-500 bg-white p-8 text-left shadow-lg shadow-brand-500/10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-4 py-1 text-xs font-semibold text-white">
                Most Popular
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Pro</h3>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900">$19</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-2"><CheckIcon />Unlimited projects</li>
                <li className="flex items-start gap-2"><CheckIcon />AI concept generation</li>
                <li className="flex items-start gap-2"><CheckIcon />Unlimited revisions</li>
                <li className="flex items-start gap-2"><CheckIcon />HD upscale &amp; PDF export</li>
              </ul>
              <Link href="/auth/signup" className="mt-8 block w-full rounded-full bg-brand-500 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600">
                Start Pro Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ AS SEEN ON ═══════════ */}
      <section className="border-t border-gray-100 px-6 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">As seen on</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-10 opacity-40 grayscale">
            <span className="text-lg font-bold text-gray-900">USA TODAY</span>
            <span className="text-lg font-extrabold tracking-widest text-gray-900">SHARK TANK</span>
            <span className="text-lg font-serif italic text-gray-900">Better Homes</span>
            <span className="text-lg font-bold text-gray-900">TechCrunch</span>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-gray-100 bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-start justify-between gap-8 sm:flex-row">
            {/* Links */}
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-900">Reviews</a>
              <a href="#" className="hover:text-gray-900">About</a>
              <Link href="/auth/signup" className="hover:text-gray-900">New Contest</Link>
              <a href="#" className="hover:text-gray-900">Contact Us</a>
              <a href="#" className="hover:text-gray-900">Become a Designer</a>
              <a href="#" className="hover:text-gray-900">Team</a>
            </div>

            {/* CTA */}
            <Link
              href="/auth/signup"
              className="rounded-full bg-brand-500 px-8 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-brand-600"
            >
              Create a Contest
            </Link>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-light tracking-wide text-gray-900">shrubb</span>
              <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} Shrubb. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
