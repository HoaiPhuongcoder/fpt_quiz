import type { Card, Cards, ChapterId, Question } from './types';
import { DAY, MIN } from './time';
import type { Rng } from './random';

export interface Counts { nw: number; lr: number; lrDue: number; due: number; later: number; mature: number; newLeft: number }
export interface PickOptions { newPerDay: number; newSeen: number; order: 'random' | 'seq'; ahead: boolean; rand: Rng }

export function poolFor(questions: Question[], chs: ChapterId[]): Question[] {
  return questions.filter((q) => chs.includes(q.c));
}

export function isMature(c: Card | undefined): boolean {
  return !!c && c.st === 'review' && (c.ivl ?? 0) >= DAY;
}

export function computeCounts(pool: Question[], cards: Cards, now: number, newPerDay: number, newSeen: number): Counts {
  let nw = 0, lr = 0, lrDue = 0, due = 0, later = Infinity, mature = 0;
  for (const q of pool) {
    const c = cards[q.n];
    if (!c) { nw++; continue; }
    if (c.st !== 'review') { lr++; if (c.due <= now) lrDue++; }
    else if (c.due <= now) due++;
    if (c.due > now) later = Math.min(later, c.due);
    if (isMature(c)) mature++;
  }
  return { nw, lr, lrDue, due, later, mature, newLeft: Math.max(0, Math.min(nw, newPerDay - newSeen)) };
}

/** Thứ tự giống QUIZ.html: học lại đến hạn → ôn đến hạn → mới → học lại trong 20 phút tới → (học trước) hạn gần nhất. */
export function pickNext(pool: Question[], cards: Cards, now: number, o: PickOptions): number | null {
  const ids = pool.map((q) => q.n);
  const byDue = (a: number, b: number) => cards[a].due - cards[b].due;
  const L = ids.filter((n) => cards[n] && cards[n].st !== 'review' && cards[n].due <= now).sort(byDue);
  if (L.length) return L[0];
  const R = ids.filter((n) => cards[n] && cards[n].st === 'review' && cards[n].due <= now).sort(byDue);
  if (R.length) return R[0];
  const F = ids.filter((n) => !cards[n]);
  if (F.length && o.newSeen < o.newPerDay) return o.order === 'random' ? F[Math.floor(o.rand() * F.length)] : F[0];
  const A = ids.filter((n) => cards[n] && cards[n].st !== 'review' && cards[n].due <= now + 20 * MIN).sort(byDue);
  if (A.length) return A[0];
  if (o.ahead) {
    const all = ids.filter((n) => cards[n]).sort(byDue);
    if (all.length) return all[0];
  }
  return null;
}
