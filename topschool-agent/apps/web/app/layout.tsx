import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { FavouritesProvider } from '@/components/FavouritesProvider';
import { CompareProvider } from '@/components/CompareProvider';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'TOPSchool｜學校一覽｜香港經濟日報 hket.com',
  description: '匯集了全面的中小學資訊，助您快速了解各校的特點和優勢，助您為子女做出最佳學校選擇。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body style={{ backgroundColor: 'var(--color-bg-page)', color: 'var(--color-text-primary)' }}>
        <ThemeProvider>
          <FavouritesProvider>
            <CompareProvider>
              <Navbar />
              <main id="main-content" className="min-h-screen">
                {children}
              </main>
              <footer
                className="border-t py-6 text-center text-sm"
                style={{
                  borderColor: 'var(--color-border-default)',
                  backgroundColor: 'var(--color-bg-card)',
                  color: 'var(--color-text-muted)',
                }}
              >
                香港經濟日報版權所有 © 2026
              </footer>
            </CompareProvider>
          </FavouritesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
