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
  { question: 'Does the AI sound robotic on calls?', answer: 'No. Shrubb uses a natural-sounding voice model trained on professional service conversations. It greets callers by your company name, asks about their project, and has real back-and-forth dialogue. If someone asks for a human, the call forwards to your phone immediately.' },
  { question: 'What if the AI says something wrong to a customer?', answer: 'The AI never quotes pricing, commits to schedules, or makes promises. It gathers information — project type, address, timeline, and preferences — then saves it for you. You stay in control of every quote and commitment.' },
  { question: 'How does the free trial work?', answer: 'Sign up, create your company — no credit card needed. You get 7 days with 3 proposals, 6 renders, and 15 chat messages. Your AI phone number is provisioned in under 60 seconds. When the trial ends, pick the plan that fits.' },
  { question: 'Do I need to change my existing phone number?', answer: 'No. Shrubb gives you a separate dedicated local number. Put it on your yard signs, trucks, Google Business listing, and ads. Your personal number stays private. Calls can forward to you when needed.' },
  { question: 'What do my clients see when I send a proposal?', answer: 'A branded proposal page with photorealistic renders, plant list, layout, and a one-click Accept button. You can see exactly when they open it and when they accept. If they view it but don\'t respond, Shrubb auto-nudges them via text.' },
  { question: 'Can my whole crew use it?', answer: 'Yes. Starter includes 3 users, Pro includes 8, Growth includes 15. All team members share the same dashboard, proposal credits, and AI phone number.' },
  { question: 'What happens to my data?', answer: 'Your data is yours. All call recordings, transcripts, and client information are stored securely and never shared. You can export or delete it anytime. We use enterprise-grade encryption in transit and at rest.' },
  { question: 'Can I cancel anytime?', answer: 'Yes. Cancel from your Settings page at any time. No long-term contracts, no cancellation fees. Your plan stays active through the end of the billing period.' },
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
            <a href="#proof" className="transition hover:text-gray-900">Results</a>
            <a href="#faq" className="transition hover:text-gray-900">FAQ</a>
            <Link href="/blog" className="transition hover:text-gray-900">Blog</Link>
            <Link href="/login" className="text-gray-700 hover:text-gray-900">Sign in</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              Start free trial
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

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-950 to-gray-900 px-5 pt-28 pb-16 sm:px-6 sm:pt-36 sm:pb-24">
        {/* Subtle green accent glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-brand-500/10 blur-[120px] sm:h-[500px] sm:w-[900px]" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400 sm:text-sm">
            AI office manager for landscaping companies
          </p>
          <h1 className="mt-4 text-[32px] font-extrabold leading-[1.1] tracking-tight text-white sm:mt-6 sm:text-5xl lg:text-[56px]">
            Turn every missed call into a{' '}
            <span className="text-brand-400">booked job</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-gray-300 sm:mt-6 sm:text-lg">
            Shrubb answers your calls, replies to texts, qualifies leads, and sends proposals —
            so you close more jobs without leaving the job site.
          </p>

          {/* CTA */}
          <Link
            href="/signup"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-400 sm:mt-10 sm:w-auto sm:px-12 sm:py-4 sm:text-lg"
          >
            Start free trial
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-3 text-sm text-gray-500">No credit card. AI number live in 60 seconds.</p>

          {/* 3-bullet benefit stack */}
          <div className="mx-auto mt-8 flex max-w-lg flex-col gap-3 text-left sm:mt-10 sm:flex-row sm:gap-6">
            {[
              { icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z', text: 'AI answers every call and text 24/7' },
              { icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z', text: 'Qualifies leads and gets job details' },
              { icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z', text: 'Sends proposals and follows up' },
            ].map((b) => (
              <div key={b.text} className="flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2">
                <svg className="h-5 w-5 shrink-0 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                </svg>
                <p className="text-sm font-medium text-gray-300">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ PRODUCT MOCKUPS — 4 real UI frames ═══════════ */}
      <section className="border-b border-gray-100 bg-gray-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            This is what Shrubb actually looks like
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Real product. Real screenshots.
          </h2>

          <div className="mt-10 grid gap-6 sm:mt-14 sm:grid-cols-2 sm:gap-8">
            {/* Mockup 1: AI call transcript */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="ml-2 text-[11px] text-gray-400">Shrubb Dashboard</span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Inbound Call</p>
                    <p className="mt-0.5 text-lg font-bold text-gray-900">Sarah Johnson</p>
                    <p className="text-xs text-gray-400">(208) 555-0147 &middot; 4m 32s &middot; Today 2:15 PM</p>
                  </div>
                  <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">Completed</span>
                </div>
                <div className="mt-4 rounded-lg bg-gray-50 p-4">
                  <p className="text-xs font-semibold text-gray-500">AI Summary</p>
                  <p className="mt-1 text-sm text-gray-700">Homeowner interested in a backyard patio with fire pit. Property at 742 Elm St, Boise. Budget $5K-8K. Wants to start before summer. Requested proposal.</p>
                </div>
                <div className="mt-3 rounded-lg border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-500">Transcript</p>
                  <div className="mt-2 space-y-2 text-xs">
                    <p><span className="font-semibold text-brand-600">AI:</span> <span className="text-gray-600">Hi, thanks for calling Greenscape Landscaping! I&apos;m the AI assistant. What kind of project are you thinking about?</span></p>
                    <p><span className="font-semibold text-gray-700">Caller:</span> <span className="text-gray-600">Yeah, I need a patio built in my backyard. With a fire pit area.</span></p>
                    <p><span className="font-semibold text-brand-600">AI:</span> <span className="text-gray-600">That sounds great! Can I get your property address so we can take a look?</span></p>
                    <p className="text-gray-400 italic">... full transcript saved</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup 2: SMS conversation */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="ml-2 text-[11px] text-gray-400">SMS Inbox</span>
              </div>
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">Text Conversation</p>
                    <p className="mt-0.5 text-lg font-bold text-gray-900">Mike Rivera</p>
                    <p className="text-xs text-gray-400">(208) 555-0293 &middot; Via your Shrubb number</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">3s response</span>
                </div>
                <div className="mt-4 space-y-3">
                  {/* Inbound */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5">
                      <p className="text-sm text-gray-800">Hey, I saw your truck on Oak St. Do you guys do retaining walls?</p>
                      <p className="mt-1 text-[10px] text-gray-400">9:47 PM</p>
                    </div>
                  </div>
                  {/* Outbound AI */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5">
                      <p className="text-sm text-white">Hi Mike! Yes, we do retaining walls. What area of your yard are you looking at? And can you share your property address so we can take a look?</p>
                      <p className="mt-1 text-[10px] text-brand-200">9:47 PM &middot; AI</p>
                    </div>
                  </div>
                  {/* Inbound */}
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2.5">
                      <p className="text-sm text-gray-800">Side yard, it&apos;s eroding. 1205 Maple Dr, Meridian</p>
                      <p className="mt-1 text-[10px] text-gray-400">9:48 PM</p>
                    </div>
                  </div>
                  {/* Outbound AI */}
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5">
                      <p className="text-sm text-white">Got it! We&apos;ll put together a detailed proposal for 1205 Maple Dr. What&apos;s your budget range? And when are you hoping to get started?</p>
                      <p className="mt-1 text-[10px] text-brand-200">9:48 PM &middot; AI</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup 3: Proposal preview */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="ml-2 text-[11px] text-gray-400">Client Proposal View</span>
              </div>
              <div className="bg-brand-700 px-5 py-4 sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-200">Proposal from</p>
                <p className="text-lg font-bold text-white">Greenscape Landscaping</p>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                <div className="flex aspect-[16/9] items-center justify-center rounded-lg bg-gradient-to-br from-brand-100 to-brand-50">
                  <div className="text-center">
                    <svg className="mx-auto h-8 w-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                    <p className="mt-2 text-xs font-semibold text-brand-600">Photorealistic render of backyard patio</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-[10px] font-medium text-gray-400">Estimated total</p>
                    <p className="text-xl font-bold text-gray-900">$6,750</p>
                  </div>
                  <div className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm">
                    Accept Proposal
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">8 plants</span>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">3 renders</span>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">PDF included</span>
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">One-click accept</span>
                </div>
              </div>
            </div>

            {/* Mockup 4: Dashboard with leads */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-200/50">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                </div>
                <span className="ml-2 text-[11px] text-gray-400">Dashboard Overview</span>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">This Week</p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-brand-50 p-3 text-center">
                    <p className="text-2xl font-extrabold text-brand-600">12</p>
                    <p className="text-[10px] font-medium text-gray-500">Leads captured</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <p className="text-2xl font-extrabold text-green-600">4s</p>
                    <p className="text-[10px] font-medium text-gray-500">Avg response</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-center">
                    <p className="text-2xl font-extrabold text-amber-600">$34K</p>
                    <p className="text-[10px] font-medium text-gray-500">Pipeline value</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-500">Recent Leads</p>
                  {[
                    { name: 'Sarah Johnson', type: 'Patio + fire pit', time: '2 hrs ago', status: 'Proposal sent', statusColor: 'text-blue-600 bg-blue-50' },
                    { name: 'Mike Rivera', type: 'Retaining wall', time: '5 hrs ago', status: 'Qualified', statusColor: 'text-amber-600 bg-amber-50' },
                    { name: 'Lisa Chen', type: 'Full yard redesign', time: 'Yesterday', status: 'Accepted', statusColor: 'text-green-600 bg-green-50' },
                  ].map((lead) => (
                    <div key={lead.name} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
                        <p className="text-[11px] text-gray-400">{lead.type} &middot; {lead.time}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${lead.statusColor}`}>{lead.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SOCIAL PROOF NUMBERS ═══════════ */}
      <section className="border-b border-gray-100 bg-white px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-4 sm:gap-8">
          {[
            { stat: '78%', label: 'of homeowners hire the first company that responds' },
            { stat: '21x', label: 'more likely to close when you respond in 5 min vs. 30 min' },
            { stat: '17+ hrs', label: 'average landscaper response time to new leads' },
            { stat: '< 5 sec', label: 'Shrubb average response time to inbound leads' },
          ].map((s) => (
            <div key={s.stat} className="text-center">
              <p className="text-3xl font-extrabold text-gray-900 sm:text-4xl">{s.stat}</p>
              <p className="mt-1 text-xs leading-snug text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section id="how-it-works" className="bg-white px-5 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-brand-600">How it works</p>
          <h2 className="mt-3 text-center text-2xl font-bold text-gray-900 sm:text-4xl">
            Three steps. Zero missed leads.
          </h2>

          <div className="mt-12 space-y-16 sm:mt-16 sm:space-y-24">
            {/* Step 1 */}
            <div className="grid items-center gap-8 sm:grid-cols-2 sm:gap-12">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-lg font-extrabold text-brand-700">1</div>
                <h3 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl">AI answers every call and text</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-500">
                  A homeowner calls your Shrubb number. AI picks up in 3 seconds, greets them by your company name,
                  and has a natural conversation about their project. Texts get instant replies. Nights, weekends, holidays — covered.
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-600">
                  You keep installing that patio. Shrubb catches the lead.
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:p-5">
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100">
                      <svg className="h-4 w-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Incoming Call</p>
                      <p className="text-[10px] text-gray-400">(208) 555-0147 &middot; Ringing...</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2 text-xs">
                    <p className="rounded-lg bg-white px-3 py-2 text-gray-600"><span className="font-semibold text-brand-600">AI:</span> &quot;Hi, thanks for calling Greenscape Landscaping! What kind of project are you thinking about?&quot;</p>
                    <p className="rounded-lg bg-white px-3 py-2 text-gray-600"><span className="font-semibold text-gray-700">Caller:</span> &quot;I need a patio built in my backyard, maybe with a fire pit.&quot;</p>
                    <p className="rounded-lg bg-white px-3 py-2 text-gray-600"><span className="font-semibold text-brand-600">AI:</span> &quot;Great choice! Can I get your property address so we can take a look at the space?&quot;</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid items-center gap-8 sm:grid-cols-2 sm:gap-12">
              <div className="order-2 sm:order-1">
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:p-5">
                  <p className="text-xs font-semibold text-gray-400">Lead Details — Auto-captured</p>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-xs text-gray-500">Name</span>
                      <span className="text-sm font-semibold text-gray-900">Sarah Johnson</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-xs text-gray-500">Project</span>
                      <span className="text-sm font-semibold text-gray-900">Backyard patio + fire pit</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-xs text-gray-500">Address</span>
                      <span className="text-sm font-semibold text-gray-900">742 Elm St, Boise</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-xs text-gray-500">Budget</span>
                      <span className="text-sm font-semibold text-gray-900">$5,000 - $8,000</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-xs text-gray-500">Timeline</span>
                      <span className="text-sm font-semibold text-gray-900">Before summer</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-xs text-gray-500">Response time</span>
                      <span className="text-sm font-bold text-brand-600">3 seconds</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full rounded-lg bg-brand-600 py-2 text-sm font-bold text-white">
                    Generate Proposal from Conversation
                  </button>
                </div>
              </div>
              <div className="order-1 sm:order-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-lg font-extrabold text-brand-700">2</div>
                <h3 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl">Qualifies and gathers job details</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-500">
                  AI asks the right questions — project type, address, budget, timeline.
                  Everything is saved to your dashboard with a full transcript and summary.
                  One click to generate a proposal from the conversation.
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-600">
                  No sticky notes. No &quot;I&apos;ll call them back later.&quot; It&apos;s already done.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid items-center gap-8 sm:grid-cols-2 sm:gap-12">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-lg font-extrabold text-brand-700">3</div>
                <h3 className="mt-4 text-xl font-bold text-gray-900 sm:text-2xl">Sends proposal and books the job</h3>
                <p className="mt-3 text-base leading-relaxed text-gray-500">
                  Generate a branded proposal with photorealistic renders, plant lists, and pricing.
                  Send it to the client. Track when they view it. If they don&apos;t respond,
                  Shrubb auto-nudges them via text until they do.
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-600">
                  Auto follow-up closes 20-40% more deals. You do nothing.
                </p>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:p-5">
                <p className="text-xs font-semibold text-gray-400">Proposal Status</p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-3 rounded-lg bg-green-50 px-3 py-2.5">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Proposal sent</p>
                      <p className="text-[11px] text-gray-400">Today, 3:15 PM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-amber-50 px-3 py-2.5">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Client viewed proposal</p>
                      <p className="text-[11px] text-gray-400">Today, 4:02 PM (47 min later)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2.5">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Auto-nudge sent via SMS</p>
                      <p className="text-[11px] text-gray-400">Tomorrow, 3:15 PM (scheduled)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-green-200 px-3 py-2.5">
                    <div className="h-2 w-2 rounded-full border-2 border-green-400 bg-white" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-700">Client accepted &middot; $6,750</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ ROI MATH — impossible to ignore ═══════════ */}
      <section className="bg-gray-950 px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold text-white sm:text-4xl">
            Do the math.
          </h2>
          <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-gray-800 bg-gray-900 p-6 sm:mt-10 sm:p-8">
            <div className="space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-sm text-gray-400">Missed calls per month (peak season)</span>
                <span className="text-lg font-bold text-white">6</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-sm text-gray-400">Average job value</span>
                <span className="text-lg font-bold text-white">$3,500</span>
              </div>
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <span className="text-sm text-gray-400">Close rate on answered leads</span>
                <span className="text-lg font-bold text-white">35%</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-base font-bold text-gray-300">Revenue you&apos;re losing per year</span>
                <span className="text-3xl font-extrabold text-red-400">$88,200</span>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-md text-base text-gray-400 sm:mt-8">
            That&apos;s one truck payment. Every month. Walking out the door because nobody picked up the phone.
          </p>
          <p className="mt-2 text-lg font-bold text-white">
            Shrubb costs less than one missed job.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-400"
          >
            Stop the bleeding — start free trial
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section id="proof" className="bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
            Results from real landscapers
          </p>
          <h2 className="mt-3 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            They stopped losing leads. Revenue followed.
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {[
              {
                quote: 'First week with Shrubb, the AI booked an $8K retaining wall job from a call I would have missed while running a crew. Paid for a full year of Shrubb with one job.',
                result: '+$8,000 in week one',
                name: 'Mike T.',
                role: 'Owner, 4 crews',
                location: 'Austin, TX',
              },
              {
                quote: 'Homeowner texted at 9pm on a Saturday. Shrubb replied instantly, got their address, and I sent a proposal Sunday morning. Signed by Monday. That never happened before.',
                result: 'Closed a weekend lead',
                name: 'Sarah L.',
                role: 'Owner-operator',
                location: 'Portland, OR',
              },
              {
                quote: 'We used to lose 40% of leads to slow follow-up. Now every call gets answered, every text gets a reply. We went from 12 to 19 jobs closed last month.',
                result: '+58% close rate',
                name: 'Carlos M.',
                role: 'Owner, 2 crews',
                location: 'Denver, CO',
              },
            ].map((t) => (
              <div key={t.name} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <p className="flex-1 text-sm leading-relaxed text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 rounded-lg bg-brand-50 px-3 py-2">
                  <p className="text-sm font-bold text-brand-700">{t.result}</p>
                </div>
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="text-sm font-bold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role} &middot; {t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ AI EXPLAINER — address the fear ═══════════ */}
      <section className="border-t border-b border-gray-100 bg-gray-50 px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-10 sm:grid-cols-2 sm:gap-16">
            <div>
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                &quot;Will AI sound weird to my customers?&quot;
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                No. Shrubb uses a natural-sounding voice model trained on professional service conversations.
                It greets callers by your company name and has real back-and-forth dialogue.
              </p>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                If someone asks for a human, the call forwards to your phone immediately.
                The AI never quotes pricing, commits to schedules, or makes promises it can&apos;t keep.
                It gathers information. You close the deal.
              </p>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Inbound calls</p>
                    <p className="mt-1 text-sm text-gray-500">AI answers, has a natural conversation, transcribes everything, and saves the lead to your dashboard.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Inbound texts</p>
                    <p className="mt-1 text-sm text-gray-500">AI replies instantly, asks about their project and address, and creates a qualified lead in your CRM.</p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Your data is secure</p>
                    <p className="mt-1 text-sm text-gray-500">Enterprise-grade encryption. Your recordings and client data are never shared. Export or delete anytime.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ EXAMPLES GALLERY ═══════════ */}
      <section id="examples" className="bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">AI-generated design renders</h2>
          <p className="mt-2 text-center text-sm text-gray-500">Before and after — included in every proposal.</p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 shadow-sm sm:mt-10">
            <BeforeAfterSlider />
          </div>
        </div>
      </section>

      {/* ═══════════ PRICING ═══════════ */}
      <section id="pricing" className="border-t border-gray-100 bg-gray-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Pricing</p>
          <h2 className="mt-3 text-center text-2xl font-bold text-gray-900 sm:text-4xl">
            Less than one missed job per month
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            7-day free trial. No credit card. Cancel anytime.
          </p>
          <div className="mt-10 sm:mt-12">
            <PricingTable />
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section id="faq" className="border-t border-gray-100 bg-white px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Questions landscapers ask before signing up
          </h2>
          <div className="mt-8">
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="bg-gray-950 px-5 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-white sm:text-4xl">
            Every hour you wait, another lead goes to your competitor.
          </h2>
          <p className="mt-4 text-base text-gray-400 sm:text-lg">
            Your phone rang today. You didn&apos;t answer. They hired someone else.
            That&apos;s $3,000&ndash;$8,000 gone. It happens again tomorrow.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-bold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-400 sm:mt-10 sm:w-auto sm:text-lg"
          >
            Get your AI number now — free trial
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <p className="mt-3 text-sm text-gray-500">
            No credit card &middot; Live in 60 seconds &middot; Cancel anytime
          </p>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="border-t border-gray-100 bg-gray-50 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <ShrubbLogo size="default" color="green" />
              <p className="mt-3 text-sm text-gray-500">
                AI-powered proposals for landscapers. Stop losing leads. Start closing more jobs.
              </p>
              <Link
                href="/signup"
                className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
              >
                Start free trial
              </Link>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Product</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                <li><a href="#how-it-works" className="transition hover:text-gray-900">How it works</a></li>
                <li><a href="#pricing" className="transition hover:text-gray-900">Pricing</a></li>
                <li><a href="#examples" className="transition hover:text-gray-900">Examples</a></li>
                <li><a href="#faq" className="transition hover:text-gray-900">FAQ</a></li>
                <li><Link href="/login" className="transition hover:text-gray-900">Sign in</Link></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Resources</h4>
              <ul className="mt-3 space-y-2 text-sm text-gray-500">
                <li><Link href="/blog" className="transition hover:text-gray-900">Blog</Link></li>
                <li><Link href="/compare" className="transition hover:text-gray-900">Compare tools</Link></li>
                <li><Link href="/compare/shrubb-vs-copilot" className="transition hover:text-gray-900">Shrubb vs Copilot</Link></li>
                <li><Link href="/compare/shrubb-vs-canva" className="transition hover:text-gray-900">Shrubb vs Canva</Link></li>
                <li><Link href="/compare/shrubb-vs-manual-proposals" className="transition hover:text-gray-900">Shrubb vs Manual</Link></li>
              </ul>
            </div>

            {/* Cities */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Landscaping by City</h4>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-500">
                <li><Link href="/landscaping/austin" className="transition hover:text-gray-900">Austin</Link></li>
                <li><Link href="/landscaping/dallas" className="transition hover:text-gray-900">Dallas</Link></li>
                <li><Link href="/landscaping/atlanta" className="transition hover:text-gray-900">Atlanta</Link></li>
                <li><Link href="/landscaping/denver" className="transition hover:text-gray-900">Denver</Link></li>
                <li><Link href="/landscaping/portland" className="transition hover:text-gray-900">Portland</Link></li>
                <li><Link href="/landscaping/phoenix" className="transition hover:text-gray-900">Phoenix</Link></li>
                <li><Link href="/landscaping/tampa" className="transition hover:text-gray-900">Tampa</Link></li>
                <li><Link href="/landscaping/nashville" className="transition hover:text-gray-900">Nashville</Link></li>
                <li><Link href="/landscaping/charlotte" className="transition hover:text-gray-900">Charlotte</Link></li>
                <li><Link href="/landscaping/raleigh" className="transition hover:text-gray-900">Raleigh</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Shrubb. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
