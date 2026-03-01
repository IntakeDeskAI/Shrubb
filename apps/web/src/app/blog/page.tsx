import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/data/blog-posts';

export const metadata: Metadata = {
  title: 'Landscaping Business Blog | Shrubb',
  description:
    'Tips, guides, and insights for landscaping professionals. Learn how to write better proposals, grow your business, and use AI tools to win more jobs.',
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav ── */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-light tracking-wide text-gray-900">
            shrubb
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/" className="transition hover:text-gray-900">
              Home
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white transition hover:bg-brand-600"
            >
              <span className="sm:hidden">Try free</span>
              <span className="hidden sm:inline">Start landscaper trial</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Header ── */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-brand-50 to-white px-6 py-10 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Shrubb Blog
          </h1>
          <p className="mt-3 text-lg text-gray-500">
            Insights for landscaping professionals
          </p>
        </div>
      </section>

      {/* ── Post Grid ── */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-4 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group flex flex-col rounded-xl border border-gray-200 bg-white p-4 sm:p-6 transition hover:border-brand-200 hover:shadow-md"
            >
              {/* Category badge */}
              <span className="mb-3 inline-block w-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {post.category}
              </span>

              {/* Title */}
              <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-brand-600">
                <Link href={`/blog/${post.slug}`} className="hover:underline">
                  {post.title}
                </Link>
              </h2>

              {/* Description */}
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-500">
                {post.description}
              </p>

              {/* Meta */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-400">
                <span>
                  {post.author} &middot; {post.readTime}
                </span>
                <time dateTime={post.publishedAt}>
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-light tracking-wide text-gray-900">shrubb</span>
          <nav className="flex flex-wrap gap-6 text-xs sm:text-sm text-gray-400">
            <Link href="/" className="hover:text-gray-600">
              Home
            </Link>
            <Link href="/blog" className="hover:text-gray-600">
              Blog
            </Link>
            <Link href="/login" className="hover:text-gray-600">
              Sign in
            </Link>
          </nav>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Shrubb. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
