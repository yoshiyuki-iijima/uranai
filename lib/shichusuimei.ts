// lib/shichusuimei.ts
// 四柱推命：年柱・月柱・日柱を算出し、日主からの通変星と五行バランスを判定
// 出生時刻なし → 時柱は省略。三柱でリーディングを構成。

import {
  Kanshi,
  Stem,
  Branch,
  Element,
  Yin,
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  HIDDEN_STEMS,
  STEMS,
  yearKanshi,
  monthKanshi,
  dayKanshi,
} from './kanshi';

export type Gender = 'male' | 'female';

/** 通変星（10種） */
export type Tsuhensei =
  | '比肩' | '劫財'   // 同じ五行
  | '食神' | '傷官'   // 我が生ずる
  | '偏財' | '正財'   // 我が剋する
  | '偏官' | '正官'   // 我を剋する
  | '偏印' | '印綬';  // 我を生ずる

/** 相生関係：A は B を生ずる */
const GENERATES: Record<Element, Element> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
};

/** 相剋関係：A は B を剋する */
const CONTROLS: Record<Element, Element> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
};

/**
 * 日主（日干）から見た他の天干の通変星を算出
 */
export function tsuhenseiOf(dayStem: Stem, otherStem: Stem): Tsuhensei {
  const d = STEM_ELEMENT[dayStem];
  const o = STEM_ELEMENT[otherStem];
  const sameYin = d.yin === o.yin;

  if (d.element === o.element) return sameYin ? '比肩' : '劫財';
  if (GENERATES[d.element] === o.element) return sameYin ? '食神' : '傷官';
  if (CONTROLS[d.element] === o.element) return sameYin ? '偏財' : '正財';
  if (CONTROLS[o.element] === d.element) return sameYin ? '偏官' : '正官';
  if (GENERATES[o.element] === d.element) return sameYin ? '偏印' : '印綬';
  // 到達不能
  return '比肩';
}

/** 十二運（長生・沐浴…胎・養） */
export type Junishi =
  | '長生' | '沐浴' | '冠帯' | '建禄' | '帝旺' | '衰'
  | '病'   | '死'   | '墓'   | '絶'   | '胎'   | '養';

/** 各天干の十二運起算地支（長生の位置） */
const CHOSEI_BRANCH: Record<Stem, Branch> = {
  甲: '亥', 乙: '午', 丙: '寅', 丁: '酉', 戊: '寅',
  己: '酉', 庚: '巳', 辛: '子', 壬: '申', 癸: '卯',
};

const BRANCH_ORDER: Branch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const JUNISHI_ORDER: Junishi[] = ['長生', '沐浴', '冠帯', '建禄', '帝旺', '衰', '病', '死', '墓', '絶', '胎', '養'];

/** 陽干は順行・陰干は逆行で十二運を巡る */
export function junishiOf(dayStem: Stem, branch: Branch): Junishi {
  const start = BRANCH_ORDER.indexOf(CHOSEI_BRANCH[dayStem]);
  const here = BRANCH_ORDER.indexOf(branch);
  const direction = STEM_ELEMENT[dayStem].yin === '陽' ? 1 : -1;
  const idx = ((here - start) * direction + 12 * 12) % 12;
  return JUNISHI_ORDER[idx];
}

/** 五行カウント（命式中の出現数） */
export type ElementCount = Record<Element, number>;

function emptyCount(): ElementCount {
  return { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
}

/** 命式全体（天干＋蔵干）の五行バランス */
export function tallyFiveElements(pillars: Pillar[]): ElementCount {
  const c = emptyCount();
  for (const p of pillars) {
    c[STEM_ELEMENT[p.stem].element] += 1;
    // 地支そのものの五行も加味
    c[BRANCH_ELEMENT[p.branch].element] += 0.5;
    // 蔵干も軽く加算
    for (const hs of HIDDEN_STEMS[p.branch]) {
      c[STEM_ELEMENT[hs].element] += 0.3;
    }
  }
  return c;
}

/** 1つの柱 */
export interface Pillar {
  label: '年柱' | '月柱' | '日柱';
  stem: Stem;
  branch: Branch;
  tsuhensei: Tsuhensei; // 日干から見た通変星
  junishi: Junishi;     // 十二運
}

/** 四柱推命の鑑定結果 */
export interface ShichusuimeiResult {
  pillars: Pillar[];
  dayMaster: { stem: Stem; element: Element; yin: Yin }; // 日主
  elementCount: ElementCount;
  dominantElement: Element;
  lackingElements: Element[];
  /** 大運の流れ方向（陽男陰女＝順行 / 陰男陽女＝逆行） */
  daiunDirection: '順行' | '逆行';
}

/**
 * 四柱推命メイン関数
 */
export function calcShichusuimei(
  year: number,
  month: number,
  day: number,
  gender: Gender
): ShichusuimeiResult {
  const yk = yearKanshi(year, month, day);
  const mk = monthKanshi(year, month, day);
  const dk = dayKanshi(year, month, day);

  const dayStem = dk.stem;
  const buildPillar = (k: Kanshi, label: Pillar['label']): Pillar => ({
    label,
    stem: k.stem,
    branch: k.branch,
    tsuhensei: tsuhenseiOf(dayStem, k.stem),
    junishi: junishiOf(dayStem, k.branch),
  });

  const pillars: Pillar[] = [
    buildPillar(yk, '年柱'),
    buildPillar(mk, '月柱'),
    buildPillar(dk, '日柱'),
  ];

  const elementCount = tallyFiveElements(pillars);
  const dominantElement = (Object.entries(elementCount) as [Element, number][])
    .reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  const lackingElements = (Object.entries(elementCount) as [Element, number][])
    .filter(([, v]) => v === 0)
    .map(([k]) => k);

  // 大運の方向：陽干年生まれの男 / 陰干年生まれの女 = 順行
  const yearStemYin = STEM_ELEMENT[yk.stem].yin;
  const isForward =
    (yearStemYin === '陽' && gender === 'male') ||
    (yearStemYin === '陰' && gender === 'female');

  return {
    pillars,
    dayMaster: {
      stem: dayStem,
      element: STEM_ELEMENT[dayStem].element,
      yin: STEM_ELEMENT[dayStem].yin,
    },
    elementCount,
    dominantElement,
    lackingElements,
    daiunDirection: isForward ? '順行' : '逆行',
  };
}
