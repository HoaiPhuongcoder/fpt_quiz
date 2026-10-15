import { SUBJECTS, subjectById } from './subjects';
import { roman } from '../domain/subject';

describe('sổ đăng ký môn', () => {
  it('có HCM202 và MLN131, id và tiền tố lưu trữ không trùng', () => {
    expect(SUBJECTS.map((s) => s.id)).toEqual(['hcm202', 'mln131']);
    expect(subjectById('hcm202')?.storagePrefix).toBe('hcm.v1');
    expect(new Set(SUBJECTS.map((s) => s.storagePrefix)).size).toBe(SUBJECTS.length);
    expect(subjectById('xyz')).toBeUndefined();
  });
  it('số La Mã', () => {
    expect([1, 4, 6, 7, 9, 10].map(roman)).toEqual(['I', 'IV', 'VI', 'VII', 'IX', 'X']);
  });
});

describe.each(SUBJECTS.map((s) => [s.code, s] as const))('dữ liệu %s', (_code, subject) => {
  const qs = subject.questions;
  const ids = new Set(qs.map((q) => q.n));
  const chs = subject.chapters.map((c) => c.id);

  it('số câu không trùng', () => {
    expect(ids.size).toBe(qs.length);
  });
  it('mỗi đáp án nằm trong các lựa chọn', () => {
    for (const q of qs) {
      const keys = q.o.map(([k]) => k);
      expect(q.a.length).toBeGreaterThan(0);
      for (const a of q.a) expect(keys).toContain(a);
    }
  });
  it('câu tương tự trỏ tới câu có thật, chương thuộc môn', () => {
    for (const q of qs) {
      for (const s of q.s) expect(ids.has(s)).toBe(true);
      expect(chs).toContain(q.c);
    }
  });
});

describe('HCM202', () => {
  const qs = subjectById('hcm202')!.questions;
  it('có đủ 645 câu, 2 câu nhiều đáp án, câu nào cũng có giải thích và mẹo', () => {
    expect(qs).toHaveLength(645);
    expect(qs.filter((q) => q.a.length > 1)).toHaveLength(2);
    for (const q of qs) {
      expect(q.y.length).toBeGreaterThan(0);
      expect(q.t.length).toBeGreaterThan(0);
    }
  });
});

describe('MLN131', () => {
  const qs = subjectById('mln131')!.questions;
  it('có đủ 445 câu, 23 câu nhiều đáp án, 7 chương', () => {
    expect(qs).toHaveLength(445);
    expect(qs.filter((q) => q.a.length > 1)).toHaveLength(23);
    expect(subjectById('mln131')!.chapters).toHaveLength(7);
  });
});
