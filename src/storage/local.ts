import type { Cards, DayState, QRange, SrsConfig, WrongMap } from '../domain/types';
import { DEFAULT_CONFIG } from '../domain/srs';
import { freshGame, type GameState } from '../domain/gamify';
import type { ExamResult, ExamSession } from '../domain/exam';
import { dayKey } from '../domain/time';
import type { Subject } from '../domain/subject';

export interface Snapshot {
  cards: Cards;
  cfg: SrsConfig;
  day: DayState;
  game: GameState;
  examCurrent: ExamSession | null;
  examHistory: ExamResult[];
  /** Câu gắn sao. */
  starred: number[];
  /** Câu đã làm sai, chưa làm đúng lại khi luyện câu sai. */
  wrong: WrongMap;
}
export type SnapshotKey = keyof Snapshot;
export const SNAPSHOT_KEYS: SnapshotKey[] = ['cards', 'cfg', 'day', 'game', 'examCurrent', 'examHistory', 'starred', 'wrong'];
/** Hậu tố key của từng phần. Key thật = `${subject.storagePrefix}.${hậu tố}`; riêng `game` dùng chung mọi môn. */
const SUFFIX: Record<SnapshotKey, string> = {
  cards: 'cards', cfg: 'cfg', day: 'day', game: 'game', examCurrent: 'exam.current', examHistory: 'exam.history', starred: 'starred', wrong: 'wrong',
};
export const GAME_KEY = 'hcm.v1.game';
export const ACTIVE_KEY = 'quiz.subject';
export const META_KEY = 'hcm.meta';
export const SCHEMA_VERSION = 1;

type StorageSubject = Pick<Subject, 'storagePrefix' | 'chapters'>;

export function keyFor(subject: Pick<Subject, 'storagePrefix'>, k: SnapshotKey): string {
  return k === 'game' ? GAME_KEY : `${subject.storagePrefix}.${SUFFIX[k]}`;
}

/** Interface lưu trữ theo môn. Sau này thêm bản Supabase chỉ cần cài đặt lại interface này. */
export interface AppStorage {
  load(subject: StorageSubject): Snapshot;
  save(subject: StorageSubject, patch: Partial<Snapshot>): void;
  flush(): void;
  loadActive(): string | null;
  saveActive(id: string): void;
}

export function defaultSnapshot(now: number, chapters: number[]): Snapshot {
  return {
    cards: {},
    cfg: { ...DEFAULT_CONFIG, steps: [...DEFAULT_CONFIG.steps], relearn: [...DEFAULT_CONFIG.relearn], chs: [...chapters] },
    day: { d: dayKey(now), newSeen: 0, done: 0, ok: 0 },
    game: freshGame(),
    examCurrent: null,
    examHistory: [],
    starred: [],
    wrong: {},
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

export function readStarred(v: unknown): number[] | null {
  return Array.isArray(v) ? [...new Set(v.filter((n): n is number => Number.isInteger(n)))] : null;
}

export function readWrong(v: unknown): WrongMap | null {
  if (!isObj(v)) return null;
  const out: WrongMap = {};
  for (const [k, c] of Object.entries(v)) if (/^\d+$/.test(k) && typeof c === 'number' && c > 0) out[Number(k)] = c;
  return out;
}

function validRange(v: unknown): QRange | null {
  return Array.isArray(v) && v.length === 2 && v.every(Number.isInteger) && v[0] <= v[1] ? [v[0], v[1]] : null;
}

/** Chỉ giữ chương có thật của môn; rỗng thì học mọi chương. */
function validChapters(chs: unknown, all: number[]): number[] {
  const kept = Array.isArray(chs) ? all.filter((c) => chs.includes(c)) : [];
  return kept.length ? kept : [...all];
}

function normalize(raw: Partial<Record<SnapshotKey, unknown>>, now: number, chapters: number[]): Snapshot {
  const d = defaultSnapshot(now, chapters);
  const cfg = isObj(raw.cfg) ? { ...d.cfg, ...(raw.cfg as Partial<SrsConfig>) } : d.cfg;
  return {
    cards: isObj(raw.cards) ? (raw.cards as Cards) : d.cards,
    cfg: { ...cfg, chs: validChapters(cfg.chs, chapters), range: validRange(cfg.range) },
    day: isObj(raw.day) ? { ...d.day, ...(raw.day as Partial<DayState>) } : d.day,
    game: isObj(raw.game) ? { ...d.game, ...(raw.game as Partial<GameState>) } : d.game,
    examCurrent: isObj(raw.examCurrent) ? (raw.examCurrent as unknown as ExamSession) : null,
    examHistory: Array.isArray(raw.examHistory) ? (raw.examHistory as ExamResult[]) : [],
    starred: readStarred(raw.starred) ?? [],
    wrong: readWrong(raw.wrong) ?? {},
  };
}

export interface LocalStorageOptions {
  delay?: number;
  onError?: (e: unknown) => void;
  now?: () => number;
  backend?: Storage;
}

export function createLocalStorage(opts: LocalStorageOptions = {}): AppStorage {
  const delay = opts.delay ?? 300;
  const now = opts.now ?? Date.now;
  const backend = () => opts.backend ?? window.localStorage;
  let pending: Record<string, unknown> = {};
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    const p = pending;
    pending = {};
    try {
      const b = backend();
      for (const [key, v] of Object.entries(p)) b.setItem(key, JSON.stringify(v));
      b.setItem(META_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION }));
    } catch (e) {
      opts.onError?.(e);
    }
  };

  return {
    load(subject) {
      const raw: Partial<Record<SnapshotKey, unknown>> = {};
      for (const k of SNAPSHOT_KEYS) {
        try {
          const key = keyFor(subject, k);
          const v = key in pending ? JSON.stringify(pending[key]) : backend().getItem(key);
          if (v != null) raw[k] = JSON.parse(v);
        } catch (e) {
          opts.onError?.(e);
        }
      }
      return normalize(raw, now(), subject.chapters.map((c) => c.id));
    },
    save(subject, patch) {
      for (const k of Object.keys(patch) as SnapshotKey[]) pending[keyFor(subject, k)] = patch[k];
      if (!timer) timer = setTimeout(flush, delay);
    },
    flush,
    loadActive() {
      try { return backend().getItem(ACTIVE_KEY); } catch { return null; }
    },
    saveActive(id) {
      try { backend().setItem(ACTIVE_KEY, id); } catch (e) { opts.onError?.(e); }
    },
  };
}
