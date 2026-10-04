import { computeCounts, isMature, pickNext, poolFor, type PickOptions } from './queue';
import { MIN } from './time';
import { makeCard, makeQ } from '../../test/fixtures';

const NOW = 1_800_000_000_000;
const pool = [makeQ(1), makeQ(2), makeQ(3), makeQ(4)];
const opts = (over: Partial<PickOptions> = {}): PickOptions => ({ newPerDay: 80, newSeen: 0, order: 'seq', ahead: false, rand: () => 0, ...over });

describe('poolFor / isMature', () => {
  it('lọc theo chương', () => {
    expect(poolFor([makeQ(1, 1), makeQ(2, 2), makeQ(3, 3)], [1, 3]).map((q) => q.n)).toEqual([1, 3]);
  });
  it('thuộc = review và khoảng cách ≥ 1 ngày', () => {
    expect(isMature(makeCard({ ivl: 1440 }))).toBe(true);
    expect(isMature(makeCard({ ivl: 240 }))).toBe(false);
    expect(isMature(makeCard({ st: 'learn' }))).toBe(false);
    expect(isMature(undefined)).toBe(false);
  });
});

describe('pickNext', () => {
  it('ưu tiên thẻ học lại đến hạn sớm nhất', () => {
    const cards = { 1: makeCard({ due: NOW - 1 }), 2: makeCard({ st: 'learn', due: NOW - 5 }), 3: makeCard({ st: 'relearn', due: NOW - 10 }) };
    expect(pickNext(pool, cards, NOW, opts())).toBe(3);
  });
  it('rồi tới thẻ ôn đến hạn sớm nhất', () => {
    const cards = { 1: makeCard({ due: NOW - 1 }), 2: makeCard({ due: NOW - 100 }) };
    expect(pickNext(pool, cards, NOW, opts())).toBe(2);
  });
  it('rồi tới thẻ mới: theo số câu, hoặc ngẫu nhiên', () => {
    const cards = { 1: makeCard({ due: NOW + 99 * MIN * 60 }) };
    expect(pickNext(pool, cards, NOW, opts())).toBe(2);
    expect(pickNext(pool, cards, NOW, opts({ order: 'random', rand: () => 0.99 }))).toBe(4);
  });
  it('hết hạn mức thẻ mới: lấy thẻ học sẽ đến hạn trong 20 phút, quá 20 phút thì không', () => {
    expect(pickNext(pool, { 1: makeCard({ st: 'learn', due: NOW + 10 * MIN }) }, NOW, opts({ newSeen: 80 }))).toBe(1);
    expect(pickNext(pool, { 1: makeCard({ st: 'learn', due: NOW + 30 * MIN }) }, NOW, opts({ newSeen: 80 }))).toBeNull();
  });
  it('học trước: lấy thẻ có hạn gần nhất', () => {
    const cards = { 1: makeCard({ due: NOW + 2 * 86_400_000 }), 2: makeCard({ due: NOW + 86_400_000 }) };
    expect(pickNext(pool, cards, NOW, opts({ newSeen: 80, ahead: true }))).toBe(2);
  });
});

describe('computeCounts', () => {
  it('đếm Mới / Học lại / Đến hạn / thuộc', () => {
    const cards = {
      1: makeCard({ st: 'learn', due: NOW - 1, ivl: undefined }),
      2: makeCard({ due: NOW - 1 }),
      3: makeCard({ due: NOW + 5 * MIN, ivl: 3 * 1440 }),
    };
    expect(computeCounts(pool, cards, NOW, 80, 79)).toEqual({ nw: 1, lr: 1, lrDue: 1, due: 1, later: NOW + 5 * MIN, mature: 2, newLeft: 1 });
  });
});
