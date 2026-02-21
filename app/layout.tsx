import './globals.css';
import type { Metadata } from 'next';
import { Providers } from '@/components/layout/providers';

export const metadata: Metadata = {
  title: 'GitHub AI Agent',
  description: 'AI-powered GitHub repository manager',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
