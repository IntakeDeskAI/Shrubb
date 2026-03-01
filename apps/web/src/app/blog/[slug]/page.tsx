import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostBySlug } from '@/data/blog-posts';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return { title: 'Post Not Found | Shrubb' };
  }

  return {
    title: `${post.title} | Shrubb Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

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
            <Link href="/blog" className="transition hover:text-gray-900">
              Blog
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white transition hover:bg-brand-600"
            >
              Start landscaper trial
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Article ── */}
      <article className="px-4 sm:px-6 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-1 text-sm text-gray-400 transition hover:text-brand-600"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to blog
          </Link>

          {/* Category badge */}
          <span className="mt-6 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            {post.category}
          </span>

          {/* Title */}
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <span>{post.author}</span>
            <span>&middot;</span>
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
            <span>&middot;</span>
            <span>{post.readTime}</span>
          </div>

          {/* Landscaper tip */}
          <div className="mt-4 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 sm:mt-6">
            <p className="text-xs font-bold text-brand-700 sm:text-sm">Quick tip for landscapers</p>
            <p className="mt-1 text-xs text-brand-600 sm:text-sm">Bookmark this guide and share it with your sales team — better proposals mean more closed jobs.</p>
          </div>

          {/* Content */}
          <div
            className="mt-10
              [&>h2]:mt-10 [&>h2]:mb-4 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-gray-900 sm:[&>h2]:text-2xl
              [&>p]:mb-4 [&>p]:text-[14px] [&>p]:leading-relaxed [&>p]:text-gray-600 sm:[&>p]:text-base
              [&>ul]:mb-6 [&>ul]:ml-6 [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:text-gray-600
              [&>ul>li]:leading-relaxed
              [&_a]:text-brand-600 [&_a]:underline hover:[&_a]:text-brand-700
              [&_strong]:font-semibold [&_strong]:text-gray-800"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* ── CTA Box ── */}
          <div className="mt-14 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-6 sm:px-8 sm:py-10 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Ready to send better proposals?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-gray-600">
              Shrubb helps landscapers create AI-powered, branded proposals with photorealistic
              renders in minutes. Start your free trial today.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600"
            >
              Start your landscaper trial
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </article>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="text-sm font-light tracking-wide text-gray-900">shrubb</span>
          <nav className="flex gap-6 text-sm text-gray-400">
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
