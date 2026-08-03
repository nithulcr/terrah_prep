import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import './globals.css';
import { Footer } from '@/components/layout';
import { SmoothScroll } from "@/components/smooth-scroll";
import { ScrollDetector } from "@/components/ScrollDetector";
import { AuthProvider } from '@/lib/auth/auth-provider';
import { SettingsProvider } from '@/lib/contexts/settings-context';
import { ToastProvider } from '@/components/ui/toast-provider';

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: 'Terrah Qbank - Premium Exam Mock Test Platform',
  description: 'The premium exam mock test platform for Kerala PSC, SSC, Railway, Banking, and UPSC aspirants. Practice with quality questions and track your progress.',
  keywords: 'Kerala PSC, SSC, Railway, Banking, UPSC, mock test, exam preparation, online test',
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} font-body`}>
        <ScrollDetector />
        <SmoothScroll>
          <ToastProvider>
            <AuthProvider>
              <SettingsProvider>
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
              </SettingsProvider>
            </AuthProvider>
          </ToastProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
