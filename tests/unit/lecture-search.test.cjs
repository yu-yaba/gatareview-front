const { test } = require('node:test');
const assert = require('node:assert/strict');
const { publicLectureQuery } = require('../../app/_helpers/lectureSearch.ts');

test('public search keys ignore display-only flags and query ordering', () => {
  assert.equal(publicLectureQuery(new URLSearchParams('sort=newest&detailed=true&tracking=ignored&page=01')), 'page=1');
  assert.equal(publicLectureQuery(new URLSearchParams('faculty=T&search=a&page=2')),
    publicLectureQuery(new URLSearchParams('page=2&search=a&faculty=T')));
});

test('each filter and page remains part of the public cache key', () => {
  const baseline = publicLectureQuery(new URLSearchParams());
  for (const key of ['search', 'faculty', 'sort', 'period_year', 'period_term', 'textbook', 'attendance',
    'grading_type', 'content_difficulty', 'content_quality']) {
    assert.notEqual(publicLectureQuery(new URLSearchParams({ [key]: 'filter' })), baseline, key);
  }
  assert.notEqual(publicLectureQuery(new URLSearchParams('page=2')), baseline);
});

test('invalid and oversized search values are rejected before fetching/caching', () => {
  for (const page of ['-1', '0', '10001', 'Infinity', '1.5', '1;DROP']) {
    assert.throws(() => publicLectureQuery(new URLSearchParams({ page })));
  }
  assert.throws(() => publicLectureQuery(new URLSearchParams({ search: 'a'.repeat(256) })));
});
