import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';

const displayFont = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const sansFont = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Personal wealth, expense, and savings management',
  icons: {
    icon: [
      { url: '/icon.png?v=2', type: 'image/png' },
      { url: '/favicon.ico?v=2' },
    ],
    shortcut: '/icon.png?v=2',
    apple: '/icon.png?v=2',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${displayFont.variable} ${sansFont.variable}`}>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png?v=2" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon.png?v=2" />
        <link rel="apple-touch-icon" href="/icon.png?v=2" />
        <link rel="shortcut icon" href="/icon.png?v=2" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('expense-tracker-theme') || 'aurora-dark';
                if (t === 'aurora-light') t = 'paper';
                document.documentElement.setAttribute('data-theme', t);
                var lightThemes = ['paper', 'default', 'sand', 'matcha', 'aurora-light'];
                if (lightThemes.indexOf(t) === -1) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                var p = localStorage.getItem('expense-tracker-privacy-mode') === 'true';
                if (p) document.documentElement.classList.add('privacy-blur');
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-screen selection:bg-violet-500/30 selection:text-white">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
