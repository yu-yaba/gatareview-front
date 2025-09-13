import { ImageResponse } from 'next/server';
import { lectureApi } from '@/app/_helpers/api';
import { readFileSync } from 'fs';
import path from 'path';

async function loadFont(subset: string) {
  const fontResponse = await fetch(
    `https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&text=${encodeURIComponent(subset)}`
  );
  if (!fontResponse.ok) {
    throw new Error('Failed to fetch font CSS');
  }
  const fontCss = await fontResponse.text();
  const fontUrl = fontCss.match(/url\((.*?)\)/)?.[1];
  if (!fontUrl) {
    throw new Error('Failed to extract font URL');
  }
  const fontDataResponse = await fetch(fontUrl);
  if (!fontDataResponse.ok) {
    throw new Error('Failed to fetch font data');
  }
  return fontDataResponse.arrayBuffer();
}

export default async function Image({ params }: { params: { id: string } }) {
  const lecture = await lectureApi.getLecture(params.id);

  if (!lecture) {
    return new Response('Not Found', { status: 404 });
  }

  const textSubset = `${lecture.title}${lecture.lecturer}${lecture.faculty}平均評価ガタレビュ！${lecture.avg_rating?.toFixed(1) || 'N/A'}`;
  const fontData = await loadFont(textSubset);

  // ロゴファイルを直接読み込む
  const logoPath = path.join(process.cwd(), 'public', 'green-footer-title.png');
  const logoData = readFileSync(logoPath);

  return new ImageResponse(
    (
      <div // ルート: 緑色の背景 (枠として機能)
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#22c55e', // 緑色
        }}
      >
        <div // 内側の白いコンテンツエリア
          style={{
            width: '1130px',
            height: '560px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#fff',
            borderRadius: '30px',
            padding: '60px',
            color: '#14532d',
            fontFamily: 'Noto Sans JP',
          }}
        >
          {/* 上部: 講義情報 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '36px', color: '#16a34a' }}>{lecture.faculty}</div>
            <div style={{ fontSize: '72px', fontWeight: 700, lineHeight: 1.1 }}>{lecture.title}</div>
            <div style={{ fontSize: '48px', color: '#166534', marginTop: '20px' }}>{lecture.lecturer}</div>
          </div>

          {/* 下部: 評価とロゴ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ fontSize: '32px' }}>平均評価</div>
              <div style={{ fontSize: '60px', fontWeight: 700, color: '#f59e0b' }}>
                {lecture.avg_rating?.toFixed(1) || 'N/A'}
              </div>
            </div>
            <img 
              // @ts-ignore
              src={logoData.buffer} 
              width="250"
              alt="ガタレビュ！" 
            />
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Noto Sans JP',
          data: fontData,
          style: 'normal',
        },
      ],
    }
  );
}
