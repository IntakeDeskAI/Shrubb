import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShrubbLogo } from "@/components/shrubb-logo";
import Breadcrumbs from "@/components/seo/breadcrumbs";
import {
  getAllCities,
  getCityBySlug,
  getRelatedCities,
} from "@/data/geo-cities";

// ---------------------------------------------------------------------------
// Static params & metadata
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return getAllCities().map((c) => ({ city: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return {};

  return {
    title: `AI Landscaping Proposals in ${city.city}, ${city.stateCode} | Shrubb`,
    description: `Shrubb helps landscapers in ${city.city}, ${city.stateCode} create AI-powered proposals with zone-accurate plant lists, photorealistic renders, and one-click client acceptance. Start your free trial today.`,
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CityLandingPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) notFound();

  const relatedCities = getRelatedCities(city.slug, 4);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* ================================================================= */}
      {/* NAV                                                               */}
      {/* ================================================================= */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <ShrubbLogo size="default" color="green" />
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/" className="hidden transition hover:text-gray-900 sm:flex">
              Home
            </Link>
            <Link href="/blog" className="hidden transition hover:text-gray-900 sm:flex">
              Blog
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-brand-600"
            >
              <span className="sm:hidden">Try free</span>
              <span className="hidden sm:inline">Start landscaper trial</span>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* ================================================================= */}
        {/* BREADCRUMBS                                                       */}
        {/* ================================================================= */}
        <div className="mx-auto max-w-7xl px-6 pt-6">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Landscaping", href: "/landscaping" },
              { label: city.city },
            ]}
          />
        </div>

        {/* ================================================================= */}
        {/* HERO                                                              */}
        {/* ================================================================= */}
        <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white px-4 pt-20 pb-8 sm:px-6 sm:pt-12 sm:pb-20">
          <div className="pointer-events-none absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" />
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700">
              USDA Zone {city.usdaZone} &middot; {city.city},{" "}
              {city.stateCode}
            </span>
            <h1 className="mt-6 text-[26px] font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              AI Proposals for Landscapers in{" "}
              <span className="text-brand-600">
                {city.city}, {city.stateCode}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[14px] leading-relaxed text-gray-700 sm:text-lg">
              With a population of {city.population} and a landscaping season
              that runs {city.landscapingSeasonDesc}, {city.city} is a
              thriving market for landscaping professionals. Shrubb helps you
              win more jobs by generating AI-powered proposals tailored to USDA
              Zone {city.usdaZone} — complete with photorealistic renders,
              zone-accurate plant lists, and one-click client acceptance.
            </p>
            <div className="mx-auto mt-6 max-w-xl rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-left text-[13px] text-brand-800 sm:text-sm">
              <span className="font-bold">Pro tip:</span> Mention the client&apos;s USDA zone in your proposal — it builds instant credibility.
            </div>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
              >
                Start your free trial
                <ArrowRightIcon />
              </Link>
              <Link
                href="/#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-8 py-4 text-base font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                See how it works
              </Link>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* LOCAL MARKET SECTION                                              */}
        {/* ================================================================= */}
        <section className="border-t border-gray-100 bg-gray-50 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              The {city.city} Landscaping Market
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-gray-600">
              {city.marketInsight}
            </p>

            <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
              {/* USDA Zone */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center sm:p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                  <LeafIcon className="h-6 w-6 text-brand-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-500">
                  USDA Hardiness Zone
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  Zone {city.usdaZone}
                </p>
              </div>

              {/* Season */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center sm:p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                  <CalendarIcon className="h-6 w-6 text-brand-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-500">
                  Landscaping Season
                </p>
                <p className="mt-1 text-lg font-bold text-gray-900 capitalize">
                  {city.landscapingSeasonDesc}
                </p>
              </div>

              {/* Average project size */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center sm:p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                  <DollarIcon className="h-6 w-6 text-brand-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-500">
                  Avg. Project Size
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {city.averageProjectSize}
                </p>
              </div>

              {/* Population */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-center sm:p-6">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                  <UsersIcon className="h-6 w-6 text-brand-600" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-500">
                  City Population
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {city.population}
                </p>
              </div>
            </div>

            {/* Common services chips */}
            <div className="mt-10 text-center">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
                Popular Services in {city.city}
              </h3>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                {city.commonServices.map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* TOP PLANTS                                                        */}
        {/* ================================================================= */}
        <section className="px-4 py-10 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              Top Plants for Zone {city.usdaZone} in {city.city}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
              Shrubb automatically recommends USDA Zone {city.usdaZone}{" "}
              appropriate species in every proposal. Here are some of the most
              popular plants {city.city} landscapers include in their projects.
            </p>
            <div className="mt-8 grid gap-3 sm:mt-10 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {city.topPlants.map((plant, i) => {
                const [commonName, scientificName] = plant.includes("(")
                  ? [
                      plant.slice(0, plant.indexOf("(")).trim(),
                      plant.slice(plant.indexOf("(") + 1, plant.indexOf(")")),
                    ]
                  : [plant, ""];

                return (
                  <div
                    key={plant}
                    className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:shadow-md sm:gap-4 sm:p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {commonName}
                      </p>
                      {scientificName && (
                        <p className="mt-0.5 text-sm italic text-gray-400">
                          {scientificName}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Bonus card — Shrubb pitch */}
              <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 sm:gap-4 sm:p-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-sm font-bold text-brand-700">
                  +
                </div>
                <div>
                  <p className="font-semibold text-brand-800">
                    ...and dozens more
                  </p>
                  <p className="mt-0.5 text-sm text-brand-600">
                    Shrubb&apos;s AI selects from a full Zone {city.usdaZone}{" "}
                    plant database to match each client&apos;s style and budget.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* HOW SHRUBB HELPS                                                  */}
        {/* ================================================================= */}
        <section className="border-t border-gray-100 bg-gray-50 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
              How Shrubb Helps {city.city} Landscapers Win More Jobs
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
              Whether you are bidding on a {city.commonServices[0].toLowerCase()}{" "}
              project or a full backyard renovation, Shrubb gives your proposals
              a professional edge that closes deals.
            </p>

            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              {/* Card 1 */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                  <BoltIcon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  15-Minute Proposals, Not 3-Hour Ones
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  In the competitive {city.city} market, the first landscaper to
                  send a polished proposal often wins the job. Shrubb condenses
                  your workflow from hours to minutes — upload a yard photo, set
                  preferences, and let AI generate a branded proposal with
                  photorealistic renders and an accurate Zone {city.usdaZone}{" "}
                  plant list.
                </p>
              </div>

              {/* Card 2 */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                  <LeafIcon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Zone-Accurate Plant Recommendations
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  Every proposal Shrubb generates for {city.city} clients
                  includes plants suited to USDA Zone {city.usdaZone} and the
                  local {city.state} climate. From{" "}
                  {city.topPlants[0]?.split("(")[0]?.trim()} to{" "}
                  {city.topPlants[2]?.split("(")[0]?.trim()}, the AI selects
                  species that thrive {city.landscapingSeasonDesc} — so your
                  clients get a landscape that lasts.
                </p>
              </div>

              {/* Card 3 */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                  <ChartIcon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Close More {city.averageProjectSize} Projects
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  The average {city.city} landscaping project ranges from{" "}
                  {city.averageProjectSize}. Shrubb&apos;s professional proposals —
                  complete with renders, itemized plant lists, and a one-click
                  accept button — build trust and help you close higher-value
                  projects more consistently.
                </p>
              </div>

              {/* Card 4 */}
              <div className="rounded-2xl border border-gray-200 bg-white p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                  <TargetIcon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  Stand Out in the {city.city} Market
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  With {city.population} residents and growing demand for{" "}
                  {city.commonServices[0].toLowerCase()}, competition among{" "}
                  {city.city} landscapers is fierce. A Shrubb proposal with
                  photorealistic before-and-after renders gives your business a
                  memorable, professional presence that separates you from crews
                  still sending text-only estimates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================= */}
        {/* CTA                                                               */}
        {/* ================================================================= */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Ready to win more landscaping jobs in {city.city}?
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Join landscapers across {city.state} using Shrubb to create
              stunning AI proposals and close more clients. Start your 7-day
              free trial — no credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
            >
              Start your landscaper trial
              <ArrowRightIcon />
            </Link>
          </div>
        </section>

        {/* ================================================================= */}
        {/* RELATED CITIES                                                    */}
        {/* ================================================================= */}
        <section className="border-t border-gray-100 bg-gray-50 px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-gray-900">
              Shrubb for Landscapers in Other Cities
            </h2>
            <p className="mt-2 text-center text-gray-500">
              Explore how Shrubb helps landscaping professionals across the
              country.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedCities.map((rc) => (
                <Link
                  key={rc.slug}
                  href={`/landscaping/${rc.slug}`}
                  className="group rounded-xl border border-gray-200 bg-white p-6 transition hover:border-brand-300 hover:shadow-md"
                >
                  <p className="text-lg font-bold text-gray-900 group-hover:text-brand-600">
                    {rc.city}, {rc.stateCode}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Zone {rc.usdaZone} &middot; {rc.averageProjectSize}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-3">
                    {rc.marketInsight.split(".")[0]}.
                  </p>
                  <span className="mt-3 inline-block text-sm font-semibold text-brand-600 group-hover:underline">
                    Learn more &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* =================================================================== */}
      {/* FOOTER                                                              */}
      {/* =================================================================== */}
      <footer className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-light tracking-wide text-gray-900">
            shrubb
          </span>
          <nav className="flex gap-6 text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-600">
              Home
            </Link>
            <Link href="/blog" className="hover:text-gray-600">
              Blog
            </Link>
            <Link href="/signup" className="hover:text-gray-600">
              Sign up
            </Link>
            <Link href="/login" className="hover:text-gray-600">
              Sign in
            </Link>
          </nav>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Shrubb. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline SVG icon components (keeps the page self-contained)
// ---------------------------------------------------------------------------

function ArrowRightIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21c0 0-8-4-8-12 0-4.418 3.582-8 8-8s8 3.582 8 8c0 8-8 12-8 12z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21V9"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 13l4-4 4 4"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  );
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
      />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
      />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
