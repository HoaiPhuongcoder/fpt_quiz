import type { QRange, Question, WrongMap } from './types';

/** Nguồn câu của một lượt luyện tập (không đụng tới lịch ôn). */
export type DrillKind = 'wrong' | 'starred' | 'range' | 'exam';

export interface DrillSession {
  kind: DrillKind;
  queue: number[];
  /** Vị trí câu đang làm; bằng queue.length là đã xong. */
  i: number;
  picked: string[];
  shown: boolean;
  correct: boolean;
  combo: number;
  xp: number;
  right: number[];
  missed: number[];
}

export function newDrill(kind: DrillKind, queue: number[]): DrillSession {
  return { kind, queue, i: 0, picked: [], shown: false, correct: false, combo: 0, xp: 0, right: [], missed: [] };
}

/**
 * Chọn thêm một đáp án. Câu nhiều đáp án: chọn đúng một ý thì chờ chọn tiếp;
 * chọn sai hoặc đủ số ý thì `done` và chấm.
 */
export function pickOption(q: Question, picked: string[], key: string): { picked: string[]; done: boolean; correct: boolean } {
  const next = [...picked, key];
  if (q.a.includes(key) && next.length < q.a.length) return { picked: next, done: false, correct: false };
  const correct = next.length === q.a.length && next.every((k) => q.a.includes(k));
  return { picked: next, done: true, correct };
}

export function addWrong(w: WrongMap, ns: number[]): WrongMap {
  if (!ns.length) return w;
  const next = { ...w };
  for (const n of ns) next[n] = (next[n] ?? 0) + 1;
  return next;
}

export function removeWrong(w: WrongMap, n: number): WrongMap {
  if (!(n in w)) return w;
  const next = { ...w };
  delete next[n];
  return next;
}

/** Đổi chỗ nếu ngược, kẹp vào [lo, hi]; phủ hết thì trả null (không giới hạn). */
export function normalizeRange(r: QRange, lo: number, hi: number): QRange | null {
  const clamp = (v: number) => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(v) ? v : lo)));
  let a = clamp(r[0]), b = clamp(r[1]);
  if (a > b) [a, b] = [b, a];
  return a <= lo && b >= hi ? null : [a, b];
}

export function inRange(n: number, r: QRange | null): boolean {
  return !r || (n >= r[0] && n <= r[1]);
}
