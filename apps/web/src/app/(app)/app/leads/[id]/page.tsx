import { redirect } from 'next/navigation';

interface LeadDetailRedirectProps {
  params: Promise<{ id: string }>;
}

/** Redirect old /app/leads/:id routes to the split-pane view */
export default async function LeadDetailRedirect({
  params,
}: LeadDetailRedirectProps) {
  const { id } = await params;
  redirect(`/app/leads?id=${id}`);
}
