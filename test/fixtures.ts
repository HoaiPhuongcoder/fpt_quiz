import type { Card, ChapterId, Question } from '../src/domain/types';
import { defaultSnapshot, type AppStorage, type Snapshot } from '../src/storage/local';

export function makeQ(n: number, c: ChapterId = 1, over: Partial<Question> = {}): Question {
  return {
    n,
    q: `Câu hỏi số ${n}`,
    o: [['A', `đáp án đúng ${n}`], ['B', `sai một ${n}`], ['C', `sai hai ${n}`], ['D', `sai ba ${n}`]],
    a: ['A'],
    c,
    y: `Vì sao ${n}`,
    t: `Mẹo ${n}`,
    s: [],
    ...over,
  };
}

export function makeCard(over: Partial<Card> = {}): Card {
  return { st: 'review', step: 0, ivl: 1440, ease: 2.5, due: 0, last: 0, reps: 1, log: [], ...over };
}

export function createMemoryStorage(initial: Partial<Snapshot> = {}, now = 0): AppStorage & { saved: Partial<Snapshot> } {
  const saved: Partial<Snapshot> = {};
  return {
    saved,
    load: () => ({ ...defaultSnapshot(now), ...initial }),
    save: (p) => { Object.assign(saved, p); },
    flush: () => {},
  };
}
