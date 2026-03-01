import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.shrubb.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts = [
    'landscaping-proposal-software',
    'ai-landscape-design-tools',
    'how-to-write-landscaping-proposal',
    'landscaping-business-growth',
    'design-build-landscaping-workflow',
  ];

  const geoPages = [
    'austin',
    'denver',
    'portland',
    'phoenix',
    'dallas',
    'atlanta',
    'nashville',
    'tampa',
    'charlotte',
    'raleigh',
  ];

  const comparisonPages = [
    'shrubb-vs-copilot',
    'shrubb-vs-canva',
    'shrubb-vs-manual-proposals',
  ];

  const now = new Date();

  return [
    // Homepage
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },

    // Blog index
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    // Blog posts
    ...blogPosts.map((slug) => ({
      url: `${BASE_URL}/blog/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),

    // GEO pages
    ...geoPages.map((city) => ({
      url: `${BASE_URL}/landscaping/${city}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    // Comparison pages
    ...comparisonPages.map((slug) => ({
      url: `${BASE_URL}/compare/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),

    // Static pages
    ...['/pricing', '/login', '/signup'].map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}
