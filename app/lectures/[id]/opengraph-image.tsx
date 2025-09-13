import { ImageResponse } from 'next/server';
import { lectureApi } from '@/app/_helpers/api';

export const runtime = 'edge';

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

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '1200px',
          height: '630px',
          padding: '60px',
          backgroundColor: '#f0fdf4',
          color: '#14532d',
          fontFamily: 'Noto Sans JP',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '28px', marginBottom: '20px' }}>{lecture.faculty}</div>
          <div style={{ fontSize: '60px', fontWeight: 700, marginBottom: '20px' }}>{lecture.title}</div>
          <div style={{ fontSize: '36px' }}>{lecture.lecturer}</div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: '28px', marginRight: '10px' }}>平均評価</div>
            <div style={{ fontSize: '48px', fontWeight: 700 }}>{lecture.avg_rating?.toFixed(1) || 'N/A'}</div>
          </div>
          <div style={{ fontSize: '40px', fontWeight: 700 }}>ガタレビュ！</div>
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
