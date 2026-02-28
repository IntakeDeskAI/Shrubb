import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-brand-700">LandscapeAI</h1>
          <div className="flex gap-3">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Transform your yard with AI
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Upload photos of your yard, get AI-generated landscape concepts in
            minutes. Revise, upscale, and export professional designs.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/auth/signup"
              className="rounded-lg bg-brand-600 px-6 py-3 text-base font-semibold text-white hover:bg-brand-700"
            >
              Start Free
            </Link>
            <Link
              href="/auth/login"
              className="rounded-lg border border-gray-300 px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
