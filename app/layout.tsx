import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title:'FlowStock｜多品牌庫存管理中心',
  description:'多品牌、多平台、多倉庫的訂單與庫存整合管理系統',
  openGraph:{title:'FlowStock｜多品牌庫存管理中心',description:'多品牌・多平台・多倉庫，一站整合營運資訊',images:['https://flowstock-demo.vercel.app/og.png']},
  twitter:{card:'summary_large_image',title:'FlowStock｜多品牌庫存管理中心',description:'多品牌・多平台・多倉庫，一站整合營運資訊',images:['https://flowstock-demo.vercel.app/og.png']}
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
