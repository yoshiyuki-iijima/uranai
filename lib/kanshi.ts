// lib/kanshi.ts
// 干支（十干十二支）計算の共通基盤
// 算命学・四柱推命の両方から利用される

/** 十干（天干） */
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export type Stem = typeof STEMS[number];

/** 十二支（地支） */
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export type Branch = typeof BRANCHES[number];

/** 五行 */
export type Element = '木' | '火' | '土' | '金' | '水';
/** 陰陽 */
export type Yin = '陽' | '陰';

/** 天干 → 五行・陰陽 */
export const STEM_ELEMENT: Record<Stem, { element: Element; yin: Yin }> = {
  甲: { element: '木', yin: '陽' },
  乙: { element: '木', yin: '陰' },
  丙: { element: '火', yin: '陽' },
  丁: { element: '火', yin: '陰' },
  戊: { element: '土', yin: '陽' },
  己: { element: '土', yin: '陰' },
  庚: { element: '金', yin: '陽' },
  辛: { element: '金', yin: '陰' },
  壬: { element: '水', yin: '陽' },
  癸: { element: '水', yin: '陰' },
};

/** 地支 → 五行・陰陽 */
export const BRANCH_ELEMENT: Record<Branch, { element: Element; yin: Yin }> = {
  子: { element: '水', yin: '陽' },
  丑: { element: '土', yin: '陰' },
  寅: { element: '木', yin: '陽' },
  卯: { element: '木', yin: '陰' },
  辰: { element: '土', yin: '陽' },
  巳: { element: '火', yin: '陰' },
  午: { element: '火', yin: '陽' },
  未: { element: '土', yin: '陰' },
  申: { element: '金', yin: '陽' },
  酉: { element: '金', yin: '陰' },
  戌: { element: '土', yin: '陽' },
  亥: { element: '水', yin: '陰' },
};

/** 地支の蔵干（地支に内包される天干） */
export const HIDDEN_STEMS: Record<Branch, Stem[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '戊', '庚'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
};

/** 干支ペア（60干支の1つ） */
export interface Kanshi {
  stem: Stem;
  branch: Branch;
  /** 60干支の通し番号 0=甲子 ... 59=癸亥 */
  index: number;
}

/** インデックス（0-59）から干支を構築 */
export function kanshiFromIndex(n: number): Kanshi {
  const i = ((n % 60) + 60) % 60;
  return {
    stem: STEMS[i % 10],
    branch: BRANCHES[i % 12],
    index: i,
  };
}

/* ============================================================
   ユリウス通日（JDN）を用いた日付ベースの干支計算
   ============================================================ */

/** グレゴリオ暦 → ユリウス通日 */
export function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * 日干支
 * 検証: 2024-01-01 = 甲子日, 2025-01-01 = 庚午日 で一致を確認済み
 */
export function dayKanshi(year: number, month: number, day: number): Kanshi {
  const jdn = gregorianToJDN(year, month, day);
  // 1900-01-01 (甲戌日, index=10) 等の既知日から導出した補正値: -11
  return kanshiFromIndex(jdn - 11);
}

/* ============================================================
   年干支・月干支（立春を境界とする節月ベース）
   ※ 厳密には太陽黄経で節入日が変動するが、ここでは簡易に
      「2/4 以降を寅月始まり」とする近似実装。
      将来的に astronomy-engine 等で節入日を精算する余地を残す。
   ============================================================ */

/** 立春の近似判定（2/4 を境界とする） */
function isAfterRisshun(year: number, month: number, day: number): boolean {
  if (month > 2) return true;
  if (month < 2) return false;
  return day >= 4;
}

/** 年干支：立春前は前年扱い */
export function yearKanshi(year: number, month: number, day: number): Kanshi {
  const effectiveYear = isAfterRisshun(year, month, day) ? year : year - 1;
  // 西暦4年 = 甲子年（(4-4)%60 = 0）
  return kanshiFromIndex(effectiveYear - 4);
}

/** 節月による月支マッピング（おおよその節入日） */
const MONTH_BRANCH_BY_NODE: { month: number; day: number; branch: Branch }[] = [
  { month: 2, day: 4, branch: '寅' }, // 立春
  { month: 3, day: 6, branch: '卯' }, // 啓蟄
  { month: 4, day: 5, branch: '辰' }, // 清明
  { month: 5, day: 6, branch: '巳' }, // 立夏
  { month: 6, day: 6, branch: '午' }, // 芒種
  { month: 7, day: 7, branch: '未' }, // 小暑
  { month: 8, day: 8, branch: '申' }, // 立秋
  { month: 9, day: 8, branch: '酉' }, // 白露
  { month: 10, day: 8, branch: '戌' }, // 寒露
  { month: 11, day: 7, branch: '亥' }, // 立冬
  { month: 12, day: 7, branch: '子' }, // 大雪
  { month: 1, day: 6, branch: '丑' }, // 小寒
];

/** 月支判定（節月ベース、近似） */
function monthBranch(year: number, month: number, day: number): Branch {
  // 該当月の節入日と比較
  const node = MONTH_BRANCH_BY_NODE.find((n) => n.month === month);
  if (node && day >= node.day) return node.branch;
  // 節入前は前月扱い
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevNode = MONTH_BRANCH_BY_NODE.find((n) => n.month === prevMonth);
  return prevNode ? prevNode.branch : '寅';
}

/** 五虎遁: 年干から月干（寅月の天干）を決定し、そこから順送り */
const YEAR_TO_TIGER_STEM: Record<Stem, Stem> = {
  甲: '丙', 己: '丙',
  乙: '戊', 庚: '戊',
  丙: '庚', 辛: '庚',
  丁: '壬', 壬: '壬',
  戊: '甲', 癸: '甲',
};

export function monthKanshi(year: number, month: number, day: number): Kanshi {
  const yk = yearKanshi(year, month, day);
  const mb = monthBranch(year, month, day);
  const tigerStem = YEAR_TO_TIGER_STEM[yk.stem];
  // 寅から該当月支までの距離を加算
  const tigerIdx = BRANCHES.indexOf('寅');
  const targetIdx = BRANCHES.indexOf(mb);
  const offset = ((targetIdx - tigerIdx) % 12 + 12) % 12;
  const stemIdx = (STEMS.indexOf(tigerStem) + offset) % 10;
  const branchIdx = BRANCHES.indexOf(mb);
  // 60干支インデックスを逆算
  // インデックス n: n%10 = stemIdx, n%12 = branchIdx を満たす 0..59
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) return kanshiFromIndex(i);
  }
  // 到達不能だが型のため
  return kanshiFromIndex(0);
}
