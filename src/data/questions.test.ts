import { QUESTIONS, BY_ID } from './questions';

describe('dữ liệu HCM202', () => {
  it('có đủ 645 câu, số câu không trùng', () => {
    expect(QUESTIONS).toHaveLength(645);
    expect(new Set(QUESTIONS.map((q) => q.n)).size).toBe(645);
  });

  it('mỗi đáp án nằm trong các lựa chọn', () => {
    for (const q of QUESTIONS) {
      const keys = q.o.map(([k]) => k);
      expect(q.a.length).toBeGreaterThan(0);
      for (const a of q.a) expect(keys).toContain(a);
    }
  });

  it('câu tương tự trỏ tới câu có thật', () => {
    for (const q of QUESTIONS) for (const s of q.s) expect(BY_ID[s]).toBeDefined();
  });

  it('chương nằm trong 1..6, có giải thích và mẹo', () => {
    for (const q of QUESTIONS) {
      expect([1, 2, 3, 4, 5, 6]).toContain(q.c);
      expect(q.y.length).toBeGreaterThan(0);
      expect(q.t.length).toBeGreaterThan(0);
    }
  });

  it('có 2 câu nhiều đáp án', () => {
    expect(QUESTIONS.filter((q) => q.a.length > 1)).toHaveLength(2);
  });
});
