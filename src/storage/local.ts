import type { Cards, DayState, SrsConfig } from '../domain/types';
import { DEFAULT_CONFIG } from '../domain/srs';
import { freshGame, type GameState } from '../domain/gamify';
import type { ExamResult, ExamSession } from '../domain/exam';
import { dayKey } from '../domain/time';

export interface Snapshot {
  cards: Cards;
  cfg: SrsConfig;
  day: DayState;
  game: GameState;
  examCurrent: ExamSession | null;
  examHistory: ExamResult[];
}
export type SnapshotKey = keyof Snapshot;
export const SNAPSHOT_KEYS: SnapshotKey[] = ['cards', 'cfg', 'day', 'game', 'examCurrent', 'examHistory'];
export const STORAGE_KEYS: Record<SnapshotKey, string> = {
  cards: 'hcm.v1.cards',
  cfg: 'hcm.v1.cfg',
  day: 'hcm.v1.day',
  game: 'hcm.v1.game',
  examCurrent: 'hcm.v1.exam.current',
  examHistory: 'hcm.v1.exam.history',
};
export const META_KEY = 'hcm.meta';
export const SCHEMA_VERSION = 1;

/** Interface lưu trữ. Sau này thêm bản Supabase chỉ cần cài đặt lại interface này. */
export interface AppStorage {
  load(): Snapshot;
  save(patch: Partial<Snapshot>): void;
  flush(): void;
}

export function defaultSnapshot(now: number): Snapshot {
  return {
    cards: {},
    cfg: { ...DEFAULT_CONFIG, steps: [...DEFAULT_CONFIG.steps], relearn: [...DEFAULT_CONFIG.relearn], chs: [...DEFAULT_CONFIG.chs] },
    day: { d: dayKey(now), newSeen: 0, done: 0, ok: 0 },
    game: freshGame(),
    examCurrent: null,
    examHistory: [],
  };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

function normalize(raw: Partial<Record<SnapshotKey, unknown>>, now: number): Snapshot {
  const d = defaultSnapshot(now);
  return {
    cards: isObj(raw.cards) ? (raw.cards as Cards) : d.cards,
    cfg: isObj(raw.cfg) ? { ...d.cfg, ...(raw.cfg as Partial<SrsConfig>) } : d.cfg,
    day: isObj(raw.day) ? { ...d.day, ...(raw.day as Partial<DayState>) } : d.day,
    game: isObj(raw.game) ? { ...d.game, ...(raw.game as Partial<GameState>) } : d.game,
    examCurrent: isObj(raw.examCurrent) ? (raw.examCurrent as unknown as ExamSession) : null,
    examHistory: Array.isArray(raw.examHistory) ? (raw.examHistory as ExamResult[]) : [],
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
  let pending: Partial<Snapshot> = {};
  let timer: ReturnType<typeof setTimeout> | null = null;

  const flush = () => {
    if (timer) { clearTimeout(timer); timer = null; }
    const p = pending;
    pending = {};
    try {
      const b = backend();
      for (const k of Object.keys(p) as SnapshotKey[]) b.setItem(STORAGE_KEYS[k], JSON.stringify(p[k]));
      b.setItem(META_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION }));
    } catch (e) {
      opts.onError?.(e);
    }
  };

  return {
    load() {
      const raw: Partial<Record<SnapshotKey, unknown>> = {};
      for (const k of SNAPSHOT_KEYS) {
        try {
          const v = backend().getItem(STORAGE_KEYS[k]);
          if (v != null) raw[k] = JSON.parse(v);
        } catch (e) {
          opts.onError?.(e);
        }
      }
      return normalize(raw, now());
    },
    save(patch) {
      pending = { ...pending, ...patch };
      if (!timer) timer = setTimeout(flush, delay);
    },
    flush,
  };
}
