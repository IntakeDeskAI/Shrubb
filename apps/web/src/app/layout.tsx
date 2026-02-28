import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shrubb - Landscape Design Made Simple',
  description: 'Find and work with talented landscape designers. Upload photos of your yard and get professional landscape concepts.',
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
