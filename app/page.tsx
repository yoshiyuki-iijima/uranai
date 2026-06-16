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

const currentYear = new Date().getFullYear();

export default function Home() {
  const [year, setYear] = useState('1990');
  const [month, setMonth] = useState('1');
  const [day, setDay] = useState('1');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [result, setResult] = useState<FortuneResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/fortune', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          birthYear: Number(year),
          birthMonth: Number(month),
          birthDay: Number(day),
          gender,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.error ?? 'request failed');
      }
      setResult(await res.json());
      // 結果へスムーズスクロール
      setTimeout(() => {
        document.getElementById('results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'unknown error');
    } finally {
      setLoading(false);
    }
  };

  const numeric = (v: string) => v.replace(/[^\d]/g, '');

  return (
    <main className="container">
      <header className="hero">
        <h1 className="hero-title">星々が語る、あなたの軌跡</h1>
        <p className="hero-subtitle">Sanmeigaku ・ Shichu-Suimei ・ Ekigaku</p>
      </header>

      <section className="card form-card">
        <div className="form-row">
          <label className="form-label">生年月日</label>
          <div className="date-inputs">
            <input
              className="date-input"
              type="text"
              inputMode="numeric"
              placeholder="1990"
              value={year}
              onChange={(e) => setYear(numeric(e.target.value).slice(0, 4))}
              maxLength={4}
              aria-label="年"
            />
            <input
              className="date-input"
              type="text"
              inputMode="numeric"
              placeholder="月"
              value={month}
              onChange={(e) => setMonth(numeric(e.target.value).slice(0, 2))}
              maxLength={2}
              aria-label="月"
            />
            <input
              className="date-input"
              type="text"
              inputMode="numeric"
              placeholder="日"
              value={day}
              onChange={(e) => setDay(numeric(e.target.value).slice(0, 2))}
              maxLength={2}
              aria-label="日"
            />
          </div>
        </div>

        <div className="form-row">
          <label className="form-label">性別</label>
          <div className="gender-toggle">
            <button
              type="button"
              className={`gender-option ${gender === 'male' ? 'active' : ''}`}
              onClick={() => setGender('male')}
            >
              男性
            </button>
            <button
              type="button"
              className={`gender-option ${gender === 'female' ? 'active' : ''}`}
              onClick={() => setGender('female')}
            >
              女性
            </button>
          </div>
        </div>

        <button className="divine-button" onClick={onSubmit} disabled={loading}>
          {loading ? (
            <span className="divine-button-loading">
              <span className="spinner" />
              読み解いています
            </span>
          ) : (
            '鑑定する'
          )}
        </button>

        {error && <p className="error-msg">⚠ {error}</p>}
      </section>

      {result && (
        <section id="results" className="results">
          <div className="result-card result-card-synthesis">
            <p className="result-title">統合リーディング</p>
            <p className="synthesis-traits">{result.synthesis.coreTraits.join(' ・ ')}</p>
            <p className="result-text">{result.synthesis.elementProfile}</p>
            <p className="result-text">
              <strong>今のテーマ</strong>　{result.synthesis.currentTheme}
            </p>
            <p className="result-text">{result.synthesis.suggestion}</p>
          </div>

          <div className="result-card">
            <p className="result-title">四柱推命</p>
            <table className="pillar-table">
              <thead>
                <tr>
                  <th>柱</th>
                  <th>干支</th>
                  <th>通変星</th>
                  <th>十二運</th>
                </tr>
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
            <div className="meta-row">
              <span className="meta-label">日主</span>
              <span className="meta-value">
                {result.shichusuimei.dayMaster.stem}（{result.shichusuimei.dayMaster.element}・{result.shichusuimei.dayMaster.yin}）
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">主気五行</span>
              <span className="meta-value">{result.shichusuimei.dominantElement}</span>
            </div>
            <div className="meta-row">
              <span className="meta-label">不足五行</span>
              <span className="meta-value">
                {result.shichusuimei.lackingElements.join('、') || 'なし'}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-label">大運の流れ</span>
              <span className="meta-value">{result.shichusuimei.daiunDirection}</span>
            </div>
          </div>

          <div className="result-card">
            <p className="result-title">算命学 ・ 人体図</p>
            <div className="jintai-grid">
              <div className="jintai-star">
                <p className="jintai-position">北 — 親縁・過去</p>
                <p className="jintai-name">{result.sanmeigaku.jintaiZu.north}</p>
              </div>
              <div className="jintai-star jintai-star-center">
                <p className="jintai-position">中央 — 本質</p>
                <p className="jintai-name">{result.sanmeigaku.jintaiZu.center}</p>
              </div>
              <div className="jintai-star">
                <p className="jintai-position">南 — 社会・仕事</p>
                <p className="jintai-name">{result.sanmeigaku.jintaiZu.south}</p>
              </div>
            </div>
            <div className="meta-row">
              <span className="meta-label">陰陽配置</span>
              <span className="meta-value">{result.sanmeigaku.genderAxis}</span>
            </div>
          </div>

          <div className="result-card">
            <p className="result-title">易学</p>
            <div className="hexagram">
              <div className="hexagram-symbol">
                {result.ekigaku.upper.symbol}
                <br />
                {result.ekigaku.lower.symbol}
              </div>
              <div className="hexagram-info">
                <p className="hexagram-name">{result.ekigaku.hexagramName}</p>
                <p className="hexagram-trigrams">
                  上卦：{result.ekigaku.upper.name}（{result.ekigaku.upper.element}）　
                  下卦：{result.ekigaku.lower.name}（{result.ekigaku.lower.element}）
                </p>
                <div className="hexagram-keywords">
                  {result.ekigaku.keywords.map((k) => (
                    <span key={k} className="keyword-tag">{k}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="meta-row">
              <span className="meta-label">動爻</span>
              <span className="meta-value">
                第{result.ekigaku.movingLine}爻 — {result.ekigaku.movingLineHint}
              </span>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
