import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/ui/toast';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'Tender Compliance Tracker',
  description: 'Bilingual Tender Compliance Verification and Email Drafting Portal',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="h-full overflow-hidden bg-[var(--bg-app)] font-sans text-[var(--text-primary)] antialiased transition-colors duration-200">
        <SessionProvider>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
