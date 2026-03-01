import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shrubb | AI Proposals for Landscapers',
  description: 'AI-powered proposals for landscaping companies. Upload a client yard photo, generate branded proposals with renders, plant lists, and accept buttons in minutes.',
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
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
