import { NextRequest, NextResponse } from 'next/server';
import { getPublicLectureList } from '@/app/_helpers/serverLectureSearch';
import { publicLectureQuery } from '@/app/_helpers/lectureSearch';

export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'private, no-store' };
  try {
    publicLectureQuery(request.nextUrl.searchParams);
  } catch {
    return NextResponse.json({ error: '検索条件を確認してください。' }, { status: 400, headers });
  }
  try {
    return NextResponse.json(await getPublicLectureList(request.nextUrl.searchParams), { headers });
  } catch {
    return NextResponse.json({ error: '授業情報を取得できませんでした。' }, { status: 503, headers });
  }
}
