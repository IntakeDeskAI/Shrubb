'use client';

import { useState } from 'react';
import Link from 'next/link';

type ContentType = 'blog' | 'geo' | 'comparison';

interface ContentItem {
  type: ContentType;
  slug: string;
  title: string;
  status: 'published' | 'draft';
  lastUpdated: string;
}

const CONTENT_ITEMS: ContentItem[] = [
  // Blog posts
  { type: 'blog', slug: 'landscaping-proposal-software', title: 'The Best Landscaping Proposal Software in 2026', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'blog', slug: 'ai-landscape-design-tools', title: 'AI Landscape Design Tools: What Landscapers Need to Know', status: 'published', lastUpdated: '2026-02-25' },
  { type: 'blog', slug: 'how-to-write-landscaping-proposal', title: 'How to Write a Landscaping Proposal That Wins Jobs', status: 'published', lastUpdated: '2026-02-20' },
  { type: 'blog', slug: 'landscaping-business-growth', title: '5 Ways to Grow Your Landscaping Business in 2026', status: 'published', lastUpdated: '2026-02-18' },
  { type: 'blog', slug: 'design-build-landscaping-workflow', title: 'Streamlining the Design-Build Landscaping Workflow', status: 'published', lastUpdated: '2026-02-15' },
  // GEO pages
  { type: 'geo', slug: 'austin', title: 'AI Landscaping Proposals in Austin, TX', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'geo', slug: 'denver', title: 'AI Landscaping Proposals in Denver, CO', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'geo', slug: 'portland', title: 'AI Landscaping Proposals in Portland, OR', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'geo', slug: 'phoenix', title: 'AI Landscaping Proposals in Phoenix, AZ', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'geo', slug: 'dallas', title: 'AI Landscaping Proposals in Dallas, TX', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'geo', slug: 'atlanta', title: 'AI Landscaping Proposals in Atlanta, GA', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'geo', slug: 'nashville', title: 'AI Landscaping Proposals in Nashville, TN', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'geo', slug: 'tampa', title: 'AI Landscaping Proposals in Tampa, FL', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'geo', slug: 'charlotte', title: 'AI Landscaping Proposals in Charlotte, NC', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'geo', slug: 'raleigh', title: 'AI Landscaping Proposals in Raleigh, NC', status: 'published', lastUpdated: '2026-02-28' },
  // Comparison pages
  { type: 'comparison', slug: 'shrubb-vs-copilot', title: 'Shrubb vs DynaScape / Design Copilots', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'comparison', slug: 'shrubb-vs-canva', title: 'Shrubb vs Canva / Generic Design Tools', status: 'published', lastUpdated: '2026-02-28' },
  { type: 'comparison', slug: 'shrubb-vs-manual-proposals', title: 'Shrubb vs Manual Proposals', status: 'published', lastUpdated: '2026-02-28' },
];

export default function ContentManager() {
  const [filter, setFilter] = useState<ContentType | 'all'>('all');
  const [generating, setGenerating] = useState<string | null>(null);

  const filtered = filter === 'all' ? CONTENT_ITEMS : CONTENT_ITEMS.filter((i) => i.type === filter);

  const typeLabel: Record<ContentType, string> = {
    blog: 'Blog Post',
    geo: 'GEO Page',
    comparison: 'Comparison',
  };

  const typeColor: Record<ContentType, string> = {
    blog: 'bg-blue-50 text-blue-700',
    geo: 'bg-purple-50 text-purple-700',
    comparison: 'bg-amber-50 text-amber-700',
  };

  const linkPath = (item: ContentItem) => {
    if (item.type === 'blog') return `/blog/${item.slug}`;
    if (item.type === 'geo') return `/landscaping/${item.slug}`;
    return `/compare/${item.slug}`;
  };

  async function handleGenerate(item: ContentItem) {
    setGenerating(item.slug);
    try {
      const res = await fetch('/api/admin/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: item.type, slug: item.slug, title: item.title }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      alert(`Content generated successfully!\n\nPreview:\n${(data.content as string).slice(0, 200)}...`);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGenerating(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Content Manager</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage blog posts, GEO landing pages, and comparison pages. Use AI to generate and refresh content.
          </p>
        </div>
        <Link
          href="/admin/settings"
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          AI Settings
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="mt-6 flex gap-2">
        {(['all', 'blog', 'geo', 'comparison'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === t
                ? 'bg-brand-500 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {t === 'all' ? 'All' : t === 'blog' ? 'Blog Posts' : t === 'geo' ? 'GEO Pages' : 'Comparisons'}
            <span className="ml-1.5 text-xs opacity-70">
              ({t === 'all' ? CONTENT_ITEMS.length : CONTENT_ITEMS.filter((i) => i.type === t).length})
            </span>
          </button>
        ))}
      </div>

      {/* Content table */}
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Title</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Last Updated</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((item) => (
              <tr key={`${item.type}-${item.slug}`} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeColor[item.type]}`}>
                    {typeLabel[item.type]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Link href={linkPath(item)} className="text-brand-600 hover:underline" target="_blank">
                    {item.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    item.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{item.lastUpdated}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleGenerate(item)}
                    disabled={generating === item.slug}
                    className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
                  >
                    {generating === item.slug ? 'Generating...' : 'AI Refresh'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bulk actions */}
      <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <h3 className="text-sm font-semibold text-gray-700">Bulk AI Generation</h3>
        <p className="mt-1 text-xs text-gray-500">
          Generate or refresh all content for a category using your configured AI provider.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
            Refresh All Blog Posts
          </button>
          <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
            Refresh All GEO Pages
          </button>
          <button className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
            Refresh All Comparisons
          </button>
        </div>
      </div>
    </div>
  );
}
