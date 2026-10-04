import { applyExamToCards, clampExamConfig, createExam, DEFAULT_EXAM_CONFIG, goTo, gradeExam, isCorrect, isExpired, isPinnedOption, orderOptions, selectOption, toggleFlag } from './exam';
import { presetParams } from './srs';
import { MIN } from './time';
import { mulberry32 } from './random';
import { makeCard, makeQ } from '../../test/fixtures';
import type { Question } from './types';

const NOW = 1_800_000_000_000;
const QS: Question[] = Array.from({ length: 20 }, (_, i) => makeQ(i + 1, i < 10 ? 1 : 2));
const byId = Object.fromEntries(QS.map((q) => [q.n, q])) as Record<number, Question>;

describe('tạo đề', () => {
  it('lấy đúng chương, đúng số câu, không trùng, hạn nộp = bắt đầu + số phút', () => {
    const ex = createExam(QS, { ...DEFAULT_EXAM_CONFIG, chapters: [2], count: 5 }, NOW, mulberry32(1));
    expect(ex.items).toHaveLength(5);
    expect(ex.items.every((it) => it.n > 10)).toBe(true);
    expect(new Set(ex.items.map((it) => it.n)).size).toBe(5);
    expect(ex.deadline).toBe(NOW + 60 * MIN);
    expect(ex).toMatchObject({ startedAt: NOW, answers: {}, flagged: [], current: 0 });
  });
  it('ít câu hơn số yêu cầu thì lấy hết', () => {
    expect(createExam(QS, { ...DEFAULT_EXAM_CONFIG, chapters: [1] }, NOW, mulberry32(1)).items).toHaveLength(10);
  });
  it('giới hạn số câu và số phút', () => {
    expect(clampExamConfig({ ...DEFAULT_EXAM_CONFIG, count: 999, minutes: 1 })).toMatchObject({ count: 200, minutes: 5 });
    expect(clampExamConfig({ ...DEFAULT_EXAM_CONFIG, count: 1, minutes: 999 })).toMatchObject({ count: 5, minutes: 180 });
  });
});

describe('trộn đáp án', () => {
  const q = makeQ(99, 1, { o: [['A', 'Tất cả các phương án'], ['B', 'x'], ['C', 'y'], ['D', 'Cả a và b'], ['E', 'z']] });
  it('nhận ra lựa chọn "Tất cả…" và "Cả …"', () => {
    expect(isPinnedOption(' Tất cả.')).toBe(true);
    expect(isPinnedOption('cả a và b')).toBe(true);
    expect(isPinnedOption('Cách mạng')).toBe(false);
  });
  it('các lựa chọn ghim luôn ở cuối, giữ thứ tự gốc', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const order = orderOptions(q, true, mulberry32(seed));
      expect(order.slice(-2)).toEqual(['A', 'D']);
      expect([...order].sort()).toEqual(['A', 'B', 'C', 'D', 'E']);
    }
  });
  it('tắt trộn thì giữ nguyên thứ tự', () => {
    expect(orderOptions(q, false, mulberry32(1))).toEqual(['A', 'B', 'C', 'D', 'E']);
  });
});

describe('làm bài', () => {
  const ex = createExam(QS, { ...DEFAULT_EXAM_CONFIG, count: 3, shuffleOptions: false }, NOW, mulberry32(3));
  const multi = makeQ(50, 1, { a: ['A', 'C'] });
  it('câu một đáp án: chọn thay thế, bấm lại thì bỏ chọn', () => {
    const q = byId[ex.items[0].n];
    let s = selectOption(ex, q, 'B');
    s = selectOption(s, q, 'C');
    expect(s.answers[q.n]).toEqual(['C']);
    expect(selectOption(s, q, 'C').answers[q.n]).toEqual([]);
  });
  it('câu nhiều đáp án: bật/tắt từng lựa chọn', () => {
    let s = selectOption(ex, multi, 'A');
    s = selectOption(s, multi, 'C');
    expect(s.answers[50]).toEqual(['A', 'C']);
    expect(selectOption(s, multi, 'A').answers[50]).toEqual(['C']);
  });
  it('đánh dấu và di chuyển', () => {
    const n0 = ex.items[0].n;
    expect(toggleFlag(ex).flagged).toEqual([n0]);
    expect(toggleFlag(toggleFlag(ex)).flagged).toEqual([]);
    expect(goTo(ex, 2).current).toBe(2);
    expect(goTo(ex, 99).current).toBe(2);
    expect(goTo(ex, -1).current).toBe(0);
  });
  it('hết giờ', () => {
    expect(isExpired(ex, ex.deadline - 1)).toBe(false);
    expect(isExpired(ex, ex.deadline)).toBe(true);
  });
});

describe('chấm điểm', () => {
  it('isCorrect yêu cầu trùng khớp tập đáp án', () => {
    const multi = makeQ(50, 1, { a: ['A', 'C'] });
    expect(isCorrect(multi, ['C', 'A'])).toBe(true);
    expect(isCorrect(multi, ['A'])).toBe(false);
    expect(isCorrect(multi, ['A', 'B'])).toBe(false);
    expect(isCorrect(multi, undefined)).toBe(false);
  });
  it('tính điểm /10, theo chương, câu bỏ trống là sai', () => {
    const ex = createExam(QS, { ...DEFAULT_EXAM_CONFIG, count: 20, shuffleOptions: false }, NOW, mulberry32(5));
    const answers: Record<number, string[]> = {};
    ex.items.forEach((it, i) => {
      if (i < 15) answers[it.n] = ['A'];
      else if (i < 18) answers[it.n] = ['B'];
    });
    const r = gradeExam({ ...ex, answers }, byId, NOW + 5 * MIN);
    expect(r).toMatchObject({ correct: 15, total: 20, score10: 7.5, answeredCount: 18, finishedAt: NOW + 5 * MIN, xp: 0, newBadges: [] });
    expect(r.wrong).toHaveLength(5);
    expect((r.byChapter[1]?.total ?? 0) + (r.byChapter[2]?.total ?? 0)).toBe(20);
  });
});

describe('đưa câu sai vào ôn tập', () => {
  it('thẻ mới thành learn, thẻ ôn thành relearn (quên +1), đến hạn ngay; thẻ không sai giữ nguyên', () => {
    const P = presetParams('cram');
    const kept = makeCard({ due: NOW + 999 });
    const cards = { 2: makeCard({ due: NOW + 5000, ivl: 2880 }), 3: kept };
    const next = applyExamToCards(cards, [1, 2], P, NOW);
    expect(next[1]).toMatchObject({ st: 'learn', step: 0, due: NOW });
    expect(next[2]).toMatchObject({ st: 'relearn', lapses: 1, due: NOW });
    expect(next[3]).toBe(kept);
  });
});
