import type { Question } from './types';

export interface Chapter { id: number; title: string }

/** Một môn học: câu hỏi, chương và tiền tố key lưu trữ riêng của môn. */
export interface Subject {
  id: string;
  code: string;
  name: string;
  chapters: Chapter[];
  questions: Question[];
  storagePrefix: string;
}

const ROMAN: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

export function roman(n: number): string {
  let out = '';
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v; }
  return out;
}

export function chapterIds(s: Pick<Subject, 'chapters'>): number[] {
  return s.chapters.map((c) => c.id);
}
