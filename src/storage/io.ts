import type { Cards, SrsConfig } from '../domain/types';
import { freshGame, type GameState } from '../domain/gamify';
import type { ExamResult } from '../domain/exam';

export interface SubjectData { cards: Cards; cfg: SrsConfig; examHistory: ExamResult[] }
/** Phần nhập của một môn; thiếu `examHistory` (bản cũ QUIZ.html) thì giữ lịch sử hiện có. */
export type SubjectImport = Omit<SubjectData, 'examHistory'> & { examHistory?: ExamResult[] };
export type ImportResult =
  | { ok: true; legacy: boolean; game?: GameState; subjects: Record<string, SubjectImport> }
  | { ok: false; error: string };

/** Môn nhận dữ liệu từ định dạng v3 và bản cũ QUIZ.html (khi đó app chỉ có HCM202). */
export const LEGACY_SUBJECT = 'hcm202';

export function exportAll(game: GameState, subjects: Record<string, SubjectData>): string {
  return JSON.stringify({ app: 'fpt-quiz', v: 4, game, subjects });
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function validCards(v: unknown): v is Cards {
  if (!isObj(v)) return false;
  return Object.entries(v).every(([k, c]) =>
    /^\d+$/.test(k) && isObj(c) && typeof c.st === 'string' && typeof c.due === 'number');
}

const readGame = (v: unknown): GameState => ({ ...freshGame(), ...(isObj(v) ? (v as Partial<GameState>) : {}) });
const readCfg = (v: unknown, cur: SrsConfig): SrsConfig => ({ ...cur, ...(isObj(v) ? (v as Partial<SrsConfig>) : {}) });
const readHistory = (v: unknown): ExamResult[] => (Array.isArray(v) ? (v as ExamResult[]) : []);

const BAD = 'Không đọc được dữ liệu. Hãy dán đúng đoạn đã xuất.';

/**
 * Đọc định dạng v4 (nhiều môn), v3 (`app: 'hcm202'`) và bản cũ {v:2, cards, cfg} của QUIZ.html.
 * `cfgFor(id)` trả cài đặt hiện tại của môn để bổ sung trường còn thiếu; môn không có trong `known` bị bỏ qua.
 */
export function parseImport(text: string, cfgFor: (id: string) => SrsConfig, known: readonly string[]): ImportResult {
  let o: unknown;
  try { o = JSON.parse(text.trim()); } catch { return { ok: false, error: BAD }; }
  if (!isObj(o)) return { ok: false, error: BAD };

  if (o.app === 'fpt-quiz' && o.v === 4) {
    if (!isObj(o.subjects)) return { ok: false, error: 'Dữ liệu không có tiến độ môn học hợp lệ.' };
    const subjects: Record<string, SubjectImport> = {};
    for (const [id, d] of Object.entries(o.subjects)) {
      if (!known.includes(id) || !isObj(d)) continue;
      if (!validCards(d.cards)) return { ok: false, error: `Tiến độ thẻ của môn ${id} không hợp lệ.` };
      subjects[id] = { cards: d.cards, cfg: readCfg(d.cfg, cfgFor(id)), examHistory: readHistory(d.examHistory) };
    }
    return { ok: true, legacy: false, game: readGame(o.game), subjects };
  }

  if (!validCards(o.cards)) return { ok: false, error: 'Dữ liệu không có tiến độ thẻ hợp lệ.' };
  const cfg = readCfg(o.cfg, cfgFor(LEGACY_SUBJECT));
  if (o.app === 'hcm202' && o.v === 3) {
    return { ok: true, legacy: false, game: readGame(o.game), subjects: { [LEGACY_SUBJECT]: { cards: o.cards, cfg, examHistory: readHistory(o.examHistory) } } };
  }
  return { ok: true, legacy: true, subjects: { [LEGACY_SUBJECT]: { cards: o.cards, cfg } } };
}
