import { createServer } from 'node:http';

const lectureId = Number(process.env.PLAYWRIGHT_LECTURE_ID || '3886');
const currentYear = String(new Date().getFullYear());
const mockResponses = new Map();
const requests = [];

const lecture = {
  id: lectureId,
  title: 'テスト用授業',
  lecturer: 'テスト教員',
  faculty: '工学部',
  avg_rating: 4.5,
  review_count: 2,
};

const reviews = {
  reviews: [
    {
      id: 101,
      rating: 5,
      lecture_id: lectureId,
      content: 'これは先頭レビューです。全文表示されることを確認するための本文です。',
      thanks_count: 0,
      user_id: 901,
      period_year: currentYear,
      period_term: '1ターム',
    },
    {
      id: 102,
      rating: 4,
      lecture_id: lectureId,
      content: 'これは2件目レビューです。制限時は先頭30文字だけ見えることを確認するための長い本文です。',
      thanks_count: 1,
      user_id: 902,
      period_year: currentYear,
      period_term: '1ターム',
    },
  ],
  access: {
    restriction_enabled: false,
    access_granted: true,
  },
};

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || '/', 'http://127.0.0.1').pathname;
  let body;
  if (!pathname.startsWith('/_test/')) requests.push({ method: request.method, path: pathname });

  if (request.method === 'GET' && pathname === '/_test/requests') {
    body = requests;
  } else if (request.method === 'POST' && pathname.startsWith('/_test/')) {
    if (pathname === '/_test/reset') {
      mockResponses.clear();
      requests.length = 0;
    } else if (pathname === '/_test/response') {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const { path, status = 200, body: mockBody, disconnect = false } = JSON.parse(Buffer.concat(chunks).toString());
      mockResponses.set(path, { status, body: mockBody, disconnect });
    }
    body = { ok: true };
  } else if (mockResponses.has(pathname)) {
    const mock = mockResponses.get(pathname);
    if (mock.disconnect) { request.socket.destroy(); return; }
    response.writeHead(mock.status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(mock.body));
    return;
  } else if (pathname === '/health') {
    body = { ok: true };
  } else if (pathname === `/api/v1/lectures/${lectureId}`) {
    body = lecture;
  } else if (pathname === '/api/v1/lectures/4001' || pathname === '/api/v1/lectures/4002') {
    const id = Number(pathname.split('/').pop());
    body = { ...lecture, id, title: id === 4001 ? 'レビュー0件の授業' : 'レビュー1件の授業', review_count: id === 4001 ? 0 : 1 };
  } else if (pathname === `/api/v1/lectures/${lectureId}/reviews`) {
    body = reviews;
  } else {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'not found' }));
    return;
  }

  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
});

server.listen(Number(process.env.PLAYWRIGHT_MOCK_API_PORT || 3101), '127.0.0.1');

const shutdown = () => server.close(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
