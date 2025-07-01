
import type { Metadata } from 'next';
import { Toaster as ShadToaster } from "@/components/ui/toaster"; // Renamed to avoid conflict
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NetworkStatusProvider } from '@/contexts/NetworkStatusContext';
import { WagmiProviders } from '@/lib/wagmiProviders'; // Import WagmiProviders
import { AuthProvider } from '@/hooks/useAuth';
import { WalletProvider } from '@/contexts/WalletContext';
import { QspProvider } from '@/contexts/QspContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Q-SmartPay App',
  description: 'Enhanced payment experiences with Q-SmartPay on Amazon Pay',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* System font stack is defined in globals.css & tailwind.config.ts */}
      </head>
      <body className="antialiased flex flex-col min-h-screen" suppressHydrationWarning> 
        <WagmiProviders>
          <AuthProvider>
            <WalletProvider>
              <QspProvider>
                <NetworkStatusProvider>
                  <Header />
                  <main className="flex-grow">
                    {children}
                  </main>
                  <Footer />
                  <ShadToaster />
                </NetworkStatusProvider>
              </QspProvider>
            </WalletProvider>
          </AuthProvider>
        </WagmiProviders>
      </body>
    </html>
  );
}
