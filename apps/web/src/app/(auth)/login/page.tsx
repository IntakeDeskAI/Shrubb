import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ShrubbLogo } from '@/components/shrubb-logo';
import { SubmitButton } from './submit-button';

interface LoginPageProps {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const errorMessage = params.error;
  const redirectTo = params.redirect;

  async function login(formData: FormData) {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      redirect('/login?error=' + encodeURIComponent(error.message));
      return;
    }

    redirect('/app');
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <ShrubbLogo size="default" color="green" />
          <nav className="hidden items-center gap-8 text-sm text-gray-500 sm:flex">
            <Link href="/#how-it-works" className="hover:text-gray-900">
              how it works
            </Link>
            <Link href="/#pricing" className="hover:text-gray-900">
              pricing
            </Link>
            <span className="rounded-full border border-brand-500 px-5 py-1.5 font-medium text-brand-600">
              log in
            </span>
          </nav>
        </div>
      </header>

      {/* Accent line */}
      <div className="h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-400" />

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-4 pb-24 pt-16">
        <div className="w-full max-w-sm">
          <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Sign In
          </h1>

          {/* Error message */}
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Redirect notice */}
          {redirectTo && !errorMessage && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Please sign in to continue.
            </div>
          )}

          <form action={login} className="space-y-4">
            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Password"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                Keep me signed in
              </label>
              <a href="#" className="font-medium text-gray-900 underline">
                Forgot Password
              </a>
            </div>
            <SubmitButton>Sign In</SubmitButton>
          </form>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <span className="text-gray-500">Not a member yet?</span>
            <Link
              href="/signup"
              className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
