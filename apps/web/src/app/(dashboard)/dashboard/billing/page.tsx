import { createClient } from '@/lib/supabase/server';
import { BillingActions } from '@/components/billing-actions';

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user!.id)
    .single();

  const plan = subscription?.plan ?? 'free';
  const isActive = subscription?.status === 'active';

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Billing</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <div
          className={`rounded-lg border p-6 ${
            plan === 'free' ? 'border-brand-500 bg-brand-50' : 'bg-white'
          }`}
        >
          <h2 className="text-lg font-semibold">Free</h2>
          <p className="mt-1 text-2xl font-bold">$0<span className="text-sm font-normal text-gray-500">/mo</span></p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>1 project</li>
            <li>4 concepts per area</li>
            <li>Standard resolution</li>
          </ul>
          {plan === 'free' && isActive && (
            <div className="mt-4 text-sm font-medium text-brand-600">Current plan</div>
          )}
        </div>

        {/* Pro Plan */}
        <div
          className={`rounded-lg border p-6 ${
            plan === 'pro' ? 'border-brand-500 bg-brand-50' : 'bg-white'
          }`}
        >
          <h2 className="text-lg font-semibold">Pro</h2>
          <p className="mt-1 text-2xl font-bold">$29<span className="text-sm font-normal text-gray-500">/mo</span></p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>Unlimited projects</li>
            <li>Unlimited concepts</li>
            <li>High resolution</li>
            <li>PDF export</li>
          </ul>
          <div className="mt-4">
            <BillingActions currentPlan={plan} />
          </div>
        </div>
      </div>
    </div>
  );
}
