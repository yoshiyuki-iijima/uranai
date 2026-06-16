// lib/fortune.ts
// 3つの占術を統合し、最終的なリーディング結果を組み立てる

import { calcShichusuimei, ShichusuimeiResult, Gender } from './shichusuimei';
import { calcSanmeigaku, SanmeigakuResult, SHUSEI_KEYWORDS } from './sanmeigaku';
import { calcEkigaku, EkigakuResult } from './ekigaku';

export interface FortuneInput {
  birthYear: number;
  birthMonth: number;  // 1-12
  birthDay: number;    // 1-31
  gender: Gender;
}

export interface FortuneResult {
  input: FortuneInput;
  shichusuimei: ShichusuimeiResult;
  sanmeigaku: SanmeigakuResult;
  ekigaku: EkigakuResult;
  /** 3システムから抽出した統合キーワード */
  synthesis: {
    coreTraits: string[];
    elementProfile: string;
    currentTheme: string;
    suggestion: string;
  };
}

export function calcFortune(input: FortuneInput): FortuneResult {
  const { birthYear: y, birthMonth: m, birthDay: d, gender } = input;
  validateInput(input);

  const shichusuimei = calcShichusuimei(y, m, d, gender);
  const sanmeigaku = calcSanmeigaku(y, m, d, gender);
  const ekigaku = calcEkigaku(y, m, d, gender);

  // 統合：算命学の中央星 + 四柱推命の日主 + 易の卦テーマで人物像を要約
  const centerKeywords = SHUSEI_KEYWORDS[sanmeigaku.jintaiZu.center];
  const synthesis = {
    coreTraits: centerKeywords.slice(0, 3),
    elementProfile: buildElementProfile(shichusuimei),
    currentTheme: `${ekigaku.hexagramName}（${ekigaku.upper.name}/${ekigaku.lower.name}）— ${ekigaku.keywords.join('・')}`,
    suggestion: buildSuggestion(shichusuimei, ekigaku),
  };

  return { input, shichusuimei, sanmeigaku, ekigaku, synthesis };
}

function validateInput(input: FortuneInput): void {
  const { birthYear, birthMonth, birthDay, gender } = input;
  if (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > 2100) {
    throw new Error('birthYear must be between 1900 and 2100');
  }
  if (!Number.isInteger(birthMonth) || birthMonth < 1 || birthMonth > 12) {
    throw new Error('birthMonth must be between 1 and 12');
  }
  if (!Number.isInteger(birthDay) || birthDay < 1 || birthDay > 31) {
    throw new Error('birthDay must be between 1 and 31');
  }
  // 実日数チェック
  const d = new Date(birthYear, birthMonth - 1, birthDay);
  if (
    d.getFullYear() !== birthYear ||
    d.getMonth() !== birthMonth - 1 ||
    d.getDate() !== birthDay
  ) {
    throw new Error('invalid date');
  }
  if (gender !== 'male' && gender !== 'female') {
    throw new Error('gender must be male or female');
  }
}

function buildElementProfile(s: ShichusuimeiResult): string {
  const dom = s.dominantElement;
  const lacks = s.lackingElements;
  let txt = `命式の主気は「${dom}」。日主${s.dayMaster.stem}（${s.dayMaster.element}・${s.dayMaster.yin}）。`;
  if (lacks.length > 0) {
    txt += `不足する五行は「${lacks.join('、')}」で、これを補う環境・人物との縁が運勢を整える鍵となります。`;
  } else {
    txt += '五行のバランスは比較的整っており、自分の軸を信じて進める運気です。';
  }
  return txt;
}

function buildSuggestion(s: ShichusuimeiResult, e: EkigakuResult): string {
  const dir = s.daiunDirection === '順行'
    ? '人生の運気は素直に時の流れに沿って広がるタイプ。'
    : '人生の運気は時の流れに逆らうように深まるタイプ。';
  return `${dir}今期のテーマは「${e.keywords[0]}」。${e.movingLineHint}を意識すると流れを掴みやすいでしょう。`;
}
