/**
 * Extract structured details from conversation text using regex.
 * No LLM call needed — this surfaces what the AI already gathered.
 */

export interface AiExtractedDetails {
  serviceType: string | null;
  address: string | null;
  budget: string | null;
  timeline: string | null;
  notes: string | null;
}

/**
 * Parse call summaries, transcripts, and SMS messages to extract
 * structured lead details. Returns null fields when not found.
 */
export function extractAiDetails(texts: string[]): AiExtractedDetails {
  const combined = texts.join('\n');
  const lower = combined.toLowerCase();

  // ── Service type ──
  const serviceMatch = combined.match(
    /\b(patio\s*(installation|install|build|design|project)?|deck\s*(build|installation|project)?|landscape\s*(design|project|installation)?|lawn\s*(care|maintenance|service)?|garden\s*(design|bed|installation)?|tree\s*(removal|trimming|service)?|fence\s*(installation|build|repair)?|irrigation\s*(system|installation|repair)?|hardscape|outdoor\s*lighting|retaining\s*wall|sod\s*(installation|replacement)?|drainage|grading|mulch(ing)?|snow\s*removal)/i,
  );
  const serviceType = serviceMatch ? capitalizePhrase(serviceMatch[0]) : null;

  // ── Address ──
  const addressMatch = combined.match(
    /\b(\d{1,5}\s+(?:[NSEW]\s+)?(?:\w+\s+){0,3}(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Lane|Ln|Court|Ct|Way|Place|Pl|Circle|Cir|Trail|Trl|Terrace|Ter)\.?(?:\s*,?\s*(?:Apt|Suite|Unit|#)\s*\w+)?)/i,
  );
  const address = addressMatch ? addressMatch[1].trim() : null;

  // ── Budget ──
  const budgetMatch = combined.match(
    /\$\s?([\d,]+(?:\.\d{2})?)\s*(?:[-–—to]+\s*\$?\s*([\d,]+(?:\.\d{2})?))?/,
  );
  let budget: string | null = null;
  if (budgetMatch) {
    budget = budgetMatch[2]
      ? `$${budgetMatch[1]} – $${budgetMatch[2]}`
      : `$${budgetMatch[1]}`;
  } else {
    // Try contextual budget mentions
    const budgetContextMatch = lower.match(
      /budget\s*(?:is|of|around|about|roughly)?\s*(?:\$?\s*([\d,]+))/i,
    );
    if (budgetContextMatch) {
      budget = `~$${budgetContextMatch[1]}`;
    }
  }

  // ── Timeline ──
  const timelinePatterns = [
    /\b(by\s+(?:spring|summer|fall|winter|next\s+(?:week|month|year)|end\s+of\s+\w+))\b/i,
    /\b(in\s+(?:\d+\s+)?(?:weeks?|months?|days?))\b/i,
    /\b((?:this|next)\s+(?:spring|summer|fall|winter|week|month))\b/i,
    /\b(ASAP|as soon as possible|right away|urgent)\b/i,
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s*\d{0,2},?\s*\d{0,4})\b/i,
  ];

  let timeline: string | null = null;
  for (const pattern of timelinePatterns) {
    const match = combined.match(pattern);
    if (match) {
      timeline = capitalizePhrase(match[1]);
      break;
    }
  }

  // ── Notes ──
  // Fall back to first sentence of the first call summary, or first inbound SMS
  let notes: string | null = null;
  for (const text of texts) {
    if (text.trim().length > 20) {
      const firstSentence = text.split(/[.!?\n]/)[0].trim();
      if (firstSentence.length > 10 && firstSentence.length < 200) {
        notes = firstSentence;
        break;
      }
    }
  }

  return { serviceType, address, budget, timeline, notes };
}

function capitalizePhrase(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Check if extracted details have any meaningful content */
export function hasAiDetails(details: AiExtractedDetails): boolean {
  return !!(
    details.serviceType ||
    details.address ||
    details.budget ||
    details.timeline
  );
}
