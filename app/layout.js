import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import Toaster from '@/components/Toaster';
import { Providers } from '@/components/motion';
import './globals.css';

const STORE = process.env.NEXT_PUBLIC_STORE_NAME || 'GameVault';

export const metadata = {
  title: { default: `${STORE} | Rent and buy console games`, template: `%s | ${STORE}` },
  description: 'Rent or buy console games. Live stock, live offers and a countdown for every rental.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f6f5ff',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Providers>
          <Nav />
          {children}
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
