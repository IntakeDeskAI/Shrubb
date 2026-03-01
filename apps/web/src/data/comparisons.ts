export interface ComparisonFeature {
  feature: string;
  shrubb: string;
  competitor: string;
}

export interface Comparison {
  slug: string;
  competitor: string;
  competitorDescription: string;
  title: string;
  subtitle: string;
  features: ComparisonFeature[];
  shrubWins: string[];
  verdict: string;
}

export const COMPARISONS: Comparison[] = [
  {
    slug: "shrubb-vs-copilot",
    competitor: "DynaScape / Generic Design Copilots",
    competitorDescription:
      "General-purpose design copilots and legacy landscape CAD tools that weren't built for client-facing proposals.",
    title: "Shrubb vs DynaScape / Generic Design Copilots",
    subtitle:
      "See why landscapers choose a purpose-built proposal tool over generic design copilots and legacy CAD software.",
    features: [
      {
        feature: "AI Renders",
        shrubb: "Photorealistic renders from a yard photo or address in minutes",
        competitor: "Basic CAD output or generic AI images not tailored to landscaping",
      },
      {
        feature: "Proposal Hosting",
        shrubb: "Branded, hosted proposal page with a unique link for each client",
        competitor: "Export to PDF or email manually; no hosted page",
      },
      {
        feature: "Client Accept Tracking",
        shrubb: "One-click accept button with real-time notifications when a client views or accepts",
        competitor: "No built-in tracking; rely on email replies or phone calls",
      },
      {
        feature: "Plant Zone Accuracy",
        shrubb: "Zone-aware plant suggestions based on the client's USDA hardiness zone",
        competitor: "Generic plant libraries with no zone filtering",
      },
      {
        feature: "Pricing",
        shrubb: "Simple monthly plans starting at an affordable price point",
        competitor: "Expensive per-seat licenses or complex enterprise pricing",
      },
      {
        feature: "Setup Time",
        shrubb: "Sign up and send your first proposal in under 15 minutes",
        competitor: "Hours or days of onboarding, training, and template setup",
      },
      {
        feature: "Mobile Support",
        shrubb: "Fully responsive — create and send proposals from any device",
        competitor: "Desktop-only or limited mobile functionality",
      },
    ],
    shrubWins: [
      "Purpose-built for landscapers — every feature is designed around landscape proposals",
      "Client-facing proposals with a one-click accept button and real-time tracking",
      "Zone-aware plant suggestions so every design is accurate for the client's region",
      "Up and running in minutes, not days — no training required",
    ],
    verdict:
      "Generic design copilots and legacy CAD tools were built for architects and engineers, not landscapers. Shrubb is purpose-built for landscaping companies: you get photorealistic renders, zone-accurate plant lists, and hosted proposals with a client accept button — all in a tool that takes minutes to learn, not weeks.",
  },
  {
    slug: "shrubb-vs-canva",
    competitor: "Canva / Generic Design Tools",
    competitorDescription:
      "General-purpose graphic design platforms that offer templates but lack landscaping-specific intelligence.",
    title: "Shrubb vs Canva / Generic Design Tools",
    subtitle:
      "Canva is great for social posts — but landscaping proposals need more than drag-and-drop templates.",
    features: [
      {
        feature: "Landscape-Specific Templates",
        shrubb: "Templates built for landscape proposals with renders, plant lists, and pricing",
        competitor: "Generic templates that require manual customization for landscaping",
      },
      {
        feature: "AI Plant Suggestions",
        shrubb: "AI recommends plants by zone, style, and maintenance level automatically",
        competitor: "No plant intelligence — you source and place every element manually",
      },
      {
        feature: "Client Proposal Page",
        shrubb: "Hosted proposal page with your branding, renders, and project details",
        competitor: "Export as image or PDF; no hosted, interactive proposal page",
      },
      {
        feature: "Accept Tracking",
        shrubb: "Know exactly when a client opens, views, and accepts your proposal",
        competitor: "No tracking — you send a file and hope for a response",
      },
      {
        feature: "Zone-Aware Designs",
        shrubb: "Every design respects the client's USDA hardiness zone automatically",
        competitor: "No awareness of plant zones; designs may include plants that won't survive",
      },
      {
        feature: "Automated Plant Lists",
        shrubb: "Plant list with quantities, sizes, and zone compatibility generated automatically",
        competitor: "Manual creation of plant lists in a separate spreadsheet or document",
      },
      {
        feature: "Branded Proposals",
        shrubb: "Your logo, colors, and company info applied automatically to every proposal",
        competitor: "Manual branding on each design; inconsistent across projects",
      },
    ],
    shrubWins: [
      "Built specifically for the landscaping industry — not a generic design tool",
      "Automated plant lists with zone compatibility save hours of manual research",
      "Clients can accept proposals online with one click — no printing or scanning",
      "Proposal tracking tells you exactly when clients view and engage with your bid",
    ],
    verdict:
      "Canva is a fantastic tool for marketing graphics, but it was never designed to handle the complexity of a landscaping proposal. Shrubb automates the hard parts — zone-aware plant lists, photorealistic renders, and hosted proposal pages — so you spend less time designing and more time closing jobs.",
  },
  {
    slug: "shrubb-vs-manual-proposals",
    competitor: "Manual Proposals (Word/PDF)",
    competitorDescription:
      "The traditional approach: building proposals by hand in Word, Google Docs, or PDF editors — one at a time.",
    title: "Shrubb vs Manual Proposals (Word/PDF)",
    subtitle:
      "Stop spending 3 hours on every proposal. Shrubb gets it done in 15 minutes with better results.",
    features: [
      {
        feature: "Time Per Proposal",
        shrubb: "15 minutes from yard photo to sent proposal",
        competitor: "2–3 hours of writing, formatting, and assembling documents",
      },
      {
        feature: "Consistency",
        shrubb: "Every proposal follows your brand template automatically",
        competitor: "Formatting varies by project; easy to miss details or make errors",
      },
      {
        feature: "Client Experience",
        shrubb: "Interactive hosted page with renders, plant list, and accept button",
        competitor: "Static PDF or Word doc attached to an email",
      },
      {
        feature: "Tracking",
        shrubb: "Real-time notifications when clients view, open, or accept",
        competitor: "No visibility — you send it and wait for a phone call",
      },
      {
        feature: "Renders",
        shrubb: "AI-generated photorealistic renders of the finished landscape",
        competitor: "No renders unless you hire a designer or use separate software",
      },
      {
        feature: "Plant Accuracy",
        shrubb: "Zone-aware plant suggestions with automated lists and quantities",
        competitor: "Manual research; risk of recommending plants wrong for the zone",
      },
      {
        feature: "Scalability",
        shrubb: "Send 10 proposals a week without adding staff",
        competitor: "Every additional proposal means more hours of manual work",
      },
    ],
    shrubWins: [
      "15 minutes vs 3 hours — reclaim your evenings and weekends",
      "Photorealistic AI renders that wow clients without hiring a designer",
      "Clients accept online with one click instead of printing and signing",
      "Proposal analytics show you who's engaged so you can follow up smarter",
    ],
    verdict:
      "Manual proposals worked when you sent two a month. But if you're growing your landscaping business, spending 3 hours per bid isn't sustainable. Shrubb cuts proposal time to 15 minutes, adds photorealistic renders and zone-accurate plant lists, and lets clients accept with one click — so you close more jobs without burning out.",
  },
];

export function getAllComparisons(): Comparison[] {
  return COMPARISONS;
}

export function getComparisonBySlug(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
