import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

async function fetchLectureData(id: string) {
  try {
    // Docker環境ではコンテナ間通信を使用
    const apiUrl = 'http://back:3000';
    const response = await fetch(`${apiUrl}/api/v1/lectures/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Lecture not found');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching lecture data:', error);
    return null;
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const lecture = await fetchLectureData(params.id);
    
    if (!lecture) {
      return new Response('Lecture not found', { status: 404 });
    }

    // フォントを使用しない（システムフォント使用）

    // 評価表示（星マークではなくテキスト表示）
    const rating = lecture.avg_rating ? lecture.avg_rating.toFixed(1) : '0.0';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            background: 'linear-gradient(135deg, #1DBE67 0%, #16a85a 50%, #138f4f 100%)',
            position: 'relative',
          }}
        >
          {/* 背景装飾 */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)',
            }}
          />

          {/* メインコンテンツ */}
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '60px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* ガタレビュロゴ */}
            <div
              style={{
                position: 'absolute',
                top: '40px',
                left: '60px',
                display: 'flex',
                alignItems: 'center',
                color: 'white',
                fontSize: '32px',
                fontWeight: 'bold',
                fontFamily: 'sans-serif',
              }}
            >
              ガタレビュ！
            </div>

            {/* 学部名 */}
            <div
              style={{
                color: 'rgba(255,255,255,0.9)',
                fontSize: '28px',
                marginBottom: '20px',
                fontFamily: 'sans-serif',
                fontWeight: '500',
              }}
            >
              {lecture.faculty}
            </div>

            {/* 授業タイトル */}
            <div
              style={{
                color: 'white',
                fontSize: '48px',
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: '30px',
                fontFamily: 'sans-serif',
                lineHeight: 1.2,
                maxWidth: '900px',
              }}
            >
              {lecture.title}
            </div>

            {/* 講師名 */}
            <div
              style={{
                color: 'rgba(255,255,255,0.95)',
                fontSize: '32px',
                marginBottom: '40px',
                fontFamily: 'sans-serif',
                fontWeight: '500',
              }}
            >
              {lecture.lecturer} 先生
            </div>

            {/* 評価情報 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '15px',
                padding: '20px 40px',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div
                style={{
                  color: '#FFD700',
                  fontSize: '36px',
                  marginRight: '15px',
                  fontFamily: 'sans-serif',
                }}
              >
                評価 {rating}
              </div>
              <div
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: '24px',
                  fontFamily: 'sans-serif',
                }}
              >
                {lecture.review_count || 0}件のレビュー
              </div>
            </div>

            {/* 下部ブランディング */}
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '60px',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '20px',
                fontFamily: 'sans-serif',
              }}
            >
              新潟大学授業レビューサイト
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        // デフォルトフォントを使用（フォント問題回避）
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Error generating image', { status: 500 });
  }
}