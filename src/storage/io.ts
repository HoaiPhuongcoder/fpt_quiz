import type { Cards, SrsConfig } from '../domain/types';
import { freshGame, type GameState } from '../domain/gamify';
import type { ExamResult } from '../domain/exam';
import type { Snapshot } from './local';

export type ImportData = Pick<Snapshot, 'cards' | 'cfg' | 'game' | 'examHistory'>;
export type ImportResult = { ok: true; data: ImportData; legacy: boolean } | { ok: false; error: string };

export function exportData(s: ImportData): string {
  return JSON.stringify({ app: 'hcm202', v: 3, cards: s.cards, cfg: s.cfg, game: s.game, examHistory: s.examHistory });
}

function validCards(v: unknown): v is Cards {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false;
  return Object.entries(v).every(([k, c]) =>
    /^\d+$/.test(k) && typeof c === 'object' && c !== null &&
    typeof (c as { st?: unknown }).st === 'string' && typeof (c as { due?: unknown }).due === 'number');
}

/** Đọc cả định dạng mới (v3) và định dạng cũ {v:2, cards, cfg} của QUIZ.html. */
export function parseImport(text: string, current: ImportData): ImportResult {
  let o: unknown;
  try { o = JSON.parse(text.trim()); } catch { return { ok: false, error: 'Không đọc được dữ liệu. Hãy dán đúng đoạn đã xuất.' }; }
  if (typeof o !== 'object' || o === null) return { ok: false, error: 'Không đọc được dữ liệu. Hãy dán đúng đoạn đã xuất.' };
  const obj = o as Record<string, unknown>;
  if (!validCards(obj.cards)) return { ok: false, error: 'Dữ liệu không có tiến độ thẻ hợp lệ.' };
  const cfg = { ...current.cfg, ...(typeof obj.cfg === 'object' && obj.cfg ? (obj.cfg as Partial<SrsConfig>) : {}) };
  if (obj.app === 'hcm202' && obj.v === 3) {
    return {
      ok: true, legacy: false,
      data: {
        cards: obj.cards, cfg,
        game: { ...freshGame(), ...(typeof obj.game === 'object' && obj.game ? (obj.game as Partial<GameState>) : {}) },
        examHistory: Array.isArray(obj.examHistory) ? (obj.examHistory as ExamResult[]) : [],
      },
    };
  }
  return { ok: true, legacy: true, data: { cards: obj.cards, cfg, game: freshGame(), examHistory: current.examHistory } };
}
