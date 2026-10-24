import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { encode } = require('next-auth/jwt');
const privateToken = 'isolated-streaming-api-token-never-render-this';
const baseline = process.env.STREAM_TEST_BASELINE === '1';
const appDirectory = process.env.STREAM_TEST_APP_DIR || process.cwd();
const port = Number(process.env.STREAM_TEST_PORT || 3189);
const requests = [];
const publicDelayMs = 120;
const reviewDelayMs = 900;
const backend = createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  const isReviews = path.endsWith('/reviews');
  const viewer = request.headers.authorization === `Bearer ${privateToken}` ? 'signed-in' : 'anonymous';
  const id = Number(path.split('/')[4]);
  const item = { path, started: performance.now(), completed: null, bytes: 0 };
  requests.push(item);
  await delay(isReviews ? reviewDelayMs : publicDelayMs);
  let body;
  let status = 200;
  if (id === 999999) { status = 404; body = {error:'not found'}; }
  else if (isReviews && id === 999998) { status = 503; body = {error:'test failure'}; }
  else if (isReviews) body = {reviews:[{id:1,lecture_id:id,rating:4,content:`公開レビューの表示を確認するための本文です。stream-review-${id}-${viewer}`,thanks_count:0}],access:{restriction_enabled:false,access_granted:true}};
  else body = {id,title:`表示速度の検証${id}`,lecturer:'テスト教員',faculty:'工学部',avg_rating:4,review_count:1};
  const json = JSON.stringify(body);
  item.completed = performance.now();item.bytes = Buffer.byteLength(json);
  response.writeHead(status, {'Content-Type':'application/json','Cache-Control':'private, no-store'});
  response.end(json);
});
await new Promise(resolve => backend.listen(0, '127.0.0.1', resolve));
const backendURL = `http://127.0.0.1:${backend.address().port}`;
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'),'start','-H','127.0.0.1','-p',String(port)], {
  cwd:appDirectory,env:{...process.env,DOCKER_BACKEND_URL:backendURL,NEXTAUTH_URL:base,NEXTAUTH_SECRET:'local-stream-test-secret'},stdio:['ignore','pipe','pipe'],
});
let output = '';
child.stdout.on('data', x => {output += x;});child.stderr.on('data',x => {output += x;});
async function readPage(id, userAgent = 'Mozilla/5.0 Chrome/131.0.0.0 Safari/537.36', cookie = null) {
  const started = performance.now();
  const response = await fetch(`${base}/lectures/${id}`,{headers:{'User-Agent':userAgent,...(cookie ? {Cookie:cookie} : {})}});
  const reader = response.body.getReader();
  const decoder = new TextDecoder();let html = '';let summaryMs = null;
  while(true) {
    const {done,value} = await reader.read();if(done)break;
    html += decoder.decode(value,{stream:true});
    if(summaryMs===null && /<h1[\s>]/.test(html))summaryMs=performance.now()-started;
  }
  return {started,summaryMs,completeMs:performance.now()-started,status:response.status,bytes:Buffer.byteLength(html),html};
}
try {
  let ready = false;
  for(let i=0;i<100;i++) {
    if(child.exitCode!==null)throw new Error(output);
    try {await fetch(base+'/api/auth/providers');ready=true;break;}catch {await delay(100);}
  }
  assert.ok(ready,'Next production server must start');
  const samples = [];
  const firstId = 700000 + Math.floor(Math.random()*100000);
  for(let i=0;i<6;i++) {
    const id = i<3 ? firstId+i : firstId;
    const result = await readPage(id);
    assert.equal(result.status,200);assert.ok(result.html.includes(`stream-review-${id}`));
    const review = requests.filter(x=>x.path===`/api/v1/lectures/${id}/reviews`).at(-1);
    const completed = review.completed-result.started;
    if(!baseline) {
      assert.ok(result.summaryMs < completed-300,'public summary must arrive while private reviews are pending');
      assert.ok(result.html.includes('レビューを読み込んでいます'));
    } else assert.ok(result.summaryMs >= completed,'baseline waits for reviews before sending the summary');
    samples.push({cache:i<3?'cold':'warm',summaryMs:result.summaryMs,completeMs:result.completeMs,reviewApiCompleteMs:completed,htmlBytes:result.bytes});
  }
  assert.equal(requests.filter(x=>x.path===`/api/v1/lectures/${firstId}`).length,1,'public cache must remain shared');
  assert.equal(requests.filter(x=>x.path===`/api/v1/lectures/${firstId}/reviews`).length,4,'reviews must never be cached');
  const session = await encode({secret:'local-stream-test-secret',token:{backendToken:privateToken,user:{id:'A',name:'A',email:'a@example.test'}}});
  const signedIn = await readPage(firstId,undefined,`next-auth.session-token=${session}`);
  assert.ok(signedIn.html.includes(`stream-review-${firstId}-signed-in`));
  assert.ok(!signedIn.html.includes(privateToken),'a server component must never serialize the API bearer token');
  const signedOut = await readPage(firstId);
  assert.ok(signedOut.html.includes(`stream-review-${firstId}-anonymous`));
  assert.ok(!signedOut.html.includes(`stream-review-${firstId}-signed-in`));
  const crawler = await readPage(firstId,'Twitterbot/1.0');
  assert.equal(crawler.status,200);assert.ok(crawler.html.includes('<title>表示速度の検証'));assert.ok(crawler.html.includes(`stream-review-${firstId}`));
  const failure = await readPage(999998);
  assert.ok(failure.html.includes('レビューの取得に失敗しました'));
  const missing = await readPage(999999,'Twitterbot/1.0');
  assert.equal(missing.status,404);
  assert.ok(!requests.some(x=>x.path==='/api/v1/lectures/999999/reviews'),'missing lectures must not start a review request');
  console.log(JSON.stringify({baseline,publicDelayMs,reviewDelayMs,samples,checks:['early public summary','uncached reviews','public cache sharing','server bearer token not serialized','sign-out isolation','crawler metadata and content','review error recovery UI','404 before review fetch']}));
} catch(error) {console.error(output.slice(-3000));throw error;}
finally {child.kill('SIGTERM');if(child.exitCode===null)await once(child,'exit');await new Promise(resolve=>backend.close(resolve));}
