import { redirect } from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { createCompanyForUser } from '@/lib/create-company';
import Link from 'next/link';
import { ShrubbLogo } from '@/components/shrubb-logo';
import { SignupForm } from './signup-form';

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
    const companyName = formData.get('company_name') as string;

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

    // Create company immediately so user skips onboarding
    if (companyName?.trim()) {
      const serviceClient = await createServiceClient();
      const result = await createCompanyForUser(serviceClient, {
        userId: created.user.id,
        companyName,
        fullName,
        companyAddress: formData.get('company_address') as string,
        companyAddressPlaceId: formData.get('company_address_place_id') as string,
        companyAddressFormatted: formData.get('company_address_formatted') as string,
        companyAddressLat: formData.get('company_address_lat') as string,
        companyAddressLng: formData.get('company_address_lng') as string,
      });

      if ('error' in result) {
        // Non-blocking — user can still complete setup via onboarding fallback
        console.error('Signup: company creation failed', result.error);
      }
    }

    // Success — session is active, middleware routes to dashboard (or onboarding if company failed)
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

          <SignupForm signup={signup} errorMessage={errorMessage} />

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
