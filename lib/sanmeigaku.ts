// lib/sanmeigaku.ts
// 算命学：陰占（年月日の干支）と陽占（人体図の主星・中央星）を算出
// 算命学の星は四柱推命の通変星と1対1で対応するが名称が異なる

import { Stem, Branch, STEM_ELEMENT, yearKanshi, monthKanshi, dayKanshi } from './kanshi';
import { Gender } from './shichusuimei';

/**
 * 算命学の十大主星
 * 四柱推命の通変星と対応：
 *   貫索星=比肩 / 石門星=劫財 / 鳳閣星=食神 / 調舒星=傷官
 *   禄存星=偏財 / 司禄星=正財 / 車騎星=偏官 / 牽牛星=正官
 *   龍高星=偏印 / 玉堂星=印綬
 */
export type Shusei =
  | '貫索星' | '石門星'
  | '鳳閣星' | '調舒星'
  | '禄存星' | '司禄星'
  | '車騎星' | '牽牛星'
  | '龍高星' | '玉堂星';

const TSUHEN_TO_SHUSEI = {
  比肩: '貫索星', 劫財: '石門星',
  食神: '鳳閣星', 傷官: '調舒星',
  偏財: '禄存星', 正財: '司禄星',
  偏官: '車騎星', 正官: '牽牛星',
  偏印: '龍高星', 印綬: '玉堂星',
} as const;

import { tsuhenseiOf } from './shichusuimei';

function shuseiOf(dayStem: Stem, otherStem: Stem): Shusei {
  return TSUHEN_TO_SHUSEI[tsuhenseiOf(dayStem, otherStem)];
}

/**
 * 算命学の人体図（簡易版）
 * 中央星：日干 vs 日支蔵干主気
 * 北方星：年干 vs 日干
 * 南方星：月干 vs 日干
 * （厳密な算命学では東西も含む五星図だが、出生時刻なしのため三星構成）
 */
export interface JintaiZu {
  north: Shusei; // 年柱方向 → 親・目上・過去
  center: Shusei; // 中央 → 自分自身の本質
  south: Shusei; // 月柱方向 → 仕事・社会
}

// 地支の主気（蔵干の代表）
const BRANCH_MAIN_STEM: Record<Branch, Stem> = {
  子: '癸', 丑: '己', 寅: '甲', 卯: '乙',
  辰: '戊', 巳: '丙', 午: '丁', 未: '己',
  申: '庚', 酉: '辛', 戌: '戊', 亥: '壬',
};

export interface SanmeigakuResult {
  /** 陰占：年月日の干支 */
  inSen: {
    year: { stem: Stem; branch: Branch };
    month: { stem: Stem; branch: Branch };
    day: { stem: Stem; branch: Branch };
  };
  /** 陽占：人体図（三星） */
  jintaiZu: JintaiZu;
  /** 性別による陰陽配置の解釈方向 */
  genderAxis: '陽転' | '陰転';
}

export function calcSanmeigaku(
  year: number,
  month: number,
  day: number,
  gender: Gender
): SanmeigakuResult {
  const yk = yearKanshi(year, month, day);
  const mk = monthKanshi(year, month, day);
  const dk = dayKanshi(year, month, day);
  const dayStem = dk.stem;

  // 中央星 = 日干から見た日支主気
  const center = shuseiOf(dayStem, BRANCH_MAIN_STEM[dk.branch]);
  // 北方星 = 日干から見た年干
  const north = shuseiOf(dayStem, yk.stem);
  // 南方星 = 日干から見た月干
  const south = shuseiOf(dayStem, mk.stem);

  // 性別による陰陽配置（算命学では陰陽転換の概念がある）
  // 日干が陽×男 / 陰×女 → 陽転、それ以外 → 陰転
  const dayYin = STEM_ELEMENT[dayStem].yin;
  const genderAxis =
    (dayYin === '陽' && gender === 'male') ||
    (dayYin === '陰' && gender === 'female')
      ? '陽転'
      : '陰転';

  return {
    inSen: {
      year: { stem: yk.stem, branch: yk.branch },
      month: { stem: mk.stem, branch: mk.branch },
      day: { stem: dk.stem, branch: dk.branch },
    },
    jintaiZu: { north, center, south },
    genderAxis,
  };
}

/** 各主星の性格的キーワード（リーディング用） */
export const SHUSEI_KEYWORDS: Record<Shusei, string[]> = {
  貫索星: ['独立心', '頑固', '自我の強さ', 'マイペース'],
  石門星: ['協調性', '社交家', '組織人', 'リーダーシップ'],
  鳳閣星: ['表現力', 'ユーモア', '健康的', '楽天家'],
  調舒星: ['芸術性', '繊細', '孤独を愛す', '感受性'],
  禄存星: ['奉仕の精神', '愛情深い', '魅力的', '財運'],
  司禄星: ['堅実', '蓄財', '家庭的', '誠実'],
  車騎星: ['行動力', '正義感', '攻撃性', 'スピード'],
  牽牛星: ['名誉', '責任感', 'プライド', '組織力'],
  龍高星: ['探究心', '改革精神', '冒険', '習得力'],
  玉堂星: ['知性', '伝統', '母性', '学問'],
};
