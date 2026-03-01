import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ShrubbLogo } from '@/components/shrubb-logo';
import { SubmitButton } from './submit-button';

interface SignupPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const errorMessage = params.error;

  async function signup(formData: FormData) {
    'use server';

    const fullName = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Use admin API to create user — skips confirmation email entirely
    const admin = await createServiceClient();
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (createError) {
      // Supabase admin returns "A user with this email address has already been registered"
      const msg = createError.message?.toLowerCase() ?? '';
      if (msg.includes('already') || msg.includes('exists') || msg.includes('registered')) {
        redirect(
          '/signup?error=' +
            encodeURIComponent(
              'An account with this email already exists. Please sign in instead.',
            ),
        );
        return;
      }
      redirect('/signup?error=' + encodeURIComponent(createError.message));
      return;
    }

    if (!created.user) {
      redirect('/signup?error=' + encodeURIComponent('Failed to create account. Please try again.'));
      return;
    }

    // Sign them in immediately
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      redirect('/signup?error=' + encodeURIComponent(signInError.message));
      return;
    }

    // Success — session is active, middleware will route to onboarding
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
            <Link
              href="/login"
              className="rounded-full border border-gray-300 px-5 py-1.5 text-gray-700 hover:bg-gray-50"
            >
              log in
            </Link>
          </nav>
        </div>
      </header>

      {/* Accent line */}
      <div className="h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-400" />

      {/* Content */}
      <main className="flex flex-1 items-start justify-center px-4 pb-24 pt-16">
        <div className="w-full max-w-sm">
          <h1 className="mb-8 text-center text-2xl font-bold text-gray-900">
            Create an Account
          </h1>

          {/* Error message */}
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <form action={signup} className="space-y-4">
            <div>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                placeholder="Full Name"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
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
                minLength={8}
                placeholder="Password (min 8 characters)"
                className="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <SubmitButton>Create Account</SubmitButton>
          </form>
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <span className="text-gray-500">Already a member?</span>
            <Link
              href="/login"
              className="rounded-lg border border-gray-300 px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
