/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';
import { getLectureForMetadata, METADATA_REVALIDATE_SECONDS } from '@/app/_helpers/serverLectureApi';

export const revalidate = METADATA_REVALIDATE_SECONDS;

function toArrayBuffer(buffer: Buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

const fontPath = path.join(process.cwd(), 'public', 'fonts', 'NotoSansJP-Variable.ttf');
const logoPath = path.join(process.cwd(), 'public', 'green-footer-title.png');

const fontData = toArrayBuffer(readFileSync(fontPath));
const logoDataUri = `data:image/png;base64,${readFileSync(logoPath).toString('base64')}`;

export default async function Image({ params }: { params: { id: string } }) {
  const lecture = await getLectureForMetadata(params.id);

  if (!lecture) {
    return new Response('Not Found', { status: 404 });
  }

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
            width: '1120px',
            height: '550px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#fff',
            borderRadius: '30px',
            padding: '60px',
            color: '#000',
            fontFamily: '"Noto Sans JP"',
            fontWeight: 700, // 全体を太字に
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)', // 軽い影を追加
          }}
        >
          {/* 上部: 講義情報 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '72px', lineHeight: 1.1 }}>{lecture.title}</div>
            <div style={{ display: 'flex', flexDirection: 'row', marginTop: '60px'}}>
              <div style={{ fontSize: '40px', color: '#166534' }}>{lecture.faculty}</div>
              <div style={{ fontSize: '40px', marginLeft: '80px', color: '#166534' }}>{lecture.lecturer}</div>
            </div>
          </div>

          {/* 下部: 評価とロゴ */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f59e0b',marginBottom: '25px' }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z" />
              </svg>
              <div style={{ fontSize: '60px' }}>
                {lecture.avg_rating?.toFixed(1) || 'N/A'}
              </div>
            </div>
            <img
              // @ts-ignore
              src={logoDataUri}
              width="350"
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
          weight: 700,
          style: 'normal',
        },
      ],
    }
  );
}
