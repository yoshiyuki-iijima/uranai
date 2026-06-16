// app/layout.tsx
// Next.js App Router のルートレイアウト（必須）

export const metadata = {
  title: '東洋占術アプリ',
  description: '算命学・四柱推命・易学による統合鑑定',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
