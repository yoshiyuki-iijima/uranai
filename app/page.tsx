// app/page.tsx
'use client';
import { useState } from 'react';

interface FortuneResponse {
  shichusuimei: {
    pillars: Array<{ label: string; stem: string; branch: string; tsuhensei: string; junishi: string }>;
    dayMaster: { stem: string; element: string; yin: string };
    elementCount: Record<string, number>;
    dominantElement: string;
    lackingElements: string[];
    daiunDirection: string;
  };
  sanmeigaku: {
    jintaiZu: { north: string; center: string; south: string };
    genderAxis: string;
  };
  ekigaku: {
    hexagramName: string;
    upper: { name: string; element: string; symbol: string };
    lower: { name: string; element: string; symbol: string };
    movingLine: number;
    keywords: string[];
    movingLineHint: string;
  };
  synthesis: {
    coreTraits: string[];
    elementProfile: string;
    currentTheme: string;
    suggestion: string;
  };
}

export default function Home() {
  const [date, setDate] = useState('1990-01-01');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [result, setResult] = useState<FortuneResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const [y, m, d] = date.split('-').map(Number);
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthYear: y, birthMonth: m, birthDay: d, gender }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'request failed');
      }
      setResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: '40px auto', padding: 16, fontFamily: 'sans-serif' }}>
      <h1>東洋占術アプリ</h1>
      <p>算命学・四柱推命・易学による統合鑑定</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '20px 0' }}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min="1900-01-01"
          max="2100-12-31"
        />
        <select value={gender} onChange={(e) => setGender(e.target.value as 'male' | 'female')}>
          <option value="male">男性</option>
          <option value="female">女性</option>
        </select>
        <button onClick={onSubmit} disabled={loading}>
          {loading ? '計算中…' : '鑑定する'}
        </button>
      </div>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {result && (
        <section style={{ display: 'grid', gap: 24 }}>
          <Card title="統合リーディング">
            <p><strong>本質：</strong>{result.synthesis.coreTraits.join('・')}</p>
            <p>{result.synthesis.elementProfile}</p>
            <p><strong>今のテーマ：</strong>{result.synthesis.currentTheme}</p>
            <p>{result.synthesis.suggestion}</p>
          </Card>

          <Card title="四柱推命">
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr><th>柱</th><th>干支</th><th>通変星</th><th>十二運</th></tr>
              </thead>
              <tbody>
                {result.shichusuimei.pillars.map((p) => (
                  <tr key={p.label}>
                    <td>{p.label}</td>
                    <td>{p.stem}{p.branch}</td>
                    <td>{p.tsuhensei}</td>
                    <td>{p.junishi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>日主：{result.shichusuimei.dayMaster.stem}（{result.shichusuimei.dayMaster.element}・{result.shichusuimei.dayMaster.yin}）</p>
            <p>主気五行：{result.shichusuimei.dominantElement} / 不足：{result.shichusuimei.lackingElements.join('、') || 'なし'}</p>
            <p>大運：{result.shichusuimei.daiunDirection}</p>
          </Card>

          <Card title="算命学（人体図）">
            <p>北方星（年柱・親縁）：{result.sanmeigaku.jintaiZu.north}</p>
            <p>中央星（本質）：<strong>{result.sanmeigaku.jintaiZu.center}</strong></p>
            <p>南方星（月柱・社会）：{result.sanmeigaku.jintaiZu.south}</p>
            <p>陰陽配置：{result.sanmeigaku.genderAxis}</p>
          </Card>

          <Card title="易学">
            <p style={{ fontSize: 32 }}>
              {result.ekigaku.upper.symbol}<br />
              {result.ekigaku.lower.symbol}
            </p>
            <p><strong>{result.ekigaku.hexagramName}</strong></p>
            <p>動爻：第{result.ekigaku.movingLine}爻（{result.ekigaku.movingLineHint}）</p>
            <p>キーワード：{result.ekigaku.keywords.join('・')}</p>
          </Card>
        </section>
      )}
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {children}
    </div>
  );
}
