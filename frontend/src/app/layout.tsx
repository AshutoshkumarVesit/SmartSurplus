import type { Metadata } from 'next';
import './globals.css';
import localFont from 'next/font/local';
const geist = localFont({ src: './fonts/GeistVF.woff', variable: '--font-geist', display: 'swap' });
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'SmartSurplus | Food planning & redistribution',
  description: 'Predict surplus food and redistribute to NGOs and shelters using AI-powered matching.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={geist.variable}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
