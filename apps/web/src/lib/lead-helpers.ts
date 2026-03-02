/**
 * Shared lead helpers — types, status config, qualification checks.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmsMsg {
  id: string;
  direction: string;
  body: string;
  created_at: string;
}

export interface CallRecord {
  id: string;
  direction: string;
  status: string;
  recording_url: string | null;
  transcript_text: string | null;
  summary_text: string | null;
  started_at: string;
  ended_at: string | null;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

export const STATUS_STYLES: Record<
  string,
  { label: string; color: string }
> = {
  accepted: {
    label: 'Accepted',
    color: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20',
  },
  proposal_sent: {
    label: 'Proposal Sent',
    color: 'text-blue-700 bg-blue-50 ring-blue-600/20',
  },
  estimate_ready: {
    label: 'Estimate Ready',
    color: 'text-amber-700 bg-amber-50 ring-amber-600/20',
  },
  qualified: {
    label: 'Qualified',
    color: 'text-brand-700 bg-brand-50 ring-brand-600/20',
  },
  new: {
    label: 'New',
    color: 'text-gray-600 bg-gray-100 ring-gray-500/10',
  },
};

// ---------------------------------------------------------------------------
// Status badge derivation
// ---------------------------------------------------------------------------

export function getStatusBadge(
  proposalStatus: string | null,
  hasResponse: boolean,
): { label: string; color: string } {
  if (proposalStatus === 'accepted') return STATUS_STYLES.accepted;
  if (proposalStatus === 'sent' || proposalStatus === 'viewed')
    return STATUS_STYLES.proposal_sent;
  if (proposalStatus === 'draft') return STATUS_STYLES.estimate_ready;
  if (hasResponse) return STATUS_STYLES.qualified;
  return STATUS_STYLES.new;
}

// ---------------------------------------------------------------------------
// Missing-info qualification checklist
// ---------------------------------------------------------------------------

export interface QualificationCheck {
  label: string;
  done: boolean;
}

export function checkMissingInfo(
  lead: { name: string | null; phone: string },
  messages: SmsMsg[],
  calls: CallRecord[],
  hasClient: boolean,
): QualificationCheck[] {
  const allText = [
    ...messages.map((m) => m.body),
    ...calls.map((c) => c.summary_text ?? ''),
    ...calls.map((c) => c.transcript_text ?? ''),
  ]
    .join(' ')
    .toLowerCase();

  return [
    {
      label: 'Name captured',
      done: !!(lead.name && lead.name.trim().length > 1),
    },
    {
      label: 'Address mentioned',
      done:
        /\b(\d+\s+\w+\s+(st|street|ave|avenue|rd|road|dr|drive|blvd|ln|lane|ct|way|pl|circle))\b/i.test(
          allText,
        ) || /address/i.test(allText),
    },
    {
      label: 'Email collected',
      done:
        /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(allText) || hasClient,
    },
    {
      label: 'Service type identified',
      done: /(patio|deck|landscape|lawn|garden|tree|fence|irrigation|hardscape|lighting|design|install|mow|trim|clean|mulch|sod|drain|grade|retaining)/i.test(
        allText,
      ),
    },
    {
      label: 'Budget discussed',
      done: /(\$|budget|price|cost|estimate|quote|afford|spend)/i.test(
        allText,
      ),
    },
  ];
}
