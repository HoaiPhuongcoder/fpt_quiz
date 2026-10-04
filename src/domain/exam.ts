import type { Cards, ChapterId, Question, SrsParams } from './types';
import { CHAPTERS } from './types';
import { MIN } from './time';
import { schedule } from './srs';
import type { Rng } from './random';

export interface ExamConfig { count: number; minutes: number; chapters: ChapterId[]; shuffleOptions: boolean }
export interface ExamItem { n: number; order: string[] }
export interface ExamSession {
  id: string; config: ExamConfig; startedAt: number; deadline: number;
  items: ExamItem[]; answers: Record<number, string[]>; flagged: number[]; current: number;
}
export interface ChapterScore { correct: number; total: number }
export interface ExamResult {
  id: string; startedAt: number; finishedAt: number; score10: number; correct: number; total: number; answeredCount: number;
  byChapter: Partial<Record<ChapterId, ChapterScore>>; items: ExamItem[]; answers: Record<number, string[]>;
  wrong: number[]; xp: number; newBadges: string[];
}

export const DEFAULT_EXAM_CONFIG: ExamConfig = { count: 50, minutes: 60, chapters: [...CHAPTERS], shuffleOptions: true };
export const LETTERS = ['A', 'B', 'C', 'D', 'E'];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(Number.isFinite(v) ? v : lo)));
export function clampExamConfig(c: ExamConfig): ExamConfig {
  return { ...c, count: clamp(c.count, 5, 200), minutes: clamp(c.minutes, 5, 180) };
}

export function shuffle<T>(arr: readonly T[], rand: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Lựa chọn kiểu "Tất cả…" / "Cả a và b" phải đứng cuối khi trộn. */
export function isPinnedOption(text: string): boolean {
  return /^(tất cả|cả )/iu.test(text.trim());
}

export function orderOptions(q: Question, shuffleOn: boolean, rand: Rng): string[] {
  if (!shuffleOn) return q.o.map(([k]) => k);
  const free = q.o.filter(([, t]) => !isPinnedOption(t)).map(([k]) => k);
  const pinned = q.o.filter(([, t]) => isPinnedOption(t)).map(([k]) => k);
  return [...shuffle(free, rand), ...pinned];
}

export function createExam(questions: Question[], config: ExamConfig, now: number, rand: Rng): ExamSession {
  const pool = questions.filter((q) => config.chapters.includes(q.c));
  const picked = shuffle(pool, rand).slice(0, Math.min(config.count, pool.length));
  return {
    id: `exam-${now}`, config, startedAt: now, deadline: now + config.minutes * MIN,
    items: picked.map((q) => ({ n: q.n, order: orderOptions(q, config.shuffleOptions, rand) })),
    answers: {}, flagged: [], current: 0,
  };
}

export function selectOption(s: ExamSession, q: Question, key: string): ExamSession {
  const prev = s.answers[q.n] ?? [];
  const next = q.a.length > 1
    ? (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])
    : (prev[0] === key ? [] : [key]);
  return { ...s, answers: { ...s.answers, [q.n]: next } };
}

export function toggleFlag(s: ExamSession): ExamSession {
  const n = s.items[s.current].n;
  return { ...s, flagged: s.flagged.includes(n) ? s.flagged.filter((x) => x !== n) : [...s.flagged, n] };
}

export function goTo(s: ExamSession, index: number): ExamSession {
  return { ...s, current: Math.max(0, Math.min(s.items.length - 1, index)) };
}

export function isCorrect(q: Question, picked: string[] | undefined): boolean {
  return !!picked && picked.length === q.a.length && picked.every((k) => q.a.includes(k));
}

export function isExpired(s: ExamSession, now: number): boolean {
  return now >= s.deadline;
}

export function gradeExam(s: ExamSession, byId: Record<number, Question>, now: number): ExamResult {
  let correct = 0, answeredCount = 0;
  const wrong: number[] = [];
  const byChapter: Partial<Record<ChapterId, ChapterScore>> = {};
  for (const { n } of s.items) {
    const q = byId[n];
    const picked = s.answers[n];
    if (picked && picked.length) answeredCount++;
    const ok = isCorrect(q, picked);
    const ch = byChapter[q.c] ?? { correct: 0, total: 0 };
    byChapter[q.c] = { correct: ch.correct + (ok ? 1 : 0), total: ch.total + 1 };
    if (ok) correct++;
    else wrong.push(n);
  }
  const total = s.items.length;
  return {
    id: s.id, startedAt: s.startedAt, finishedAt: now, score10: total ? Math.round((correct / total) * 100) / 10 : 0,
    correct, total, answeredCount, byChapter, items: s.items, answers: s.answers, wrong, xp: 0, newBadges: [],
  };
}

/** Câu sai/bỏ trống: chấm như "Lại" rồi đặt đến hạn ngay. Câu khác giữ nguyên. */
export function applyExamToCards(cards: Cards, wrong: number[], P: SrsParams, now: number): Cards {
  const next = { ...cards };
  for (const n of wrong) {
    const [c] = schedule(cards[n] ?? { st: 'new' }, 1, P, now);
    next[n] = { ...c, due: now };
  }
  return next;
}
