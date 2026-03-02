import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Shrubb | AI Sales Engine for Landscapers',
    template: '%s | Shrubb',
  },
  description:
    'AI-powered proposals for landscaping companies. Upload a client yard photo, generate branded proposals with renders, plant lists, and accept buttons in minutes.',
  metadataBase: new URL('https://www.shrubb.com'),
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Shrubb',
    title: 'Shrubb | AI Sales Engine for Landscapers',
    description:
      'AI-powered proposals for landscaping companies. Generate branded proposals with renders, plant lists, and accept buttons in minutes.',
    url: 'https://www.shrubb.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shrubb | AI Sales Engine for Landscapers',
    description:
      'AI-powered proposals for landscaping companies. Generate branded proposals with renders, plant lists, and accept buttons in minutes.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.shrubb.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-white text-gray-900 antialiased ${inter.className}`}>
        {children}
      </body>
    </html>
  );
}
