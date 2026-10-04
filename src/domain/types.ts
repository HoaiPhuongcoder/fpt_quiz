export type ChapterId = 1 | 2 | 3 | 4 | 5 | 6;
export const CHAPTERS: ChapterId[] = [1, 2, 3, 4, 5, 6];
export const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'] as const;

export interface Question {
  n: number;
  q: string;
  o: [string, string][];
  a: string[];
  c: ChapterId;
  y: string;
  t: string;
  w?: string;
  s: number[];
}

export type Rating = 1 | 2 | 3 | 4;
export type CardStatus = 'new' | 'learn' | 'relearn' | 'review';
export type LogEntry = [ts: number, rating: Rating, ivlMin: number];

/** Trạng thái một thẻ đã học. Thẻ chưa có bản ghi = thẻ mới. ivl tính bằng phút, due/last bằng ms. */
export interface Card {
  st: CardStatus;
  step?: number;
  ivl?: number;
  ease: number;
  due: number;
  last: number;
  reps: number;
  lapses?: number;
  log: LogEntry[];
}
export type CardInput = Partial<Card> & { st: CardStatus };
export type Cards = Record<number, Card>;

export interface SrsParams {
  steps: number[];
  relearn: number[];
  grad: number;
  easy: number;
  cap: number;
  startEase: number;
  easyBonus: number;
  hardMul: number;
  ivlMod: number;
  lapsePct: number;
  minLapse: number;
}
export type PresetId = 'cram' | 'normal';
export interface SrsConfig extends SrsParams {
  preset: PresetId | 'custom';
  newPerDay: number;
  chs: ChapterId[];
  order: 'random' | 'seq';
}
export interface DayState {
  d: string;
  newSeen: number;
  done: number;
  ok: number;
}
