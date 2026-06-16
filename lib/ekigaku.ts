// lib/ekigaku.ts
// 易学：梅花心易の数立卦法を生年月日に応用
// 出生時刻がないため性別を時数の代替として使用（男=陽=1, 女=陰=2）

import { Gender } from './shichusuimei';
import { yearKanshi, BRANCHES } from './kanshi';

/**
 * 八卦
 * 1: 乾(天), 2: 兌(沢), 3: 離(火), 4: 震(雷),
 * 5: 巽(風), 6: 坎(水), 7: 艮(山), 8: 坤(地)
 */
export const TRIGRAMS = [
  { num: 1, name: '乾', element: '天', symbol: '☰' },
  { num: 2, name: '兌', element: '沢', symbol: '☱' },
  { num: 3, name: '離', element: '火', symbol: '☲' },
  { num: 4, name: '震', element: '雷', symbol: '☳' },
  { num: 5, name: '巽', element: '風', symbol: '☴' },
  { num: 6, name: '坎', element: '水', symbol: '☵' },
  { num: 7, name: '艮', element: '山', symbol: '☶' },
  { num: 8, name: '坤', element: '地', symbol: '☷' },
] as const;
export type Trigram = typeof TRIGRAMS[number];

/** 64卦：上卦×下卦の組み合わせ名 */
// 伝統的な序卦（周易上経下経）の名称表（上卦row × 下卦col）
// 行: 上卦1〜8、列: 下卦1〜8
const HEXAGRAM_NAMES: string[][] = [
  // 上卦=乾
  ['乾為天', '天沢履', '天火同人', '天雷无妄', '天風姤', '天水訟', '天山遯', '天地否'],
  // 上卦=兌
  ['沢天夬', '兌為沢', '沢火革', '沢雷随', '沢風大過', '沢水困', '沢山咸', '沢地萃'],
  // 上卦=離
  ['火天大有', '火沢睽', '離為火', '火雷噬嗑', '火風鼎', '火水未済', '火山旅', '火地晋'],
  // 上卦=震
  ['雷天大壮', '雷沢帰妹', '雷火豊', '震為雷', '雷風恒', '雷水解', '雷山小過', '雷地予'],
  // 上卦=巽
  ['風天小畜', '風沢中孚', '風火家人', '風雷益', '巽為風', '風水渙', '風山漸', '風地観'],
  // 上卦=坎
  ['水天需', '水沢節', '水火既済', '水雷屯', '水風井', '坎為水', '水山蹇', '水地比'],
  // 上卦=艮
  ['山天大畜', '山沢損', '山火賁', '山雷頤', '山風蠱', '山水蒙', '艮為山', '山地剥'],
  // 上卦=坤
  ['地天泰', '地沢臨', '地火明夷', '地雷復', '地風升', '地水師', '地山謙', '坤為地'],
];

/** 卦辞のキーワード（簡易リーディング用） */
const HEXAGRAM_KEYWORDS: Record<string, string[]> = {
  乾為天: ['創造', '剛健', 'リーダーシップ', '前進'],
  坤為地: ['受容', '柔順', '育成', '大地'],
  水雷屯: ['萌芽', '困難の中の成長', '忍耐'],
  山水蒙: ['啓蒙', '学び', '未熟', '教育'],
  水天需: ['待機', '時を待つ', '準備'],
  天水訟: ['争訟', '対立', '慎重'],
  地水師: ['統率', '軍勢', '規律'],
  水地比: ['親しむ', '協力', '連帯'],
  風天小畜: ['小さな蓄え', '抑制'],
  天沢履: ['礼節', '一歩ずつ'],
  地天泰: ['平和', '繁栄', '通じる'],
  天地否: ['閉塞', '不通', '我慢の時'],
  天火同人: ['同志', '協力', '公平'],
  火天大有: ['大いなる所有', '繁栄'],
  地山謙: ['謙虚', '控えめ', '徳'],
  雷地予: ['喜び', '楽しみ', '備え'],
  沢雷随: ['従う', '柔軟', '時に応じる'],
  山風蠱: ['整える', '改革', '腐敗の刷新'],
  // 残りはデフォルトキーワードで補完
};

const DEFAULT_KEYWORDS = ['変化', '転換', '内省', '機を見る'];

/** 動爻位置に応じた追加キーワード */
const MOVING_LINE_HINT: Record<number, string> = {
  1: '物事の始まり・基礎',
  2: '内面の充実・パートナー',
  3: '転換点・葛藤',
  4: '近しい人との関係・補佐',
  5: '指導的立場・成熟',
  6: '完成と次への準備',
};

export interface EkigakuResult {
  upper: Trigram;
  lower: Trigram;
  hexagramName: string;
  /** 動爻：1〜6（下から） */
  movingLine: number;
  keywords: string[];
  movingLineHint: string;
}

/**
 * 梅花心易：年支番号 + 月 + 日 から立卦
 * 性別を時数の代替として使用（男=1, 女=2）
 */
export function calcEkigaku(
  year: number,
  month: number,
  day: number,
  gender: Gender
): EkigakuResult {
  // 年支の番号（子=1, 丑=2, ..., 亥=12）
  const yk = yearKanshi(year, month, day);
  const yearBranchNum = BRANCHES.indexOf(yk.branch) + 1;

  // 性別を時数の代替に（男=1=陽, 女=2=陰）
  const genderNum = gender === 'male' ? 1 : 2;

  // 上卦 = (年支 + 月 + 日) mod 8 (0 のときは 8)
  const upperRaw = (yearBranchNum + month + day) % 8;
  const upperNum = upperRaw === 0 ? 8 : upperRaw;

  // 下卦 = (年支 + 月 + 日 + 性別) mod 8
  const lowerRaw = (yearBranchNum + month + day + genderNum) % 8;
  const lowerNum = lowerRaw === 0 ? 8 : lowerRaw;

  // 動爻 = (年支 + 月 + 日 + 性別) mod 6
  const moveRaw = (yearBranchNum + month + day + genderNum) % 6;
  const movingLine = moveRaw === 0 ? 6 : moveRaw;

  const upper = TRIGRAMS[upperNum - 1];
  const lower = TRIGRAMS[lowerNum - 1];
  const hexagramName = HEXAGRAM_NAMES[upperNum - 1][lowerNum - 1];
  const keywords = HEXAGRAM_KEYWORDS[hexagramName] ?? DEFAULT_KEYWORDS;
  const movingLineHint = MOVING_LINE_HINT[movingLine];

  return {
    upper,
    lower,
    hexagramName,
    movingLine,
    keywords,
    movingLineHint,
  };
}
