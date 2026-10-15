import type { Card, ChapterId, Question } from '../src/domain/types';
import { defaultSnapshot, type AppStorage, type Snapshot } from '../src/storage/local';
import type { Subject } from '../src/domain/subject';

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

const CH = [1, 2, 3, 4, 5, 6].map((id) => ({ id, title: `Chương ${id}` }));

/** Môn thử: mặc định id 'hcm202', 6 chương, key lưu trữ cũ. */
export function makeSubject(questions: Question[] = [], over: Partial<Subject> = {}): Subject {
  return { id: 'hcm202', code: 'HCM202', name: 'Môn thử', chapters: CH, questions, storagePrefix: 'hcm.v1', ...over };
}

/**
 * Kho trong bộ nhớ. `initial` áp cho mọi môn (trừ khi có `bySubject`); `saved` là bản ghi gộp,
 * `savedBy[id]` là bản ghi theo từng môn (theo storagePrefix).
 */
export function createMemoryStorage(
  initial: Partial<Snapshot> = {}, now = 0, bySubject: Record<string, Partial<Snapshot>> = {},
): AppStorage & { saved: Partial<Snapshot>; savedBy: Record<string, Partial<Snapshot>>; active: string | null } {
  const saved: Partial<Snapshot> = {};
  const savedBy: Record<string, Partial<Snapshot>> = {};
  let game: Snapshot['game'] | undefined;
  const st = {
    saved,
    savedBy,
    active: null as string | null,
    load: (s: Pick<Subject, 'storagePrefix' | 'chapters'>): Snapshot => {
      const all = s.chapters.map((c) => c.id);
      const snap = { ...defaultSnapshot(now, all), ...(bySubject[s.storagePrefix] ?? initial), ...savedBy[s.storagePrefix], ...(game ? { game } : {}) };
      return snap.cfg.chs.length ? snap : { ...snap, cfg: { ...snap.cfg, chs: all } };
    },
    save: (s: Pick<Subject, 'storagePrefix'>, p: Partial<Snapshot>) => {
      Object.assign(saved, p);
      savedBy[s.storagePrefix] = { ...savedBy[s.storagePrefix], ...p };
      if (p.game) game = p.game;
    },
    flush: () => {},
    loadActive: () => st.active,
    saveActive: (id: string) => { st.active = id; },
  };
  return st;
}
