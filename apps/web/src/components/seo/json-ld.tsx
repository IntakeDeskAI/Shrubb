/**
 * JSON-LD Structured Data components for SEO.
 *
 * All components are React Server Components (no "use client").
 * They render a <script type="application/ld+json"> tag with
 * Schema.org structured data for Google rich results.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WithContext {
  "@context": "https://schema.org";
  "@type": string;
  [key: string]: unknown;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface LocalBusinessServiceProps {
  city: string;
  state: string;
  /** Optional override for the service name. Defaults to "Landscaping Proposal Software". */
  serviceName?: string;
  /** Optional override for the service description. */
  description?: string;
}

// ---------------------------------------------------------------------------
// JsonLd – generic wrapper
// ---------------------------------------------------------------------------

/**
 * Renders an arbitrary JSON-LD object inside a `<script>` tag.
 *
 * @example
 * ```tsx
 * <JsonLd data={{ "@context": "https://schema.org", "@type": "Organization", name: "Shrubb" }} />
 * ```
 */
export function JsonLd({ data }: { data: WithContext }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// ---------------------------------------------------------------------------
// OrganizationSchema
// ---------------------------------------------------------------------------

/**
 * Renders Organization structured data for Shrubb.
 *
 * @example
 * ```tsx
 * <OrganizationSchema />
 * ```
 */
export function OrganizationSchema() {
  const data: WithContext = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Shrubb",
    url: "https://www.shrubb.com",
    description:
      "AI-powered proposal software for landscaping companies",
    logo: "https://www.shrubb.com/logo.png",
    sameAs: [],
  };

  return <JsonLd data={data} />;
}

// ---------------------------------------------------------------------------
// SoftwareApplicationSchema
// ---------------------------------------------------------------------------

/**
 * Renders SoftwareApplication structured data for the Shrubb homepage.
 *
 * Includes a free-trial offer so Google can surface pricing / availability
 * in rich results.
 *
 * @example
 * ```tsx
 * <SoftwareApplicationSchema />
 * ```
 */
export function SoftwareApplicationSchema() {
  const data: WithContext = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Shrubb",
    description:
      "AI-powered proposal software for landscaping companies",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://www.shrubb.com",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free 7-day trial — no credit card required",
      availability: "https://schema.org/InStock",
    },
  };

  return <JsonLd data={data} />;
}

// ---------------------------------------------------------------------------
// FaqPageSchema
// ---------------------------------------------------------------------------

/**
 * Renders FAQPage structured data from an array of question/answer pairs.
 *
 * @example
 * ```tsx
 * <FaqPageSchema items={[{ question: "How does it work?", answer: "..." }]} />
 * ```
 */
export function FaqPageSchema({ items }: { items: FaqItem[] }) {
  const data: WithContext = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return <JsonLd data={data} />;
}

// ---------------------------------------------------------------------------
// BreadcrumbSchema
// ---------------------------------------------------------------------------

/**
 * Renders BreadcrumbList structured data from an ordered array of links.
 *
 * @example
 * ```tsx
 * <BreadcrumbSchema items={[
 *   { name: "Home", url: "https://www.shrubb.com" },
 *   { name: "Pricing", url: "https://www.shrubb.com/pricing" },
 * ]} />
 * ```
 */
export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const data: WithContext = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <JsonLd data={data} />;
}

// ---------------------------------------------------------------------------
// LocalBusinessServiceSchema
// ---------------------------------------------------------------------------

/**
 * Renders Service structured data scoped to a specific city/state.
 *
 * Designed for GEO landing pages (e.g. "Landscaping proposals in Denver, CO").
 *
 * @example
 * ```tsx
 * <LocalBusinessServiceSchema city="Denver" state="Colorado" />
 * ```
 */
export function LocalBusinessServiceSchema({
  city,
  state,
  serviceName = "Landscaping Proposal Software",
  description,
}: LocalBusinessServiceProps) {
  const data: WithContext = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${serviceName} in ${city}, ${state}`,
    description:
      description ??
      `Shrubb provides AI-powered landscaping proposal software for companies in ${city}, ${state}. Create photorealistic designs, accurate plant lists, and professional proposals in minutes.`,
    provider: {
      "@type": "Organization",
      name: "Shrubb",
      url: "https://www.shrubb.com",
    },
    areaServed: {
      "@type": "City",
      name: city,
      containedInPlace: {
        "@type": "State",
        name: state,
      },
    },
    serviceType: "Landscaping Proposal Software",
  };

  return <JsonLd data={data} />;
}
