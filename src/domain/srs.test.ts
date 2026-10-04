import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DEFAULT_CONFIG, presetParams, schedule } from './srs';
import { legacyParams, legacySchedule } from '../../test/legacy';
import { mulberry32 } from './random';
import type { CardInput, Rating } from './types';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('srs', () => {
  it('preset giống hệt bản cũ', () => {
    expect(presetParams('cram')).toEqual(legacyParams('cram'));
    expect(presetParams('normal')).toEqual(legacyParams('normal'));
  });

  it('cấu hình mặc định: Thi gấp, 80 thẻ mới/ngày, cả 6 chương, ngẫu nhiên', () => {
    expect(DEFAULT_CONFIG).toMatchObject({ preset: 'cram', newPerDay: 80, chs: [1, 2, 3, 4, 5, 6], order: 'random', ...legacyParams('cram') });
  });

  it('thẻ mới bấm Được ở chế độ Thi gấp → bước 2, gặp lại sau 10 phút', () => {
    const now = 1_000_000;
    const [c, ivl] = schedule({ st: 'new' }, 3, presetParams('cram'), now);
    expect(c).toMatchObject({ st: 'learn', step: 1, ease: 2.5, reps: 1, due: now + 10 * 60_000, last: now });
    expect(ivl).toBe(10);
  });

  for (const id of ['cram', 'normal'] as const) {
    it(`cho kết quả giống hệt hàm schedule gốc (${id}, 200 chuỗi × 15 lần chấm)`, () => {
      const rand = mulberry32(id === 'cram' ? 1 : 2);
      const P = presetParams(id);
      for (let run = 0; run < 200; run++) {
        let a: CardInput = { st: 'new' };
        let b: CardInput = { st: 'new' };
        let now = 1_700_000_000_000;
        for (let i = 0; i < 15; i++) {
          const r = (1 + Math.floor(rand() * 4)) as Rating;
          vi.setSystemTime(now);
          const [la, livl] = legacySchedule(a, r, P);
          const [nb, nivl] = schedule(b, r, P, now);
          expect(nb).toEqual(la);
          expect(nivl).toBe(livl);
          a = la;
          b = nb;
          // Date.now() under fake timers always returns integer, so truncate due to match legacy behavior
          now = Math.trunc(nb.due);
        }
      }
    });
  }
});
