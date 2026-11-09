const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  resolveIsOwn,
  toPublicLatestReviews,
  toPublicLectureReviews,
  toPublicReview,
} = require('../../app/_helpers/publicReview.ts');

const legacyReview = {
  id: 1, rating: 4.5, content: '本文', lecture_id: '10', textbook: '必要', attendance: 'なし', grading_type: 'テストのみ',
  content_difficulty: '普通', content_quality: '良い', period_year: '2026', period_term: '1ターム',
  created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z', thanks_count: 2,
  user_id: 901, user: { id: 901, name: 'PRIVATE_NAME', avatar_url: 'https://example.invalid/PRIVATE_AVATAR' },
  email: 'private@example.invalid', internal_note: 'PRIVATE_FIELD',
};

test('only whitelisted review fields and is_own leave the server', () => {
  const review = toPublicReview(legacyReview, false);
  assert.deepEqual(Object.keys(review).sort(), [
    'attendance', 'content', 'content_difficulty', 'content_quality', 'grading_type', 'id', 'is_own',
    'lecture_id', 'period_term', 'period_year', 'rating', 'textbook', 'thanks_count',
  ]);
  assert.doesNotMatch(JSON.stringify(review), /PRIVATE|user_id|avatar_url|"user"|created_at|updated_at/);
});

test('is_own from the backend wins over the legacy user_id comparison', () => {
  assert.equal(resolveIsOwn({ is_own: true }, null), true);
  assert.equal(resolveIsOwn({ is_own: false, user_id: 901 }, '901'), false);
});

test('legacy backends are compared with the signed-in viewer only', () => {
  assert.equal(resolveIsOwn({ user_id: 901 }, '901'), true);
  assert.equal(resolveIsOwn({ user_id: 901 }, 901), true);
  assert.equal(resolveIsOwn({ user_id: 902 }, '901'), false);
  for (const viewer of [null, undefined, '']) assert.equal(resolveIsOwn({ user_id: 901 }, viewer), false);
  for (const userId of [null, undefined]) assert.equal(resolveIsOwn({ user_id: userId }, '901'), false);
  assert.equal(resolveIsOwn(null, '901'), false);
});

test('lecture review responses are whitelisted and keep the access state', () => {
  const result = toPublicLectureReviews({
    reviews: [legacyReview, { ...legacyReview, id: 2, user_id: 902 }],
    access: { restriction_enabled: true, access_granted: false, viewer_email: 'PRIVATE' },
    debug: 'PRIVATE',
  }, '901');
  assert.deepEqual(result.access, { restriction_enabled: true, access_granted: false });
  assert.deepEqual(result.reviews.map(review => [review.id, review.is_own]), [[1, true], [2, false]]);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|user_id|avatar_url|"user"/);
  assert.equal(toPublicLectureReviews({ error: 'x' }), null);
  assert.deepEqual(toPublicLectureReviews({ reviews: [] }).access, { restriction_enabled: false, access_granted: true });
});

test('latest reviews keep only the card fields', () => {
  const [review] = toPublicLatestReviews([{
    id: 7, rating: 5, content: '最新', created_at: 'x', user_id: 901, user: legacyReview.user,
    lecture: { id: 10, title: '授業', lecturer: '教員', faculty: '工学部', secret: 'PRIVATE' },
  }]);
  assert.deepEqual(review, { id: 7, rating: 5, content: '最新', lecture: { id: 10, title: '授業', lecturer: '教員', faculty: '工学部' } });
  assert.equal(toPublicLatestReviews({ error: 'not found' }), null);
});
