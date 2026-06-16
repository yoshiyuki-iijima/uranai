// app/api/fortune/route.ts
// Next.js App Router の API エンドポイント
// POST /api/fortune に {birthYear, birthMonth, birthDay, gender} を送信

import { NextRequest, NextResponse } from 'next/server';
import { calcFortune, FortuneInput } from '@/lib/fortune';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<FortuneInput>;
    const input: FortuneInput = {
      birthYear: Number(body.birthYear),
      birthMonth: Number(body.birthMonth),
      birthDay: Number(body.birthDay),
      gender: body.gender === 'female' ? 'female' : 'male',
    };
    const result = calcFortune(input);
    return NextResponse.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
