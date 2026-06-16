// app/layout.tsx
import './globals.css';

export const metadata = {
  title: '東洋占術アプリ — 算命学・四柱推命・易学',
  description: '生年月日と性別から、東洋三大占術による統合鑑定をお届けします',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {/* 星空背景 */}
        <div className="starfield" aria-hidden="true">
          <div className="layer" />
        </div>
        <div className="shooting-star" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
