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
      <body className="h-full overflow-hidden bg-[var(--mrpl-paper-50)] font-sans text-[var(--mrpl-ink-950)] antialiased transition-colors duration-200">
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
