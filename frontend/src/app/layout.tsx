import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'BidBox | On-Chain Auction on Botchain Mainnet',
  description: 'Place your bid. Win the item. Transparent and decentralized on-chain auctions on Botchain Mainnet.',
  icons: {
    icon: [
      { url: '/bidbox-favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/bidbox-favicon.svg',
    apple: '/bidbox-favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#070A12] text-slate-100 antialiased selection:bg-purple-500 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
