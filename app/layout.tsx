import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://flowstock-demo.vercel.app'),
  title:'浚榮庫存系統｜材料進出與師傅領料管理',
  description:'浚榮材料進貨、總倉庫存、師傅領料與成本統計系統',
  openGraph:{title:'浚榮庫存系統',description:'材料進出、師傅領料與成本統計，一套系統自動完成',images:['/og.png']},
  twitter:{card:'summary_large_image',title:'浚榮庫存系統',description:'材料進出、師傅領料與成本統計，一套系統自動完成',images:['/og.png']}
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
